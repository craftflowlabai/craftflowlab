-- Guest bookings and handoffs created through the public AI Receptionist.
-- Public clients can only invoke the narrow, validated RPCs below; the tables
-- themselves remain private to active administrators.

create table public.guest_bookings (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions (id) on delete restrict,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 100),
  phone text not null,
  phone_normalized text not null,
  email text,
  status text not null default 'confirmed'
    check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
  price_snapshot numeric(10, 2) not null check (price_snapshot >= 0),
  currency text not null check (char_length(currency) = 3),
  booked_at timestamptz not null default now(),
  reminder_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint guest_bookings_email_valid check (
    email is null or (char_length(email) <= 254 and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
  )
);

create unique index guest_bookings_one_active_per_session_phone_idx
  on public.guest_bookings (session_id, phone_normalized)
  where status in ('confirmed', 'completed');
create index guest_bookings_session_status_idx
  on public.guest_bookings (session_id, status);
create index guest_bookings_reminder_due_idx
  on public.guest_bookings (booked_at)
  where status = 'confirmed' and reminder_sent_at is null;

create trigger guest_bookings_set_updated_at
  before update on public.guest_bookings
  for each row execute function public.set_updated_at();

alter table public.guest_bookings enable row level security;
revoke all on public.guest_bookings from anon, authenticated;
grant select, update on public.guest_bookings to authenticated;
create policy guest_bookings_admin_read on public.guest_bookings
  for select to authenticated using ((select public.current_user_is_admin()));
create policy guest_bookings_admin_update on public.guest_bookings
  for update to authenticated
  using ((select public.current_user_is_admin()))
  with check ((select public.current_user_is_admin()));

create table public.receptionist_handoffs (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 100),
  phone text not null,
  phone_normalized text not null,
  email text,
  message text not null default '' check (char_length(message) <= 1200),
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint receptionist_handoffs_email_valid check (
    email is null or (char_length(email) <= 254 and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
  )
);
create index receptionist_handoffs_open_created_idx
  on public.receptionist_handoffs (created_at desc)
  where status <> 'resolved';
alter table public.receptionist_handoffs enable row level security;
revoke all on public.receptionist_handoffs from anon, authenticated;
grant select, update on public.receptionist_handoffs to authenticated;
create policy receptionist_handoffs_admin_read on public.receptionist_handoffs
  for select to authenticated using ((select public.current_user_is_admin()));
create policy receptionist_handoffs_admin_update on public.receptionist_handoffs
  for update to authenticated
  using ((select public.current_user_is_admin()))
  with check ((select public.current_user_is_admin()));

create or replace function public.create_guest_booking(
  p_session_id uuid,
  p_full_name text,
  p_phone text,
  p_email text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.sessions%rowtype;
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_name text := btrim(coalesce(p_full_name, ''));
  v_booking_id uuid;
begin
  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    raise exception 'Please enter a valid name.' using errcode = '22023';
  end if;
  if v_phone !~ '^\+?[0-9]{8,15}$' then
    raise exception 'Please enter a valid phone number.' using errcode = '22023';
  end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;

  select * into v_session
  from public.sessions
  where id = p_session_id
  for update;

  if not found or v_session.status <> 'published' or v_session.starts_at <= now() then
    raise exception 'This session is no longer available.' using errcode = 'P0001';
  end if;
  if v_session.booked_slots >= v_session.max_slots then
    raise exception 'This session is full.' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.guest_bookings g
    where g.session_id = p_session_id
      and g.phone_normalized = v_phone
      and g.status = 'confirmed'
  ) then
    raise exception 'This phone already has a booking for this session.' using errcode = '23505';
  end if;
  if exists (
    select 1 from public.guest_bookings g
    where g.phone_normalized = v_phone
      and g.booked_at > now() - interval '10 minutes'
      and g.status = 'confirmed'
  ) then
    raise exception 'Please wait before making another booking.' using errcode = 'P0001';
  end if;

  insert into public.guest_bookings (
    session_id, full_name, phone, phone_normalized, email, price_snapshot, currency
  ) values (
    p_session_id, v_name, btrim(p_phone), v_phone, v_email, v_session.price, v_session.currency
  ) returning id into v_booking_id;

  update public.sessions
  set booked_slots = booked_slots + 1
  where id = p_session_id;

  insert into public.notifications (recipient_id, notification_type, title, message, href)
  select p.id, 'receptionist_booking', 'New AI Receptionist booking',
    v_name || ' booked ' || v_session.title || ' · ' || to_char(v_session.starts_at at time zone 'Europe/Sofia', 'Dy, DD Mon, HH24:MI'),
    '/admin/receptionist'
  from public.profiles p
  where p.role = 'admin' and p.account_status = 'active';

  return v_booking_id;
end;
$$;

create or replace function public.submit_receptionist_handoff(
  p_full_name text,
  p_phone text,
  p_email text default null,
  p_message text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_phone text := regexp_replace(coalesce(p_phone, ''), '[^0-9+]', '', 'g');
  v_email text := nullif(lower(btrim(coalesce(p_email, ''))), '');
  v_name text := btrim(coalesce(p_full_name, ''));
  v_message text := btrim(coalesce(p_message, ''));
  v_handoff_id uuid;
begin
  if char_length(v_name) < 2 or char_length(v_name) > 100 then
    raise exception 'Please enter a valid name.' using errcode = '22023';
  end if;
  if v_phone !~ '^\+?[0-9]{8,15}$' then
    raise exception 'Please enter a valid phone number.' using errcode = '22023';
  end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$') then
    raise exception 'Please enter a valid email address.' using errcode = '22023';
  end if;
  if char_length(v_message) > 1200 then
    raise exception 'Please shorten the message.' using errcode = '22023';
  end if;
  if (
    select count(*) from public.receptionist_handoffs h
    where h.phone_normalized = v_phone and h.created_at > now() - interval '1 hour'
  ) >= 3 then
    raise exception 'Please wait before sending another request.' using errcode = 'P0001';
  end if;

  insert into public.receptionist_handoffs (full_name, phone, phone_normalized, email, message)
  values (v_name, btrim(p_phone), v_phone, v_email, v_message)
  returning id into v_handoff_id;

  insert into public.notifications (recipient_id, notification_type, title, message, href)
  select p.id, 'receptionist_handoff', 'A visitor requested a person',
    v_name || ' · ' || coalesce(nullif(v_message, ''), 'Please follow up with this visitor.'),
    '/admin/receptionist'
  from public.profiles p
  where p.role = 'admin' and p.account_status = 'active';

  return v_handoff_id;
end;
$$;

revoke all on function public.create_guest_booking(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.create_guest_booking(uuid, text, text, text) to anon;
revoke all on function public.submit_receptionist_handoff(text, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_receptionist_handoff(text, text, text, text) to anon;
