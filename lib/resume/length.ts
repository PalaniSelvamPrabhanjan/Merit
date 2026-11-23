import { cleanBullets } from "@/lib/resume/format";
import type { ResumeData } from "@/lib/resume/types";

/**
 * Rough one-page estimate for the classic template (A4, 10pt Helvetica, 40pt margins).
 * About 100 characters fit on a full-width line and about 54 lines fit on a page.
 * Kept deliberately simple; the PDF test checks the real output fits on one page.
 */
export const CHARS_PER_LINE = 100;
export const LINES_PER_PAGE = 54;

function wrapped(text: string, indent = 0): number {
  const length = text.trim().length;
  return length === 0 ? 0 : Math.max(1, Math.ceil(length / (CHARS_PER_LINE - indent)));
}

export function estimateResumeLines(resume: ResumeData): number {
  let lines = 3; // name, headline, contact line
  const heading = 2; // heading + rule/spacing

  const education = resume.education.filter((entry) => entry.institution.trim() || entry.course.trim());
  if (education.length) {
    lines += heading;
    for (const entry of education) {
      lines += 1 + (entry.course.trim() ? 1 : 0) + wrapped(entry.details) + 0.5;
    }
  }

  const bulletLines = (bullets: string[]) =>
    cleanBullets(bullets).reduce((total, bullet) => total + wrapped(bullet, 4), 0);

  const projects = resume.projects.filter((entry) => entry.title.trim());
  if (projects.length) {
    lines += heading;
    for (const entry of projects) {
      // title + dates, optional role/tools line, bullets, gap
      lines += 1 + (entry.role.trim() || entry.tools.length ? 1 : 0) + bulletLines(entry.bullets) + 0.5;
    }
  }

  const experience = resume.experience.filter((entry) => entry.organisation.trim() || entry.role.trim());
  if (experience.length) {
    lines += heading;
    for (const entry of experience) {
      // organisation + dates, role line, bullets, gap
      lines += 2 + bulletLines(entry.bullets) + 0.5;
    }
  }

  if (resume.skills.some((skill) => skill.trim())) {
    lines += heading + wrapped(resume.skills.join(", "));
  }

  const extras = resume.extras.filter((extra) => extra.text.trim());
  if (extras.length) {
    lines += heading + extras.reduce((total, extra) => total + wrapped(`${extra.label}: ${extra.text}`), 0);
  }

  return Math.ceil(lines);
}
