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

drop policy if exists "Users can read their establishment" on public.establishments;
drop policy if exists "Users can create their establishment" on public.establishments;
drop policy if exists "Users can update their establishment" on public.establishments;
drop policy if exists "Les utilisateurs peuvent lire leur établissement" on public.establishments;
drop policy if exists "Les utilisateurs peuvent créer leur établissement" on public.establishments;
drop policy if exists "Les utilisateurs peuvent modifier leur établissement" on public.establishments;

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

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  full_name text not null check (length(trim(full_name)) > 0),
  birth_date date,
  age integer not null check (age between 0 and 130),
  contact text not null,
  quartier text not null default '',
  home_address text not null,
  city text not null,
  insured boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.patients add column if not exists age integer;
alter table public.patients add column if not exists birth_date date;
alter table public.patients add column if not exists contact text not null default '';
alter table public.patients add column if not exists quartier text not null default '';
alter table public.patients add column if not exists home_address text not null default '';
alter table public.patients add column if not exists city text not null default '';
alter table public.patients add column if not exists insured boolean not null default false;

alter table public.patients drop constraint if exists patients_age_range;
alter table public.patients add constraint patients_age_range
  check (age is null or age between 0 and 130);

create index if not exists patients_user_created_at_idx
  on public.patients (user_id, created_at desc);

alter table public.patients enable row level security;

drop policy if exists "Users can read their patients" on public.patients;
drop policy if exists "Users can create their patients" on public.patients;
drop policy if exists "Users can update their patients" on public.patients;
drop policy if exists "Users can delete their patients" on public.patients;

create policy "Users can read their patients"
  on public.patients for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their patients"
  on public.patients for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their patients"
  on public.patients for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their patients"
  on public.patients for delete
  to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.patients to authenticated;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid references public.patients (id) on delete set null,
  patient_name text not null check (length(trim(patient_name)) > 0),
  service text not null check (length(trim(service)) > 0),
  amount bigint not null check (amount > 0),
  insured boolean not null default false,
  status text not null check (status in ('paid', 'partial')),
  practitioner text not null check (length(trim(practitioner)) > 0),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists payments_user_occurred_at_idx
  on public.payments (user_id, occurred_at desc);

alter table public.payments enable row level security;

drop policy if exists "Users can read their payments" on public.payments;
drop policy if exists "Users can create their payments" on public.payments;

create policy "Users can read their payments"
  on public.payments for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their payments"
  on public.payments for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and (
      patient_id is null
      or exists (
        select 1
        from public.patients
        where patients.id = payments.patient_id
          and patients.user_id = auth.uid()
      )
    )
  );

grant select, insert on public.payments to authenticated;

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  patient_name text not null check (length(trim(patient_name)) > 0),
  medications jsonb not null check (
    case
      when jsonb_typeof(medications) = 'array' then jsonb_array_length(medications) > 0
      else false
    end
  ),
  instructions text not null default '',
  practitioner text not null check (length(trim(practitioner)) > 0),
  issued_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists prescriptions_user_patient_issued_at_idx
  on public.prescriptions (user_id, patient_id, issued_at desc);

alter table public.prescriptions enable row level security;

drop policy if exists "Users can read their prescriptions" on public.prescriptions;
drop policy if exists "Users can create their prescriptions" on public.prescriptions;

create policy "Users can read their prescriptions"
  on public.prescriptions for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their prescriptions"
  on public.prescriptions for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.patients
      where patients.id = prescriptions.patient_id
        and patients.user_id = auth.uid()
    )
  );

grant select, insert on public.prescriptions to authenticated;

create table if not exists public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  patient_name text not null check (length(trim(patient_name)) > 0),
  title text not null check (length(trim(title)) > 0),
  content text not null check (length(trim(content)) > 0),
  practitioner text not null check (length(trim(practitioner)) > 0),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists clinical_notes_user_occurred_at_idx
  on public.clinical_notes (user_id, occurred_at desc);

create index if not exists clinical_notes_user_patient_occurred_at_idx
  on public.clinical_notes (user_id, patient_id, occurred_at desc);

alter table public.clinical_notes enable row level security;

drop policy if exists "Users can read their clinical notes" on public.clinical_notes;
drop policy if exists "Users can create their clinical notes" on public.clinical_notes;

create policy "Users can read their clinical notes"
  on public.clinical_notes for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their clinical notes"
  on public.clinical_notes for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.patients
      where patients.id = clinical_notes.patient_id
        and patients.user_id = auth.uid()
    )
  );

grant select, insert on public.clinical_notes to authenticated;
