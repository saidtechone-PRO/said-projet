create table if not exists public.establishments (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  establishment_name text not null,
  facility_type text not null,
  address text not null default '',
  country text not null,
  city text not null,
  phone text not null,
  team_size text not null,
  logo_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.establishments add column if not exists address text not null default '';
alter table public.establishments add column if not exists logo_url text not null default '';

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

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('establishment-logos', 'establishment-logos', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif', 'image/bmp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their establishment logos" on storage.objects;
drop policy if exists "Users can upload their establishment logos" on storage.objects;
drop policy if exists "Users can update their establishment logos" on storage.objects;

create policy "Users can read their establishment logos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'establishment-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can upload their establishment logos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'establishment-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their establishment logos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'establishment-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'establishment-logos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

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
  insurance_name text not null default '',
  insurance_percentage numeric(5,2) not null default 0,
  created_at timestamptz not null default now()
);

alter table public.patients add column if not exists age integer;
alter table public.patients add column if not exists birth_date date;
alter table public.patients add column if not exists contact text not null default '';
alter table public.patients add column if not exists quartier text not null default '';
alter table public.patients add column if not exists home_address text not null default '';
alter table public.patients add column if not exists city text not null default '';
alter table public.patients add column if not exists insured boolean not null default false;
alter table public.patients add column if not exists insurance_name text not null default '';
alter table public.patients add column if not exists insurance_percentage numeric(5,2) not null default 0;

alter table public.patients drop constraint if exists patients_age_range;
alter table public.patients add constraint patients_age_range
  check (age is null or age between 0 and 130);
alter table public.patients drop constraint if exists patients_insurance_percentage_range;
alter table public.patients add constraint patients_insurance_percentage_range
  check (insurance_percentage between 0 and 100);

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

create table if not exists public.insurance_providers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (length(trim(name)) between 1 and 120),
  created_at timestamptz not null default now()
);

create unique index if not exists insurance_providers_user_name_idx
  on public.insurance_providers (user_id, lower(name));

insert into public.insurance_providers (user_id, name)
select distinct user_id, trim(insurance_name)
from public.patients
where insured
  and length(trim(insurance_name)) > 0
on conflict do nothing;

alter table public.insurance_providers enable row level security;

drop policy if exists "Users can read their insurance providers" on public.insurance_providers;
drop policy if exists "Users can create their insurance providers" on public.insurance_providers;

create policy "Users can read their insurance providers"
  on public.insurance_providers for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their insurance providers"
  on public.insurance_providers for insert
  to authenticated
  with check (auth.uid() = user_id);

grant select, insert on public.insurance_providers to authenticated;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid references public.patients (id) on delete set null,
  patient_name text not null check (length(trim(patient_name)) > 0),
  service text not null check (length(trim(service)) > 0),
  amount bigint not null check (amount >= 0),
  total_amount bigint not null default 0,
  insured boolean not null default false,
  insurance_name text not null default '',
  insurance_percentage numeric(5,2) not null default 0,
  insurance_covered_amount bigint not null default 0,
  patient_due_amount bigint not null default 0,
  status text not null check (status in ('paid', 'partial', 'insurance_pending')),
  practitioner text not null check (length(trim(practitioner)) > 0),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.payments add column if not exists total_amount bigint not null default 0;
alter table public.payments add column if not exists insurance_name text not null default '';
alter table public.payments add column if not exists insurance_percentage numeric(5,2) not null default 0;
alter table public.payments add column if not exists insurance_covered_amount bigint not null default 0;
alter table public.payments add column if not exists patient_due_amount bigint not null default 0;
alter table public.payments drop constraint if exists payments_amount_check;
alter table public.payments add constraint payments_amount_check
  check (amount >= 0);
alter table public.payments drop constraint if exists payments_status_check;
alter table public.payments add constraint payments_status_check
  check (status in ('paid', 'partial', 'insurance_pending'));

update public.payments
set total_amount = amount,
    patient_due_amount = amount
where total_amount = 0;

alter table public.payments drop constraint if exists payments_insurance_percentage_range;
alter table public.payments add constraint payments_insurance_percentage_range
  check (insurance_percentage between 0 and 100);
alter table public.payments drop constraint if exists payments_amount_breakdown;
alter table public.payments add constraint payments_amount_breakdown
  check (
    total_amount >= amount
    and insurance_covered_amount between 0 and total_amount
    and patient_due_amount between 0 and total_amount
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

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  patient_id uuid not null references public.patients (id) on delete cascade,
  patient_name text not null check (length(trim(patient_name)) > 0),
  reason text not null check (length(trim(reason)) > 0),
  practitioner text not null check (length(trim(practitioner)) > 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  notes text not null default '',
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  created_at timestamptz not null default now(),
  constraint appointments_time_range check (ends_at > starts_at)
);

alter table public.appointments drop constraint if exists appointments_time_range;
alter table public.appointments add constraint appointments_time_range
  check (ends_at > starts_at);
alter table public.appointments drop constraint if exists appointments_status_check;
alter table public.appointments add constraint appointments_status_check
  check (status in ('scheduled', 'completed', 'cancelled', 'no_show'));

create index if not exists appointments_user_starts_at_idx
  on public.appointments (user_id, starts_at);

alter table public.appointments enable row level security;

drop policy if exists "Users can read their appointments" on public.appointments;
drop policy if exists "Users can create their appointments" on public.appointments;
drop policy if exists "Users can update their appointments" on public.appointments;

create policy "Users can read their appointments"
  on public.appointments for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can create their appointments"
  on public.appointments for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.patients
      where patients.id = appointments.patient_id
        and patients.user_id = auth.uid()
    )
  );

create policy "Users can update their appointments"
  on public.appointments for update
  to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.patients
      where patients.id = appointments.patient_id
        and patients.user_id = auth.uid()
    )
  );

grant select, insert, update on public.appointments to authenticated;

notify pgrst, 'reload schema';
