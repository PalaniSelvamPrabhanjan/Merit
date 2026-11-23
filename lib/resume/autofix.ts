import type { ResumeData } from "@/lib/resume/types";

/**
 * One-click fixes that resume rules may attach to a Finding (Finding.autoFix).
 * Only fixes that cannot lose meaning are offered.
 */
export type ResumeAutoFix =
  | { type: "use-passport-url" }
  | {
      type: "replace-bullet";
      section: "projects" | "experience";
      entryIndex: number;
      bulletIndex: number;
      value: string;
      /** Button text, e.g. "Remove “I”". */
      label?: string;
    }
  | { type: "remove-skills"; skills: string[] };

export function isResumeAutoFix(value: unknown): value is ResumeAutoFix {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const type = (value as { type?: unknown }).type;
  return type === "use-passport-url" || type === "replace-bullet" || type === "remove-skills";
}

/** Human label for the fix button. */
export function autoFixLabel(fix: ResumeAutoFix): string {
  if (fix.type === "use-passport-url") return "Add my Passport link";
  if (fix.type === "remove-skills") return fix.skills.length === 1 ? `Remove “${fix.skills[0]}”` : `Remove ${fix.skills.length} soft skills`;
  return fix.label ?? "Use suggested rewrite";
}

/** Pure: returns a new resume with the fix applied. */
export function applyAutoFix(resume: ResumeData, fix: ResumeAutoFix, { passportUrl }: { passportUrl: string }): ResumeData {
  if (fix.type === "use-passport-url") {
    return { ...resume, basics: { ...resume.basics, portfolioUrl: passportUrl } };
  }
  if (fix.type === "remove-skills") {
    const remove = new Set(fix.skills.map((skill) => skill.trim().toLowerCase()));
    return { ...resume, skills: resume.skills.filter((skill) => !remove.has(skill.trim().toLowerCase())) };
  }
  const entries = resume[fix.section];
  const entry = entries[fix.entryIndex];
  if (!entry || fix.bulletIndex >= entry.bullets.length) {
    return resume;
  }
  const bullets = entry.bullets.map((bullet, index) => (index === fix.bulletIndex ? fix.value : bullet));
  const updated = entries.map((item, index) => (index === fix.entryIndex ? { ...item, bullets } : item));
  return { ...resume, [fix.section]: updated } as ResumeData;
}
