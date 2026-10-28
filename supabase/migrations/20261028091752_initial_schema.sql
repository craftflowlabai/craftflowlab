-- Session Booker Pro initial schema.
-- Public roles are deliberately limited; mutations that affect capacity or roles
-- go through narrowly scoped functions.

create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text,
  avatar_path text,
  role text not null default 'user' check (role in ('user', 'client', 'admin')),
  account_status text not null default 'active'
    check (account_status in ('active', 'pending_review', 'rejected', 'banned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.session_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  duration_minutes integer not null default 60 check (duration_minutes > 0),
  default_capacity integer not null default 1 check (default_capacity > 0),
  default_price numeric(10, 2) not null default 0 check (default_price >= 0),
  currency text not null default 'EUR' check (char_length(currency) = 3),
  category text not null default 'training',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  session_type_id uuid references public.session_types (id) on delete set null,
  title text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null default 'Europe/Sofia',
  max_slots integer not null default 1 check (max_slots > 0),
  booked_slots integer not null default 0 check (booked_slots >= 0),
  price numeric(10, 2) not null default 0 check (price >= 0),
  currency text not null default 'EUR' check (char_length(currency) = 3),
  location text not null default 'Studio North',
  status text not null default 'draft'
    check (status in ('draft', 'published', 'cancelled', 'completed')),
  cancelled_at timestamptz,
  cancel_reason text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sessions_valid_time check (ends_at > starts_at),
  constraint sessions_capacity_not_exceeded check (booked_slots <= max_slots)
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete restrict,
  session_id uuid not null references public.sessions (id) on delete restrict,
  status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'cancelled', 'rejected', 'completed', 'no_show')),
  price_snapshot numeric(10, 2) not null check (price_snapshot >= 0),
  currency text not null check (char_length(currency) = 3),
  booked_at timestamptz not null default now(),
  cancelled_at timestamptz,
  cancel_reason text,
  decided_at timestamptz,
  decided_by uuid references public.profiles (id) on delete set null,
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  event_type text not null,
  old_status text,
  new_status text,
  reason text,
  created_at timestamptz not null default now()
);

create table public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  target_type text not null,
  target_id uuid,
  reason text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index sessions_public_start_idx on public.sessions (starts_at)
  where status = 'published';
create index sessions_type_start_idx on public.sessions (session_type_id, starts_at);
create index bookings_user_booked_idx on public.bookings (user_id, booked_at desc);
create index bookings_session_status_idx on public.bookings (session_id, status);
create index booking_events_booking_time_idx on public.booking_events (booking_id, created_at desc);
create index admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create unique index bookings_one_active_per_session_idx
  on public.bookings (user_id, session_id)
  where status in ('pending', 'confirmed');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger session_types_set_updated_at before update on public.session_types
  for each row execute function public.set_updated_at();
create trigger sessions_set_updated_at before update on public.sessions
  for each row execute function public.set_updated_at();
create trigger bookings_set_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role, account_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'user',
    'active'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;
grant execute on function public.handle_new_user() to supabase_auth_admin;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.current_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
      and p.account_status = 'active'
  );
$$;

revoke all on function public.current_user_is_admin() from public, anon;
grant execute on function public.current_user_is_admin() to authenticated;

create or replace function public.book_for_session(p_session_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking_id uuid;
  v_status text;
  v_start timestamptz;
  v_price numeric(10, 2);
  v_currency text;
  v_capacity integer;
  v_booked integer;
  v_account_status text;
begin
  if v_user_id is null then
    raise exception 'Please sign in before booking.' using errcode = '28000';
  end if;

  select p.account_status into v_account_status
  from public.profiles p where p.id = v_user_id;
  if v_account_status is distinct from 'active' then
    raise exception 'This account is not allowed to book sessions.' using errcode = '42501';
  end if;

  select s.status, s.starts_at, s.price, s.currency, s.max_slots, s.booked_slots
    into v_status, v_start, v_price, v_currency, v_capacity, v_booked
  from public.sessions s
  where s.id = p_session_id
  for update;

  if not found or v_status <> 'published' or v_start <= now() then
    raise exception 'This session is not available to book.' using errcode = 'P0001';
  end if;
  if v_booked >= v_capacity then
    raise exception 'This session is full.' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.bookings b
    where b.user_id = v_user_id and b.session_id = p_session_id
      and b.status in ('pending', 'confirmed')
  ) then
    raise exception 'You already have an active booking for this session.' using errcode = '23505';
  end if;

  insert into public.bookings (user_id, session_id, status, price_snapshot, currency)
  values (v_user_id, p_session_id, 'confirmed', v_price, v_currency)
  returning id into v_booking_id;

  update public.sessions set booked_slots = booked_slots + 1 where id = p_session_id;
  update public.profiles set role = 'client' where id = v_user_id and role = 'user';

  insert into public.booking_events (booking_id, actor_id, event_type, new_status)
  values (v_booking_id, v_user_id, 'booking_created', 'confirmed');

  return v_booking_id;
