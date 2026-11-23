import { formatMonth, isMonthValue } from "@/lib/resume/format";

/**
 * A student's current course, stored on candidate_profiles
 * (migration 20261123000002_profile_education.sql).
 */
export interface ProfileEducation {
  institution: string;
  course: string;
  /** "YYYY-MM" or "". */
  startMonth: string;
  /** Expected or actual graduation, "YYYY-MM" or "". */
  graduationMonth: string;
  yearOfStudy: number | null;
  showGraduationOnPassport: boolean;
}

export const EDUCATION_COLUMNS =
  "education_institution, education_course, education_start_month, education_graduation_month, education_year_of_study, show_graduation_on_passport";

export function emptyProfileEducation(): ProfileEducation {
  return { institution: "", course: "", startMonth: "", graduationMonth: "", yearOfStudy: null, showGraduationOnPassport: true };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Read education from a candidate_profiles row (missing columns read as empty). */
export function educationFromRow(row: Record<string, unknown> | null | undefined): ProfileEducation {
  if (!row) return emptyProfileEducation();
  const year = row.education_year_of_study;
  return {
    institution: text(row.education_institution),
    course: text(row.education_course),
    startMonth: isMonthValue(text(row.education_start_month)) ? text(row.education_start_month) : "",
    graduationMonth: isMonthValue(text(row.education_graduation_month)) ? text(row.education_graduation_month) : "",
    yearOfStudy: typeof year === "number" && year >= 1 && year <= 6 ? year : null,
    showGraduationOnPassport: row.show_graduation_on_passport !== false
  };
}

export function educationToRow(education: ProfileEducation) {
  return {
    education_institution: education.institution.trim() || null,
    education_course: education.course.trim() || null,
    education_start_month: isMonthValue(education.startMonth) ? education.startMonth : null,
    education_graduation_month: isMonthValue(education.graduationMonth) ? education.graduationMonth : null,
    education_year_of_study: education.yearOfStudy,
    show_graduation_on_passport: education.showGraduationOnPassport
  };
}

export function hasEducation(education: ProfileEducation | null | undefined): boolean {
  return Boolean(education && (education.institution || education.course));
}

/** Problems a student must fix before saving, in plain language. Empty = valid. */
export function validateEducation(education: ProfileEducation): string[] {
  const problems: string[] = [];
  if (education.course && !education.institution) problems.push("Add the name of your school.");
  if (education.institution && !education.course) problems.push("Add the name of your course.");
  if (education.startMonth && !isMonthValue(education.startMonth)) problems.push("Use a month and year for the start date.");
  if (education.graduationMonth && !isMonthValue(education.graduationMonth)) {
    problems.push("Use a month and year for the graduation date.");
  }
  if (isMonthValue(education.startMonth) && isMonthValue(education.graduationMonth) && education.graduationMonth < education.startMonth) {
    problems.push("Graduation can't be before the start date.");
  }
  return problems;
}

/**
 * One line for the public Passport, e.g.
 * "Diploma in UX Design, Example Polytechnic · Year 2 · graduating Mar 2028".
 */
export function educationLine(education: ProfileEducation): string {
  if (!hasEducation(education)) return "";
  const parts = [[education.course, education.institution].filter(Boolean).join(", ")];
  if (education.yearOfStudy) parts.push(`Year ${education.yearOfStudy}`);
  if (education.showGraduationOnPassport && education.graduationMonth) {
    parts.push(`graduating ${formatMonth(education.graduationMonth)}`);
  }
  return parts.join(" · ");
}

/** True when the column doesn't exist yet (migration not applied). */
export function isMissingEducationColumns(message: string): boolean {
  const normalized = message.toLowerCase();
  return /education_|show_graduation_on_passport/.test(normalized) && /(does not exist|schema cache|could not find)/.test(normalized);
}
