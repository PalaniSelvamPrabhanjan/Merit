import type { Rule } from "@/lib/advisor/types";
import type { StudentProject } from "@/lib/advisor/types";
import { OUTCOME_WORDS } from "@/lib/advisor/data/resume-terms";
import { getUploadedFileName } from "@/lib/artifacts";

type ProjectRule = Rule<StudentProject>;

/** Lengths used by the case-study rules and the editor's character guidance. */
export const CASE_STUDY_LIMITS = {
  problem: { min: 60, ideal: [80, 300] as const, max: 600 },
  process: { min: 150, ideal: [200, 700] as const, max: 1500 },
  outcome: { min: 40, ideal: [60, 300] as const, max: 600 }
};

export const MIN_PROCESS_IMAGES = 3;

/** Distinct images: image artifacts plus the cover when it isn't one of them. */
export function projectImages(project: StudentProject): Array<{ url: string; altText: string; isCover: boolean }> {
  const images: Array<{ url: string; altText: string; isCover: boolean }> = [];
  const seen = new Set<string>();
  const key = (url: string) => (getUploadedFileName(url) ?? url).toLowerCase();
  if (project.coverImageUrl) {
    images.push({ url: project.coverImageUrl, altText: project.coverAltText, isCover: true });
    seen.add(key(project.coverImageUrl));
  }
  for (const artifact of project.artifacts) {
    if (artifact.type !== "image" || seen.has(key(artifact.url))) continue;
    seen.add(key(artifact.url));
    images.push({ url: artifact.url, altText: artifact.altText, isCover: false });
  }
  return images;
}

const RESULT_PATTERN = new RegExp(`(\\d|%|\\b(${OUTCOME_WORDS.join("|")}|feedback|grade|distinction|shipped|used by)\\b)`, "i");

export const coverRule: ProjectRule = {
  id: "portfolio.project.cover",
  category: "visuals",
  weight: 4,
  severity: "critical",
  copy: {
    message: "Add a cover image.",
    suggestion: "It's the first thing employers see on your Passport. Use your strongest final shot."
  },
  check: (project) => (project.coverImageUrl ? { score: 1 } : { score: 0, failures: [{ target: "coverImageUrl" }] })
};

export const roleRule: ProjectRule = {
  id: "portfolio.project.role",
  category: "case-study",
  weight: 3,
  severity: "improve",
  copy: {
    message: "Say what your role was.",
    suggestion: "Employers want to know what you did, especially on team projects.",
    example: { weak: "Group project", strong: "Lead visual designer in a team of 4; owned the sign system and map" }
  },
  check: (project) => (project.role.trim() ? { score: 1 } : { score: 0, failures: [{ target: "role" }] })
};

export const toolsRule: ProjectRule = {
  id: "portfolio.project.tools",
  category: "case-study",
  weight: 1,
  severity: "improve",
  copy: {
    message: "List the tools you used.",
    suggestion: "Add them as skills, e.g. Figma, Illustrator, user interviews. They also help employers find you."
  },
  check: (project) => (project.skills.length ? { score: 1 } : { score: 0, failures: [{ target: "skills" }] })
};

export const timeframeRule: ProjectRule = {
  id: "portfolio.project.timeframe",
  category: "case-study",
  weight: 1,
  severity: "polish",
  copy: {
    message: "Add when you did this project.",
    suggestion: "A start month (and end month if finished) shows how recent and how long the work was."
  },
  check: (project) => (project.startedMonth ? { score: 1 } : { score: 0, failures: [{ target: "startedMonth" }] })
};

export const problemRule: ProjectRule = {
  id: "portfolio.project.problem",
  category: "case-study",
  weight: 3,
  severity: "improve",
  copy: {
    message: "Explain the problem you were solving.",
    suggestion: "Who had the problem, and what was hard for them? Two or three sentences.",
    example: {
      weak: "Students get lost.",
      strong: "First-year students at our 12-building campus missed classes in week one because signs used building codes nobody knew."
    }
  },
  check: (project) => {
    const problem = project.problemSolved.trim();
    const sameAsHook = problem.toLowerCase() === project.hook.trim().toLowerCase();
    if (problem.length >= CASE_STUDY_LIMITS.problem.min && !sameAsHook) return { score: 1 };
    return {
      score: problem.length >= CASE_STUDY_LIMITS.problem.min / 2 && !sameAsHook ? 0.5 : 0,
      failures: [
        {
          target: "problemSolved",
          ...(sameAsHook && problem ? { message: "The problem just repeats your one-line hook. Say more about who struggled and why." } : {})
        }
      ]
    };
  }
};

