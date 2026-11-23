import type { StudentContext, StudentProject } from "@/lib/advisor/types";
import {
  RESUME_SCHEMA_VERSION,
  type ResumeBasics,
  type ResumeData,
  type ResumeEducation,
  type ResumeExperience,
  type ResumeExtra,
  type ResumeProject
} from "@/lib/resume/types";

let idCounter = 0;

/** Short unique id for list entries (stable keys and finding targets). */
export function createEntryId(prefix: string): string {
  idCounter += 1;
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${idCounter}-${random}`;
}

export function emptyResume(): ResumeData {
  return {
    schemaVersion: RESUME_SCHEMA_VERSION,
    template: "classic",
    basics: { fullName: "", email: "", phone: "", linkedinUrl: "", portfolioUrl: "", location: "", headline: "" },
    education: [],
    projects: [],
    experience: [],
    skills: [],
    extras: []
  };
}

export function emptyEducation(): ResumeEducation {
  return { id: createEntryId("edu"), institution: "", course: "", startDate: "", endDate: "", details: "" };
}

export function emptyProject(): ResumeProject {
  return {
    id: createEntryId("proj"),
    title: "",
    role: "",
    tools: [],
    startDate: "",
    endDate: "",
    current: false,
    link: "",
    sourceProjectId: null,
    bullets: [""]
  };
}

export function emptyExperience(): ResumeExperience {
  return {
    id: createEntryId("exp"),
    organisation: "",
    role: "",
    location: "",
    startDate: "",
    endDate: "",
    current: false,
    bullets: [""]
  };
}

export function emptyExtra(): ResumeExtra {
  return { id: createEntryId("extra"), label: "", text: "" };
}

function trimSlash(url: string) {
  return url.replace(/\/+$/, "");
}

export function passportUrlFor(ctx: StudentContext, appUrl: string): string {
  const base = trimSlash(appUrl);
  return ctx.profile.passportSlug ? `${base}/passport/${ctx.profile.passportSlug}` : `${base}/c/${ctx.userId}`;
}

function isLinkedIn(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host === "linkedin.com" || host.endsWith(".linkedin.com");
  } catch {
    return false;
  }
}

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0);
}

/** Up to 3 draft bullets from what the project page already says. Students edit these. */
function draftBullets(project: StudentProject): string[] {
  const built = splitSentences(project.whatWasBuilt || project.problemSolved || "");
  const impact = splitSentences(project.impact ?? "");
  const bullets = [...built.slice(0, impact.length ? 2 : 3), ...impact.slice(0, 1)];
  return bullets.length ? bullets : [""];
}

function projectEntry(project: StudentProject, appUrl: string): ResumeProject {
  return {
    ...emptyProject(),
    title: project.title,
    tools: [...project.skills],
    link: `${trimSlash(appUrl)}/projects/${project.projectId}`,
    sourceProjectId: project.projectId,
    bullets: draftBullets(project)
  };
}

function collectSkills(projects: StudentProject[]): string[] {
  const seen = new Map<string, string>();
  for (const project of projects) {
    for (const skill of project.skills) {
      const trimmed = skill.trim();
      const key = trimmed.toLowerCase();
      if (trimmed && !seen.has(key)) {
        seen.set(key, trimmed);
      }
    }
  }
  return Array.from(seen.values());
}

/** First draft of a resume from everything Merit already knows about the student. */
export function prefillResume(ctx: StudentContext, { appUrl }: { appUrl: string }): ResumeData {
  const resume = emptyResume();
  const linkedin = ctx.profile.portfolioLinks.find(isLinkedIn) ?? "";

  resume.basics = {
    ...resume.basics,
    fullName: ctx.profile.name ?? "",
    email: ctx.profile.contactEmail ?? "",
    headline: ctx.profile.headline ?? "",
    linkedinUrl: linkedin,
    portfolioUrl: passportUrlFor(ctx, appUrl)
  };
  resume.projects = ctx.projects.map((project) => projectEntry(project, appUrl));
  resume.skills = collectSkills(ctx.projects);
  resume.education = ctx.education.map((entry) => ({
    ...emptyEducation(),
    institution: entry.institution,
    course: entry.course,
    endDate: entry.expectedGraduation ?? ""
  }));
  return resume;
}

/** Add Passport projects published since the resume was started. */
export function addMissingPassportProjects(
  resume: ResumeData,
  ctx: StudentContext,
  { appUrl }: { appUrl: string }
): { resume: ResumeData; added: number } {
  const present = new Set(resume.projects.map((entry) => entry.sourceProjectId).filter(Boolean));
  const missing = ctx.projects.filter((project) => !present.has(project.projectId));
  if (missing.length === 0) {
    return { resume, added: 0 };
  }
  return {
    resume: { ...resume, projects: [...resume.projects, ...missing.map((project) => projectEntry(project, appUrl))] },
    added: missing.length
  };
}

// ---------------------------------------------------------------------------
// Normalisation of stored JSON (defensive: older versions, partial saves, bad data)
// ---------------------------------------------------------------------------

type Loose = Record<string, unknown>;

function isObject(value: unknown): value is Loose {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function strList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function list<T>(value: unknown, map: (item: Loose) => T): T[] {
  return Array.isArray(value) ? value.filter(isObject).map(map) : [];
}

function id(value: unknown, prefix: string): string {
  return typeof value === "string" && value ? value : createEntryId(prefix);
}

export function normalizeResume(raw: unknown): ResumeData {
  const base = emptyResume();
  if (!isObject(raw)) {
    return base;
  }
  const basics = isObject(raw.basics) ? raw.basics : {};
  const normalizedBasics = Object.fromEntries(
    Object.keys(base.basics).map((key) => [key, str(basics[key])])
  ) as unknown as ResumeBasics;

  return {
    schemaVersion: RESUME_SCHEMA_VERSION,
    template: "classic",
    basics: normalizedBasics,
    education: list(raw.education, (item) => ({
      id: id(item.id, "edu"),
      institution: str(item.institution),
      course: str(item.course),
      startDate: str(item.startDate),
      endDate: str(item.endDate),
      details: str(item.details)
    })),
    projects: list(raw.projects, (item) => ({
      id: id(item.id, "proj"),
      title: str(item.title),
      role: str(item.role),
      tools: strList(item.tools),
      startDate: str(item.startDate),
      endDate: str(item.endDate),
      current: item.current === true,
      link: str(item.link),
      sourceProjectId: typeof item.sourceProjectId === "string" ? item.sourceProjectId : null,
      bullets: strList(item.bullets)
    })),
    experience: list(raw.experience, (item) => ({
      id: id(item.id, "exp"),
      organisation: str(item.organisation),
      role: str(item.role),
      location: str(item.location),
      startDate: str(item.startDate),
      endDate: str(item.endDate),
      current: item.current === true,
      bullets: strList(item.bullets)
    })),
    skills: strList(raw.skills),
    extras: list(raw.extras, (item) => ({ id: id(item.id, "extra"), label: str(item.label), text: str(item.text) }))
  };
}
