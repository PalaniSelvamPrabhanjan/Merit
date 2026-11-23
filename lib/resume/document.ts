import { cleanBullets, contactItems, entryDateRange, formatDateRange } from "@/lib/resume/format";
import { RESUME_SECTION_HEADINGS, RESUME_SECTION_ORDER, type ResumeData } from "@/lib/resume/types";

/**
 * Render-ready resume, shared by the HTML preview and the PDF template so both show
 * the same sections, order, dates and bullets. `target` links each piece back to the
 * form field (and finding target) it came from.
 */
export interface DocEntry {
  target: string;
  title: string;
  dates: string;
  /** Second line, e.g. course, role or "Tools: …". */
  subtitle: string;
  bullets: Array<{ target: string; text: string }>;
}

export interface DocSection {
  id: string;
  heading: string;
  entries: DocEntry[];
  /** Plain paragraph sections (skills). */
  text?: string;
}

export interface ResumeDocument {
  name: string;
  headline: string;
  contact: string[];
  sections: DocSection[];
}

export function buildResumeDocument(resume: ResumeData): ResumeDocument {
  const sections: DocSection[] = [];

  for (const id of RESUME_SECTION_ORDER) {
    const heading = RESUME_SECTION_HEADINGS[id];

    if (id === "education") {
      const entries = resume.education
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => entry.institution.trim() || entry.course.trim())
        .map(({ entry, index }) => ({
          target: `education[${index}]`,
          title: entry.institution.trim(),
          dates: formatDateRange({ startDate: entry.startDate, endDate: entry.endDate, expected: true }),
          subtitle: entry.course.trim(),
          bullets: entry.details.trim() ? [{ target: `education[${index}].details`, text: entry.details.trim() }] : []
        }));
      if (entries.length) sections.push({ id, heading, entries });
    }

    if (id === "projects") {
      const entries = resume.projects
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => entry.title.trim())
        .map(({ entry, index }) => ({
          target: `projects[${index}]`,
          title: entry.title.trim(),
          dates: entryDateRange(entry),
          subtitle: [entry.role.trim(), entry.tools.length ? `Tools: ${entry.tools.join(", ")}` : "", entry.link.trim().replace(/^https?:\/\//, "")]
            .filter(Boolean)
            .join(" · "),
          bullets: entry.bullets
            .map((text, bulletIndex) => ({ target: `projects[${index}].bullets[${bulletIndex}]`, text: text.trim() }))
            .filter((bullet) => bullet.text)
        }));
      if (entries.length) sections.push({ id, heading, entries });
    }

    if (id === "experience") {
      const entries = resume.experience
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => entry.organisation.trim() || entry.role.trim())
        .map(({ entry, index }) => ({
          target: `experience[${index}]`,
          title: entry.organisation.trim() || entry.role.trim(),
          dates: entryDateRange(entry),
          subtitle: [entry.organisation.trim() ? entry.role.trim() : "", entry.location.trim()].filter(Boolean).join(" · "),
          bullets: entry.bullets
            .map((text, bulletIndex) => ({ target: `experience[${index}].bullets[${bulletIndex}]`, text: text.trim() }))
            .filter((bullet) => bullet.text)
        }));
      if (entries.length) sections.push({ id, heading, entries });
    }

    if (id === "skills") {
      const skills = resume.skills.map((skill) => skill.trim()).filter(Boolean);
      if (skills.length) sections.push({ id, heading, entries: [], text: skills.join(", ") });
    }

    if (id === "extras") {
      const entries = resume.extras
        .map((extra, index) => ({ extra, index }))
        .filter(({ extra }) => extra.text.trim())
        .map(({ extra, index }) => ({
          target: `extras[${index}]`,
          title: "",
          dates: "",
          subtitle: "",
          bullets: [{ target: `extras[${index}].text`, text: extra.label.trim() ? `${extra.label.trim()}: ${extra.text.trim()}` : extra.text.trim() }]
        }));
      if (entries.length) sections.push({ id, heading, entries });
    }
  }

  return {
    name: resume.basics.fullName.trim(),
    headline: resume.basics.headline.trim(),
    contact: contactItems(resume),
    sections
  };
}

export { cleanBullets };