export const processRule: ProjectRule = {
  id: "portfolio.project.process",
  category: "case-study",
  weight: 3,
  severity: "improve",
  copy: {
    message: "Describe how you worked.",
    suggestion: "Research, sketches, iterations, testing: what you tried, what you learned, what you changed.",
    example: {
      weak: "I made the signs in Figma.",
      strong: "Interviewed 12 students, mapped 5 problem routes, sketched 3 sign systems and tested paper prototypes on site before picking colour coding."
    }
  },
  check: (project) => {
    const length = project.whatWasBuilt.trim().length;
    if (length >= CASE_STUDY_LIMITS.process.min) return { score: 1 };
    return { score: length / CASE_STUDY_LIMITS.process.min, failures: [{ target: "whatWasBuilt" }] };
  }
};

export const outcomeRule: ProjectRule = {
  id: "portfolio.project.outcome",
  category: "case-study",
  weight: 3,
  severity: "improve",
  copy: {
    message: "Share the outcome.",
    suggestion: "What changed? Feedback, a number, an award, a grade, or that it shipped.",
    example: { weak: "It went well.", strong: "Route-finding time fell from 9 to 4 minutes in tests; the school is printing the signs for 2027." }
  },
  check: (project) => {
    const outcome = (project.impact ?? "").trim();
    if (outcome.length < CASE_STUDY_LIMITS.outcome.min) {
      return { score: outcome ? 0.3 : 0, failures: [{ target: "impact" }] };
    }
    if (!RESULT_PATTERN.test(outcome)) {
      return {
        score: 0.7,
        failures: [
          {
            target: "impact",
            severity: "polish",
            message: "Your outcome doesn't state a result yet.",
            suggestion: "Add evidence: a number, quoted feedback, a grade, an award, or who uses it now."
          }
        ]
      };
    }
    return { score: 1 };
  }
};

export const processImagesRule: ProjectRule = {
  id: "portfolio.project.process-images",
  category: "visuals",
  weight: 3,
  severity: "improve",
  copy: {
    message: `Show your process with at least ${MIN_PROCESS_IMAGES} images.`,
    suggestion: "Add sketches, wireframes or iterations, not only the final shot. Employers hire for how you think."
  },
  appliesTo: (project) => project.projectType === "design",
  check: (project) => {
    const count = projectImages(project).length;
    if (count >= MIN_PROCESS_IMAGES) return { score: 1 };
    return {
      score: count / MIN_PROCESS_IMAGES,
      failures: [{ target: "images", message: `This project has ${count} image${count === 1 ? "" : "s"}. Add ${MIN_PROCESS_IMAGES - count} more showing your process.` }]
    };
  }
};

export const altTextRule: ProjectRule = {
  id: "portfolio.project.alt-text",
  category: "visuals",
  weight: 1,
  severity: "improve",
  copy: {
    message: "Describe your images.",
    suggestion: "Write one line per image saying what it shows. Screen-reader users and search engines rely on it.",
    example: { weak: "image1", strong: "Paper prototype of the colour-coded sign taped to Block B's entrance" }
  },
  appliesTo: (project) => projectImages(project).length > 0,
  check: (project) => {
    const images = projectImages(project);
    const missing = images.filter((image) => !image.altText.trim());
    if (!missing.length) return { score: 1 };
    return {
      score: 1 - missing.length / images.length,
      failures: [{ target: "images", message: `${missing.length} of ${images.length} images have no description.` }]
    };
  }
};

/** All per-project rules, in checklist order. */
export const projectRules: ProjectRule[] = [
  coverRule,
  problemRule,
  roleRule,
  processRule,
  outcomeRule,
  processImagesRule,
  altTextRule,
  toolsRule,
  timeframeRule
];

/** Short labels for the per-project checklist. */
export const PROJECT_CHECKLIST_LABELS: Record<string, string> = {
  [coverRule.id]: "Cover image",
  [problemRule.id]: "Problem explained",
  [roleRule.id]: "Your role",
  [processRule.id]: "Process described",
  [outcomeRule.id]: "Outcome with a result",
  [processImagesRule.id]: `${MIN_PROCESS_IMAGES}+ process images`,
  [altTextRule.id]: "Image descriptions",
  [toolsRule.id]: "Tools listed",
  [timeframeRule.id]: "Timeframe"
};
