import type { StudentContext } from "@/lib/advisor/types";
import { DESIGN_ROLE_PATTERN } from "@/lib/advisor/data/resume-terms";
import type { ResumeData } from "@/lib/resume/types";

export type BulletRef = {
  section: "projects" | "experience";
  entryIndex: number;
  bulletIndex: number;
  text: string;
  /** Entry is ongoing (present tense expected). */
  current: boolean;
  /** Finding target, e.g. "projects[0].bullets[1]". */
  target: string;
};

/** Every non-empty bullet in projects and experience, with its finding target. */
export function allBullets(resume: ResumeData): BulletRef[] {
  const refs: BulletRef[] = [];
  for (const section of ["projects", "experience"] as const) {
    resume[section].forEach((entry, entryIndex) => {
      entry.bullets.forEach((text, bulletIndex) => {
        if (text.trim()) {
          refs.push({
            section,
            entryIndex,
            bulletIndex,
            text: text.trim(),
            current: entry.current,
            target: `${section}[${entryIndex}].bullets[${bulletIndex}]`
          });
        }
      });
    });
  }
  return refs;
}

export function hasAnyBullets(resume: ResumeData): boolean {
  return allBullets(resume).length > 0;
}

/** Entries the student has started (a title or organisation). */
export function filledEntries(resume: ResumeData) {
  return [
    ...resume.projects.map((entry, index) => ({ section: "projects" as const, index, entry, name: entry.title.trim() })),
    ...resume.experience.map((entry, index) => ({
      section: "experience" as const,
      index,
      entry,
      name: entry.organisation.trim() || entry.role.trim()
    }))
  ].filter((item) => item.name.length > 0);
}

/** Applying for design roles: from the resume headline, target roles or Passport project types. */
export function isDesignStudent(resume: ResumeData, ctx: StudentContext): boolean {
  const text = [resume.basics.headline, ctx.profile.headline ?? "", ...ctx.profile.targetRoles].join(" ");
  return DESIGN_ROLE_PATTERN.test(text) || ctx.projects.some((project) => project.projectType === "design");
}

export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function truncate(text: string, length = 48): string {
  return text.length > length ? `${text.slice(0, length - 1)}…` : text;
}
