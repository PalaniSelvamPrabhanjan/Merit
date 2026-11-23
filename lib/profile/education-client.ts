"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { educationToRow, isMissingEducationColumns, validateEducation, type ProfileEducation } from "@/lib/profile/education";

export type EducationSaveResult = { ok: true } | { ok: false; error: string };

/**
 * Save only the education columns, so a database without the education migration
 * never breaks the rest of the profile.
 */
export async function saveProfileEducation(
  supabase: SupabaseClient,
  userId: string,
  education: ProfileEducation
): Promise<EducationSaveResult> {
  const problems = validateEducation(education);
  if (problems.length) {
    return { ok: false, error: problems.join(" ") };
  }
  const { error } = await supabase.from("candidate_profiles").update(educationToRow(education)).eq("user_id", userId);
  if (!error) {
    return { ok: true };
  }
  if (isMissingEducationColumns(error.message)) {
    return {
      ok: false,
      error: "Education can't be saved yet: the database update for education hasn't been applied. Ask the Merit team to apply it."
    };
  }
  return { ok: false, error: `Couldn't save your education: ${error.message}` };
}

/** Update only school, course and dates (used from the resume builder). */
export async function saveEducationBasics(
  supabase: SupabaseClient,
  userId: string,
  fields: Pick<ProfileEducation, "institution" | "course" | "startMonth" | "graduationMonth">
): Promise<EducationSaveResult> {
  const problems = validateEducation({ ...fields, yearOfStudy: null, showGraduationOnPassport: true });
  if (problems.length) {
    return { ok: false, error: problems.join(" ") };
  }
  const row = educationToRow({ ...fields, yearOfStudy: null, showGraduationOnPassport: true });
  const { error } = await supabase
    .from("candidate_profiles")
    .update({
      education_institution: row.education_institution,
      education_course: row.education_course,
      education_start_month: row.education_start_month,
      education_graduation_month: row.education_graduation_month
    })
    .eq("user_id", userId);
  if (!error) return { ok: true };
  if (isMissingEducationColumns(error.message)) {
    return { ok: false, error: "Your Passport can't store education yet: the database update hasn't been applied." };
  }
  return { ok: false, error: `Couldn't update your Passport: ${error.message}` };
}
