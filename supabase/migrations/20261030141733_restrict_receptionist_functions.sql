-- Keep the privileged implementation outside PostgREST's exposed API schemas.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to anon;

create or replace function private.create_guest_booking(
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

  select * into v_session from public.sessions where id = p_session_id for update;
  if not found or v_session.status <> 'published' or v_session.starts_at <= now() then
    raise exception 'This session is no longer available.' using errcode = 'P0001';
  end if;
  if v_session.booked_slots >= v_session.max_slots then
    raise exception 'This session is full.' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.guest_bookings g
    where g.session_id = p_session_id and g.phone_normalized = v_phone and g.status = 'confirmed'
  ) then
    raise exception 'This phone already has a booking for this session.' using errcode = '23505';
  end if;
  if exists (
    select 1 from public.guest_bookings g
    where g.phone_normalized = v_phone and g.booked_at > now() - interval '10 minutes' and g.status = 'confirmed'
  ) then
    raise exception 'Please wait before making another booking.' using errcode = 'P0001';
  end if;

  insert into public.guest_bookings (session_id, full_name, phone, phone_normalized, email, price_snapshot, currency)
  values (p_session_id, v_name, btrim(p_phone), v_phone, v_email, v_session.price, v_session.currency)
  returning id into v_booking_id;
  update public.sessions set booked_slots = booked_slots + 1 where id = p_session_id;

  insert into public.notifications (recipient_id, notification_type, title, message, href)
  select p.id, 'receptionist_booking', 'New AI Receptionist booking',
    v_name || ' booked ' || v_session.title || ' · ' || to_char(v_session.starts_at at time zone 'Europe/Sofia', 'Dy, DD Mon, HH24:MI'),
    '/admin/receptionist'
  from public.profiles p where p.role = 'admin' and p.account_status = 'active';
  return v_booking_id;
end;
$$;

create or replace function private.submit_receptionist_handoff(
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
  if (select count(*) from public.receptionist_handoffs h where h.phone_normalized = v_phone and h.created_at > now() - interval '1 hour') >= 3 then
    raise exception 'Please wait before sending another request.' using errcode = 'P0001';
  end if;

  insert into public.receptionist_handoffs (full_name, phone, phone_normalized, email, message)
  values (v_name, btrim(p_phone), v_phone, v_email, v_message)
  returning id into v_handoff_id;
  insert into public.notifications (recipient_id, notification_type, title, message, href)
  select p.id, 'receptionist_handoff', 'A visitor requested a person',
    v_name || ' · ' || coalesce(nullif(v_message, ''), 'Please follow up with this visitor.'),
    '/admin/receptionist'
  from public.profiles p where p.role = 'admin' and p.account_status = 'active';
  return v_handoff_id;
end;
$$;

revoke all on function private.create_guest_booking(uuid, text, text, text) from public, anon, authenticated;
grant execute on function private.create_guest_booking(uuid, text, text, text) to anon;
revoke all on function private.submit_receptionist_handoff(text, text, text, text) from public, anon, authenticated;
grant execute on function private.submit_receptionist_handoff(text, text, text, text) to anon;

create or replace function public.create_guest_booking(
  p_session_id uuid, p_full_name text, p_phone text, p_email text default null
)
returns uuid
language sql
security invoker
set search_path = ''
as $$ select private.create_guest_booking(p_session_id, p_full_name, p_phone, p_email); $$;

create or replace function public.submit_receptionist_handoff(
  p_full_name text, p_phone text, p_email text default null, p_message text default ''
)
returns uuid
language sql
security invoker
set search_path = ''
as $$ select private.submit_receptionist_handoff(p_full_name, p_phone, p_email, p_message); $$;

revoke all on function public.create_guest_booking(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.create_guest_booking(uuid, text, text, text) to anon;
revoke all on function public.submit_receptionist_handoff(text, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_receptionist_handoff(text, text, text, text) to anon;
