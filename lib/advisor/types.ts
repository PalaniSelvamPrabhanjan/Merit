/**
 * Shared advisor contract. Everything in Merit that judges or advises (resume checks,
 * Passport strength, opportunity matching) returns a `Review` through an `Advisor`.
 * The rule-based advisor implements this today; an LLM-backed AgentAdvisor can
 * implement the same interface later without UI changes. See docs/advisor.md.
 */

export type Severity = "critical" | "improve" | "polish";

export type ScoreLabel = "Getting started" | "Solid" | "Strong" | "Interview-ready";

export interface Finding {
  ruleId: string;
  severity: Severity;
  /** Rule category, e.g. "completeness" or "bullets". Lets the UI group findings. */
  category: string;
  /** Path to the offending field, e.g. "experience[1].bullets[2]" or "projects[0].outcome". */
  target: string;
  /** What is wrong, in plain language. */
  message: string;
  /** How to fix it. */
  suggestion: string;
  example?: { weak: string; strong: string };
  /** Optional structured fix the UI can apply in one click. Shape is defined per rule. */
  autoFix?: unknown;
}

export interface Review {
  /** 0 to 100, weighted across all applicable rules. */
  score: number;
  label: ScoreLabel;
  /** 0 to 100 per category. Only categories with at least one applicable rule appear. */
  categories: Record<string, number>;
  /** Sorted: severity (critical first), then by how many points fixing it would add. */
  findings: Finding[];
  /** The single most valuable thing to fix next. Undefined when there are no findings. */
  nextBestAction?: Finding;
}

export interface Advisor<T> {
  review(input: T, ctx: StudentContext): Promise<Review>;
}

/** Copy for a rule. All rule text lives in the rule file, never in components. */
export interface RuleCopy {
  message: string;
  suggestion: string;
  example?: { weak: string; strong: string };
}

/** One failing instance found by a rule. Copy fields override the rule's default copy. */
export interface RuleFailure {
  target: string;
  message?: string;
  suggestion?: string;
  example?: { weak: string; strong: string };
  autoFix?: unknown;
  severity?: Severity;
}

export interface RuleResult {
  /** 0 (fully failing) to 1 (fully passing). Partial credit is allowed. */
  score: number;
  failures?: RuleFailure[];
}

export interface Rule<T> {
  id: string;
  category: string;
  /** Relative importance within the rule set. Must be greater than 0. */
  weight: number;
  severity: Severity;
  copy: RuleCopy;
  /** Return false when the rule does not apply (it is then left out of scoring). */
  appliesTo?: (input: T, ctx: StudentContext) => boolean;
  /** Pure function: no I/O, no randomness, no clock reads (use ctx.now). */
  check: (input: T, ctx: StudentContext) => RuleResult;
}

// ---------------------------------------------------------------------------
// Student context: everything Merit already knows about the student.
// ---------------------------------------------------------------------------

export interface StudentProfile {
  name: string | null;
  headline: string | null;
  bio: string | null;
  contactEmail: string | null;
  targetRoles: string[];
  /** Portfolio and social links, with the CV/resume link removed. */
  portfolioLinks: string[];
  /** CV/resume link stored in portfolio_links, if any. */
  resumeUrl: string | null;
  passportSlug: string | null;
  roleType: "candidate" | "recruiter" | null;
}

export interface StudentProjectArtifact {
  url: string;
  type: string;
  label: string;
}

export interface StudentProject {
  projectId: string;
  title: string;
  hook: string;
  problemSolved: string;
  whatWasBuilt: string;
  impact: string | null;
  projectType: "web" | "design" | "document" | "other";
  category: string;
  coverImageUrl: string | null;
  isFeatured: boolean;
  skills: string[];
  artifacts: StudentProjectArtifact[];
  createdAt: string;
}

/** Education is not stored yet (planned for Stage 3); kept here so rules can rely on the shape. */
export interface StudentEducation {
  institution: string;
  course: string;
  expectedGraduation: string | null;
  yearOfStudy: number | null;
}

export interface StudentContext {
  userId: string;
  profile: StudentProfile;
  projects: StudentProject[];
  /** Unique, lower-cased skills across all projects. */
  skills: string[];
  education: StudentEducation[];
  /** Structured resume data once the Resume Builder exists (Stage 3). */
  resume: unknown | null;
  /** Injected clock so rules stay deterministic in tests. ISO string. */
  now: string;
}
