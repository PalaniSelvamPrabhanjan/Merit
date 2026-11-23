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
