-- Introduce first-class session categories and seed the core fitness catalog.
create table public.session_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  description text not null default '',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger session_categories_set_updated_at before update on public.session_categories
  for each row execute function public.set_updated_at();

alter table public.session_categories enable row level security;
revoke all on public.session_categories from anon, authenticated;
grant select on public.session_categories to anon, authenticated;
grant insert, update, delete on public.session_categories to authenticated;
create policy session_categories_read_active on public.session_categories
  for select to anon using (is_active);
create policy session_categories_read_authenticated on public.session_categories
  for select to authenticated using (is_active or (select public.current_user_is_admin()));
create policy session_categories_admin_manage on public.session_categories
  for all to authenticated
  using ((select public.current_user_is_admin()))
  with check ((select public.current_user_is_admin()));

insert into public.session_categories (slug, name, description, sort_order) values
  ('strength-training', 'Strength Training', 'Focused on resistance training and weightlifting.', 10),
  ('hiit-cardio', 'HIIT & Cardio', 'High-intensity intervals and cardio for cardiovascular fitness and fat loss.', 20),
  ('yoga-mobility', 'Yoga & Mobility', 'Flexibility, balance, mobility, and recovery sessions.', 30)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order;

alter table public.session_types add column category_id uuid references public.session_categories (id) on delete set null;
create index session_types_category_id_idx on public.session_types (category_id);

-- Connect obvious legacy groups without guessing the intended category for "Personal".
update public.session_types st
set category_id = category.id,
    category = category.name
from public.session_categories category
where lower(trim(st.category)) = 'strength'
  and category.slug = 'strength-training';

update public.session_types st
set category_id = category.id,
    category = category.name
from public.session_categories category
where lower(trim(st.category)) in ('recovery', 'mobility', 'yoga')
  and category.slug = 'yoga-mobility';