end;
$$;

revoke all on function public.book_for_session(uuid) from public, anon;
grant execute on function public.book_for_session(uuid) to authenticated;

create or replace function public.cancel_own_booking(p_booking_id uuid, p_reason text default null)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_session_start timestamptz;
begin
  if v_user_id is null then
    raise exception 'Please sign in to manage bookings.' using errcode = '28000';
  end if;

  select b.* into v_booking
  from public.bookings b
  where b.id = p_booking_id and b.user_id = v_user_id
  for update;
  if not found or v_booking.status not in ('pending', 'confirmed') then
    raise exception 'This booking cannot be cancelled.' using errcode = 'P0001';
  end if;

  select s.starts_at into v_session_start
  from public.sessions s where s.id = v_booking.session_id for update;
  if v_session_start <= now() then
    raise exception 'A session that has started cannot be cancelled.' using errcode = 'P0001';
  end if;

  update public.bookings
  set status = 'cancelled', cancelled_at = now(), cancel_reason = nullif(trim(p_reason), '')
  where id = p_booking_id;
  update public.sessions set booked_slots = greatest(0, booked_slots - 1)
  where id = v_booking.session_id;
  insert into public.booking_events (booking_id, actor_id, event_type, old_status, new_status, reason)
  values (p_booking_id, v_user_id, 'booking_cancelled', v_booking.status, 'cancelled', nullif(trim(p_reason), ''));
  return true;
end;
$$;

revoke all on function public.cancel_own_booking(uuid, text) from public, anon;
grant execute on function public.cancel_own_booking(uuid, text) to authenticated;

create or replace function public.admin_set_booking_status(
  p_booking_id uuid,
  p_new_status text,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_booking public.bookings%rowtype;
  v_session public.sessions%rowtype;
begin
  if auth.uid() is null or not public.current_user_is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;
  if p_new_status not in ('pending', 'confirmed', 'cancelled', 'rejected', 'completed', 'no_show') then
    raise exception 'Invalid booking status.' using errcode = '22023';
  end if;

  select b.* into v_booking from public.bookings b where b.id = p_booking_id for update;
  if not found then raise exception 'Booking not found.' using errcode = 'P0002'; end if;
  select s.* into v_session from public.sessions s where s.id = v_booking.session_id for update;

  if v_booking.status in ('pending', 'confirmed') and p_new_status not in ('pending', 'confirmed') then
    update public.sessions set booked_slots = greatest(0, booked_slots - 1) where id = v_booking.session_id;
  elsif v_booking.status not in ('pending', 'confirmed') and p_new_status in ('pending', 'confirmed') then
    if v_session.status <> 'published' or v_session.booked_slots >= v_session.max_slots then
      raise exception 'No available space for this booking.' using errcode = 'P0001';
    end if;
    update public.sessions set booked_slots = booked_slots + 1 where id = v_booking.session_id;
  end if;

  update public.bookings
  set status = p_new_status,
      decided_at = now(),
      decided_by = auth.uid(),
      cancelled_at = case when p_new_status = 'cancelled' then now() else cancelled_at end,
      cancel_reason = case when p_new_status in ('cancelled', 'rejected') then nullif(trim(p_reason), '') else cancel_reason end,
      admin_note = case when p_reason is not null then p_reason else admin_note end
  where id = p_booking_id;

  insert into public.booking_events (booking_id, actor_id, event_type, old_status, new_status, reason)
  values (p_booking_id, auth.uid(), 'admin_status_changed', v_booking.status, p_new_status, nullif(trim(p_reason), ''));
  insert into public.admin_audit_log (actor_id, action, target_type, target_id, reason)
  values (auth.uid(), 'booking_status_changed', 'booking', p_booking_id, nullif(trim(p_reason), ''));
  return true;
end;
$$;

revoke all on function public.admin_set_booking_status(uuid, text, text) from public, anon;
grant execute on function public.admin_set_booking_status(uuid, text, text) to authenticated;

create or replace function public.admin_set_user_access(
  p_user_id uuid,
  p_role text,
  p_account_status text,
  p_reason text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_role text;
  v_old_status text;
begin
  if auth.uid() is null or not public.current_user_is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;
  if p_role not in ('user', 'client', 'admin') or
     p_account_status not in ('active', 'pending_review', 'rejected', 'banned') then
    raise exception 'Invalid role or account status.' using errcode = '22023';
  end if;

  select role, account_status into v_old_role, v_old_status
  from public.profiles where id = p_user_id for update;
  if not found then raise exception 'Profile not found.' using errcode = 'P0002'; end if;
  if p_user_id = auth.uid() and p_role <> 'admin' then
    raise exception 'You cannot remove your own admin role.' using errcode = '42501';
  end if;

  update public.profiles set role = p_role, account_status = p_account_status where id = p_user_id;
  insert into public.admin_audit_log (actor_id, action, target_type, target_id, reason, details)
  values (
    auth.uid(), 'user_access_changed', 'profile', p_user_id, nullif(trim(p_reason), ''),
    jsonb_build_object('old_role', v_old_role, 'new_role', p_role,
      'old_account_status', v_old_status, 'new_account_status', p_account_status)
  );
  return true;
end;
$$;

revoke all on function public.admin_set_user_access(uuid, text, text, text) from public, anon;
grant execute on function public.admin_set_user_access(uuid, text, text, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.session_types enable row level security;
alter table public.sessions enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_events enable row level security;
alter table public.admin_audit_log enable row level security;

revoke all on public.profiles, public.session_types, public.sessions,
  public.bookings, public.booking_events, public.admin_audit_log from anon, authenticated;

grant select on public.profiles to authenticated;
grant update (full_name, phone, avatar_path) on public.profiles to authenticated;
grant select on public.session_types, public.sessions to anon, authenticated;
grant insert, update, delete on public.session_types, public.sessions to authenticated;
grant select on public.bookings, public.booking_events, public.admin_audit_log to authenticated;
grant update on public.bookings to authenticated;

create policy profiles_read_own_or_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.current_user_is_admin()));
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and account_status = 'active')
  with check (id = (select auth.uid()) and account_status = 'active');
