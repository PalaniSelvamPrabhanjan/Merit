/**
 * Structured resume. Every answer is stored as a field (not rendered text) so rules,
 * templates and a future AI advisor all read the same data. Bump RESUME_SCHEMA_VERSION
 * and add a migration in lib/resume/model.ts when the shape changes.
 */

export const RESUME_SCHEMA_VERSION = 1;

/** "YYYY-MM", or "" when unknown. */
export type MonthValue = string;

export interface ResumeBasics {
  fullName: string;
  email: string;
  phone: string;
  linkedinUrl: string;
  /** Portfolio or Merit Passport URL. */
  portfolioUrl: string;
  /** e.g. "Singapore · open to hybrid" or "Relocating to London by June 2027". */
  location: string;
  /** Short line under the name, e.g. "Year 2 UX Design student". */
  headline: string;
}

export interface ResumeEducation {
  id: string;
  institution: string;
  course: string;
  startDate: MonthValue;
  /** Graduation date, expected or actual. */
  endDate: MonthValue;
  /** One line of honours, modules or GPA. Optional. */
  details: string;
}

export interface ResumeProject {
  id: string;
  title: string;
  /** Your role, e.g. "UX designer (team of 4)". */
  role: string;
  tools: string[];
  startDate: MonthValue;
  endDate: MonthValue;
  current: boolean;
  /** Evidence link, e.g. the Merit project page. */
  link: string;
  /** Merit project this entry was drafted from, if any. */
  sourceProjectId: string | null;
  bullets: string[];
}

export interface ResumeExperience {
  id: string;
  organisation: string;
  role: string;
  location: string;
  startDate: MonthValue;
  endDate: MonthValue;
  current: boolean;
  bullets: string[];
}

export interface ResumeExtra {
  id: string;
  /** e.g. "Awards", "Leadership", "Languages". */
  label: string;
  text: string;
}

export interface ResumeData {
  schemaVersion: number;
  template: "classic";
  basics: ResumeBasics;
  education: ResumeEducation[];
  projects: ResumeProject[];
  experience: ResumeExperience[];
  skills: string[];
  extras: ResumeExtra[];
}

export type ResumeSectionId = "basics" | "education" | "projects" | "experience" | "skills" | "extras";

/** Template section order for students (fixed; see docs/resume-builder.md). */
export const RESUME_SECTION_ORDER: ReadonlyArray<Exclude<ResumeSectionId, "basics">> = [
  "education",
  "projects",
  "experience",
  "skills",
  "extras"
];

export const RESUME_SECTION_HEADINGS: Record<ResumeSectionId, string> = {
  basics: "Contact",
  education: "Education",
  projects: "Projects",
  experience: "Experience",
  skills: "Skills",
  extras: "Additional"
};
