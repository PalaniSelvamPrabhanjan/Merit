import type { StudentContext } from "@/lib/advisor/types";

/** Section ids in the guided project editor, by case-study field. */
export const EDITOR_ANCHORS: Record<string, string> = {
  coverImageUrl: "case-images",
  images: "case-images",
  problemSolved: "case-problem",
  role: "case-role",
  startedMonth: "case-role",
  whatWasBuilt: "case-process",
  impact: "case-outcome",
  skills: "case-tools"
};

/** Dashboard card ids, by profile field. */
const PROFILE_CARDS: Record<string, string> = {
  bio: "card-profile",
  headline: "card-profile",
  contactEmail: "card-contact",
  resumeUrl: "card-contact",
  education: "card-education"
};

export type FindingDestination = { kind: "link"; href: string } | { kind: "section"; sectionId: string };

/** Where a Passport finding is fixed: a dashboard card or a project editor section. */
export function destinationForTarget(target: string, ctx: StudentContext): FindingDestination {
  const project = target.match(/^projects\[(\d+)\](?:\.(\w+))?/);
  if (project) {
    const entry = ctx.projects[Number(project[1])];
    if (!entry) return { kind: "section", sectionId: "section-projects" };
    const anchor = project[2] ? EDITOR_ANCHORS[project[2]] : undefined;
    return { kind: "link", href: `/projects/${entry.projectId}/edit${anchor ? `#${anchor}` : ""}` };
  }
  if (target === "projects") return { kind: "section", sectionId: "section-projects" };
  const field = target.replace(/^profile\./, "");
  return { kind: "section", sectionId: PROFILE_CARDS[field] ?? "card-profile" };
}