create policy profiles_admin_update on public.profiles
  for update to authenticated
  using ((select public.current_user_is_admin()))
  with check ((select public.current_user_is_admin()));

create policy session_types_public_active on public.session_types
  for select to anon, authenticated using (is_active or (select public.current_user_is_admin()));
create policy session_types_admin_manage on public.session_types
  for all to authenticated
  using ((select public.current_user_is_admin()))
  with check ((select public.current_user_is_admin()));

create policy sessions_public_published on public.sessions
  for select to anon, authenticated
  using (status = 'published' or (select public.current_user_is_admin()));
create policy sessions_admin_manage on public.sessions
  for all to authenticated
  using ((select public.current_user_is_admin()))
  with check ((select public.current_user_is_admin()));

create policy bookings_read_own_or_admin on public.bookings
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.current_user_is_admin()));
create policy bookings_admin_update on public.bookings
  for update to authenticated
  using ((select public.current_user_is_admin()))
  with check ((select public.current_user_is_admin()));

create policy booking_events_read_own_or_admin on public.booking_events
  for select to authenticated
  using (
    (select public.current_user_is_admin()) or exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.user_id = (select auth.uid())
    )
  );
create policy admin_audit_read_admin on public.admin_audit_log
  for select to authenticated using ((select public.current_user_is_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy avatars_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'avatars');
create policy avatars_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_owner_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy avatars_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

insert into public.session_types (slug, title, description, duration_minutes, default_capacity, default_price, currency, category)
values
  ('strength-foundations', 'Strength Foundations', 'Build confident movement patterns and a base of strength with focused coaching.', 60, 8, 24, 'EUR', 'Strength'),
  ('one-to-one-coaching', 'One-to-One Coaching', 'A fully personal session shaped around your goals, pace, and training history.', 50, 1, 55, 'EUR', 'Personal'),
  ('mobility-reset', 'Mobility Reset', 'A guided mobility and recovery session to help you move better between training days.', 45, 6, 20, 'EUR', 'Recovery')
on conflict (slug) do nothing;

insert into public.sessions (session_type_id, title, description, starts_at, ends_at, timezone, max_slots, price, currency, location, status)
select st.id, seed.title, seed.description, now() + seed.offset_start, now() + seed.offset_start + make_interval(mins => st.duration_minutes),
  'Europe/Sofia', seed.capacity, seed.price, st.currency, seed.location, 'published'
from (values
  ('strength-foundations', 'Strength Foundations · Small Group', 'A welcoming coached session for building strength with clear progressions.', interval '1 day', 8, 24::numeric, 'Studio North'),
  ('one-to-one-coaching', 'Personal Training · 1:1', 'Dedicated coaching with a plan shaped around your training goals.', interval '2 days', 1, 55::numeric, 'Studio North'),
  ('mobility-reset', 'Mobility Reset · Evening', 'A low-pressure reset for your joints, posture, and recovery routine.', interval '3 days', 6, 20::numeric, 'Studio North')
) as seed(type_slug, title, description, offset_start, capacity, price, location)
join public.session_types st on st.slug = seed.type_slug;
