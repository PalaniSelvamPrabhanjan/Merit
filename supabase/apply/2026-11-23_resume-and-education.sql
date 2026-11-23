-- Merit: apply in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run).
-- Combines two migrations from supabase/migrations/. Safe to run more than once:
-- everything uses IF NOT EXISTS / DROP ... IF EXISTS. Adds tables and columns only;
-- nothing existing is changed or deleted.
--   1. 20261123000001_resumes.sql            resume builder drafts + download history
--   2. 20261123000002_profile_education.sql  education on the profile

begin;

-- ===== 1. 20261123000001_resumes.sql =====
-- Stage 3: structured resumes.
-- resumes: one current draft per user (autosaved).
-- resume_versions: a snapshot each time the student downloads a PDF.

create table if not exists public.resumes (
  resume_id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(user_id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  schema_version int not null default 1,
  score int check (score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.resume_versions (
  version_id uuid primary key default gen_random_uuid(),
  resume_id uuid not null references public.resumes(resume_id) on delete cascade,
  user_id uuid not null references public.users(user_id) on delete cascade,
  data jsonb not null,
  schema_version int not null default 1,
  score int check (score between 0 and 100),
  reason text not null default 'download' check (reason in ('download', 'manual')),
  created_at timestamptz not null default now()
);

create index if not exists resume_versions_user_created_idx
on public.resume_versions (user_id, created_at desc);

drop trigger if exists resumes_updated_at on public.resumes;
create trigger resumes_updated_at
before update on public.resumes
for each row execute procedure public.touch_updated_at();

alter table public.resumes enable row level security;
alter table public.resume_versions enable row level security;

-- Resumes are private to their owner.
drop policy if exists resumes_select_own on public.resumes;
create policy resumes_select_own on public.resumes
for select using (auth.uid() = user_id);

drop policy if exists resumes_insert_own on public.resumes;
create policy resumes_insert_own on public.resumes
for insert with check (auth.uid() = user_id);

drop policy if exists resumes_update_own on public.resumes;
create policy resumes_update_own on public.resumes
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists resumes_delete_own on public.resumes;
create policy resumes_delete_own on public.resumes
for delete using (auth.uid() = user_id);

drop policy if exists resume_versions_select_own on public.resume_versions;
create policy resume_versions_select_own on public.resume_versions
for select using (auth.uid() = user_id);

drop policy if exists resume_versions_insert_own on public.resume_versions;
create policy resume_versions_insert_own on public.resume_versions
for insert with check (
  auth.uid() = user_id
  and exists (
    select 1 from public.resumes r
    where r.resume_id = resume_versions.resume_id
      and r.user_id = auth.uid()
  )
);

-- ===== 2. 20261123000002_profile_education.sql =====
-- Education on the profile (decision 2, option B).
-- One current course per student. The resume builder prefills from these columns,
-- matching (Stage 5) reads course and year, and the public Passport shows one line.

alter table public.candidate_profiles
add column if not exists education_institution text,
add column if not exists education_course text,
add column if not exists education_start_month text,
add column if not exists education_graduation_month text,
add column if not exists education_year_of_study smallint,
add column if not exists show_graduation_on_passport boolean not null default true;

alter table public.candidate_profiles
drop constraint if exists candidate_profiles_education_months_format;

alter table public.candidate_profiles
add constraint candidate_profiles_education_months_format
check (
  (education_start_month is null or education_start_month ~ '^\d{4}-(0[1-9]|1[0-2])$')
  and (education_graduation_month is null or education_graduation_month ~ '^\d{4}-(0[1-9]|1[0-2])$')
);

alter table public.candidate_profiles
drop constraint if exists candidate_profiles_year_of_study_range;

alter table public.candidate_profiles
add constraint candidate_profiles_year_of_study_range
check (education_year_of_study is null or education_year_of_study between 1 and 6);

-- Existing RLS policies on candidate_profiles already cover these columns
-- (public read, owner insert/update).

commit;

-- Supabase caches the schema for its API; reload it so the app sees the new tables now.
notify pgrst, 'reload schema';
