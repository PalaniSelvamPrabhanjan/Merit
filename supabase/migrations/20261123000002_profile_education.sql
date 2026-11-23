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
