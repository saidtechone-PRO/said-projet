create table if not exists public.establishments (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  establishment_name text not null,
  facility_type text not null,
  country text not null,
  city text not null,
  phone text not null,
  team_size text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.establishments enable row level security;

create policy "Users can read their establishment"
  on public.establishments for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their establishment"
  on public.establishments for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their establishment"
  on public.establishments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.establishments to authenticated;
