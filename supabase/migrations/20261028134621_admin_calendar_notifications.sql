-- Admin calendar, audited catalog changes, and opt-in live notifications.

create table public.session_audit_log (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (action in ('created', 'updated', 'deleted')),
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz not null default now()
);
create index session_audit_log_session_time_idx on public.session_audit_log (session_id, created_at desc);
create index session_audit_log_actor_idx on public.session_audit_log (actor_id);
alter table public.session_audit_log enable row level security;
revoke all on public.session_audit_log from anon, authenticated;
grant select on public.session_audit_log to authenticated;
create policy session_audit_read_admin on public.session_audit_log
  for select to authenticated using ((select public.current_user_is_admin()));

create or replace function public.audit_session_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.session_audit_log (session_id, actor_id, action, new_values)
    values (new.id, auth.uid(), 'created', to_jsonb(new) - 'booked_slots');
    return new;
  elsif tg_op = 'UPDATE' then
    insert into public.session_audit_log (session_id, actor_id, action, old_values, new_values)
    values (new.id, auth.uid(), 'updated', to_jsonb(old) - 'booked_slots', to_jsonb(new) - 'booked_slots');
    return new;
  else
    insert into public.session_audit_log (session_id, actor_id, action, old_values)
    values (old.id, auth.uid(), 'deleted', to_jsonb(old) - 'booked_slots');
    return old;
  end if;
end;
$$;
revoke all on function public.audit_session_changes() from public, anon, authenticated;
create trigger sessions_audit_changes
  after insert or update or delete on public.sessions
  for each row execute function public.audit_session_changes();

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  notification_type text not null,
  title text not null,
  message text not null default '',
  href text not null default '/dashboard',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_recipient_created_idx on public.notifications (recipient_id, created_at desc);
alter table public.notifications enable row level security;
revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy notifications_read_own on public.notifications
  for select to authenticated using (recipient_id = (select auth.uid()));
create policy notifications_update_own on public.notifications
  for update to authenticated using (recipient_id = (select auth.uid()))
  with check (recipient_id = (select auth.uid()));

create or replace function public.notify_booking_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_title text;
  v_session_start timestamptz;
  v_title text;
  v_message text;
begin
  select s.title, s.starts_at into v_session_title, v_session_start
  from public.sessions s where s.id = new.session_id;

  if tg_op = 'INSERT' then
    insert into public.notifications (recipient_id, notification_type, title, message, href)
    values (new.user_id, 'booking_created', 'Booking confirmed',
      coalesce(v_session_title, 'Your session') || ' · ' || to_char(v_session_start at time zone 'Europe/Sofia', 'Dy, DD Mon, HH24:MI'), '/client');

    insert into public.notifications (recipient_id, notification_type, title, message, href)
    select p.id, 'booking_created', 'New booking',
      coalesce((select full_name from public.profiles where id = new.user_id), 'A client') || ' booked ' || coalesce(v_session_title, 'a session'), '/admin/bookings'
    from public.profiles p where p.role = 'admin' and p.account_status = 'active';
  elsif new.status is distinct from old.status then
    v_title := case new.status
      when 'confirmed' then 'Booking confirmed'
      when 'cancelled' then 'Booking cancelled'
      when 'rejected' then 'Booking declined'
      when 'completed' then 'Session completed'
      when 'no_show' then 'Booking marked no-show'
      else 'Booking updated'
    end;
    v_message := coalesce(v_session_title, 'Your session') || ' · ' || replace(new.status, '_', ' ');
    insert into public.notifications (recipient_id, notification_type, title, message, href)
    values (new.user_id, 'booking_status', v_title, v_message, '/client');
  end if;
  return new;
end;
$$;
revoke all on function public.notify_booking_changes() from public, anon, authenticated;
create trigger bookings_notify_created
  after insert on public.bookings
  for each row execute function public.notify_booking_changes();
create trigger bookings_notify_status
  after update of status on public.bookings
  for each row execute function public.notify_booking_changes();

create or replace function public.admin_create_booking(
  p_user_id uuid,
  p_session_id uuid,
  p_admin_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.sessions%rowtype;
  v_account_status text;
  v_booking_id uuid;
begin
  if auth.uid() is null or not public.current_user_is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;
  select p.account_status into v_account_status from public.profiles p where p.id = p_user_id;
  if v_account_status is distinct from 'active' then
    raise exception 'This account is not active.' using errcode = '42501';
  end if;
  select s.* into v_session from public.sessions s where s.id = p_session_id for update;
  if not found or v_session.status <> 'published' or v_session.starts_at <= now() then
    raise exception 'This session is not available.' using errcode = 'P0001';
  end if;
  if v_session.booked_slots >= v_session.max_slots then
    raise exception 'This session is full.' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.bookings b where b.user_id = p_user_id and b.session_id = p_session_id
      and b.status in ('pending', 'confirmed')
  ) then raise exception 'This client already has an active booking.' using errcode = '23505'; end if;

  insert into public.bookings (user_id, session_id, status, price_snapshot, currency, admin_note, decided_at, decided_by)
  values (p_user_id, p_session_id, 'confirmed', v_session.price, v_session.currency, nullif(trim(p_admin_note), ''), now(), auth.uid())
  returning id into v_booking_id;
  update public.sessions set booked_slots = booked_slots + 1 where id = p_session_id;
  update public.profiles set role = 'client' where id = p_user_id and role = 'user';
  insert into public.booking_events (booking_id, actor_id, event_type, new_status, reason)
  values (v_booking_id, auth.uid(), 'admin_booking_created', 'confirmed', nullif(trim(p_admin_note), ''));
  insert into public.admin_audit_log (actor_id, action, target_type, target_id, reason)
  values (auth.uid(), 'booking_created_by_admin', 'booking', v_booking_id, nullif(trim(p_admin_note), ''));
  return v_booking_id;
end;
$$;
revoke all on function public.admin_create_booking(uuid, uuid, text) from public, anon;
grant execute on function public.admin_create_booking(uuid, uuid, text) to authenticated;

create or replace function public.admin_update_client_profile(
  p_user_id uuid,
  p_full_name text,
  p_phone text default null
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.profiles%rowtype;
begin
  if auth.uid() is null or not public.current_user_is_admin() then
    raise exception 'Admin access required.' using errcode = '42501';
  end if;
  select * into v_old from public.profiles where id = p_user_id for update;
  if not found then raise exception 'Profile not found.' using errcode = 'P0002'; end if;
  update public.profiles set full_name = left(trim(p_full_name), 80), phone = nullif(left(trim(coalesce(p_phone, '')), 32), '')
  where id = p_user_id;
  insert into public.admin_audit_log (actor_id, action, target_type, target_id, details)
  values (auth.uid(), 'client_profile_updated', 'profile', p_user_id,
    jsonb_build_object('old_name', v_old.full_name, 'old_phone', v_old.phone,
      'new_name', left(trim(p_full_name), 80), 'new_phone', nullif(left(trim(coalesce(p_phone, '')), 32), '')));
  return true;
end;
$$;
revoke all on function public.admin_update_client_profile(uuid, text, text) from public, anon;
grant execute on function public.admin_update_client_profile(uuid, text, text) to authenticated;

-- Supabase Realtime is opt-in in the UI. RLS still limits change payloads to the signed-in recipient.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
     ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
