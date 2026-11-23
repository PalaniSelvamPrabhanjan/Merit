-- Stage 4: portfolio coaching.
-- Case-study fields on projects (problem -> role -> process -> outcome), image alt text,
-- and per-user onboarding state (welcome seen, tips dismissed).

alter table public.projects
add column if not exists role text,
add column if not exists started_month text,
add column if not exists finished_month text,
add column if not exists cover_alt_text text;

alter table public.projects
drop constraint if exists projects_case_study_months_format;

alter table public.projects
add constraint projects_case_study_months_format
check (
  (started_month is null or started_month ~ '^\d{4}-(0[1-9]|1[0-2])$')
  and (finished_month is null or finished_month ~ '^\d{4}-(0[1-9]|1[0-2])$')
);

alter table public.artifacts
add column if not exists alt_text text;

create table if not exists public.user_onboarding (
  user_id uuid primary key references public.users(user_id) on delete cascade,
  welcome_completed_at timestamptz,
  dismissed_tips text[] not null default '{}'::text[],
  checklist_hidden boolean not null default false,
  updated_at timestamptz not null default now()
);

drop trigger if exists user_onboarding_updated_at on public.user_onboarding;
create trigger user_onboarding_updated_at
before update on public.user_onboarding
for each row execute procedure public.touch_updated_at();

alter table public.user_onboarding enable row level security;

drop policy if exists user_onboarding_select_own on public.user_onboarding;
create policy user_onboarding_select_own on public.user_onboarding
for select using (auth.uid() = user_id);

drop policy if exists user_onboarding_insert_own on public.user_onboarding;
create policy user_onboarding_insert_own on public.user_onboarding
for insert with check (auth.uid() = user_id);

drop policy if exists user_onboarding_update_own on public.user_onboarding;
create policy user_onboarding_update_own on public.user_onboarding
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
