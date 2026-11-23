import type { Finding } from "@/lib/advisor/types";

export type ResumeStepId = "basics" | "education" | "projects" | "experience" | "skills" | "extras" | "review";

export const RESUME_STEPS: ReadonlyArray<{ id: ResumeStepId; label: string }> = [
  { id: "basics", label: "Basics" },
  { id: "education", label: "Education" },
  { id: "projects", label: "Projects" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Skills" },
  { id: "extras", label: "Extras" },
  { id: "review", label: "Review & download" }
];

/** Wizard step that owns a finding target. Whole-document findings go to Review. */
export function stepForTarget(target: string): ResumeStepId {
  const root = target.split(/[.[]/)[0];
  if (root === "basics" || root === "education" || root === "projects" || root === "experience" || root === "skills" || root === "extras") {
    return root;
  }
  return "review";
}

/** DOM id of the form control for a target, e.g. "projects[0].bullets[1]" -> "rf-projects-0-bullets-1". */
export function fieldIdForTarget(target: string): string {
  return `rf-${target.replace(/\[(\d+)\]/g, "-$1").replace(/\./g, "-")}`;
}

/** Findings that point at this target or anything inside it. */
export function findingsFor(findings: Finding[], target: string): Finding[] {
  return findings.filter(
    (finding) => finding.target === target || finding.target.startsWith(`${target}.`) || finding.target.startsWith(`${target}[`)
  );
}

/** Findings that point exactly at this target. */
export function findingsAt(findings: Finding[], target: string): Finding[] {
  return findings.filter((finding) => finding.target === target);
}

/** Count of critical + improve findings per step (polish items don't block a step). */
export function openIssuesByStep(findings: Finding[]): Record<ResumeStepId, number> {
  const counts = Object.fromEntries(RESUME_STEPS.map((step) => [step.id, 0])) as Record<ResumeStepId, number>;
  for (const finding of findings) {
    if (finding.severity !== "polish") {
      counts[stepForTarget(finding.target)] += 1;
    }
  }
  return counts;
}

/** First step with a critical finding, else the first with any open issue, else Review. */
export function firstStepNeedingWork(findings: Finding[]): ResumeStepId {
  const critical = findings.find((finding) => finding.severity === "critical");
  if (critical) return stepForTarget(critical.target);
  const counts = openIssuesByStep(findings);
  return RESUME_STEPS.find((step) => step.id !== "review" && counts[step.id] > 0)?.id ?? "review";
}
