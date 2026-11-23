import { runRules, RuleBasedAdvisor } from "@/lib/advisor/runner";
import type { Rule, RuleFailure, StudentContext, StudentProject } from "@/lib/advisor/types";
import { projectRules, PROJECT_CHECKLIST_LABELS } from "@/lib/advisor/rules/portfolio/project";

type PassportRule = Rule<StudentContext>;

export const MIN_PROJECTS = 3;
export const MAX_PROJECTS = 6;

/**
 * Run a per-project rule across every project. Score = average over projects the rule
 * applies to; failure targets are prefixed with "projects[i]." so the UI can find them.
 */
export function acrossProjects(rule: Rule<StudentProject>): PassportRule {
  return {
    ...rule,
    appliesTo: (ctx) => ctx.projects.some((project) => !rule.appliesTo || rule.appliesTo(project, ctx)),
    check: (ctx) => {
      const scores: number[] = [];
      const failures: RuleFailure[] = [];
      ctx.projects.forEach((project, index) => {
        if (rule.appliesTo && !rule.appliesTo(project, ctx)) return;
        const result = rule.check(project, ctx);
        scores.push(result.score);
        for (const failure of result.failures ?? []) {
          failures.push({
            ...failure,
            target: `projects[${index}].${failure.target}`,
            message: `“${project.title || "Untitled project"}”: ${failure.message ?? rule.copy.message}`
          });
        }
      });
      const score = scores.length ? scores.reduce((sum, value) => sum + value, 0) / scores.length : 1;
      return { score, failures };
    }
  };
}

function sentenceCount(text: string): number {
  return text
    .split(/[.!?]+(?:\s|$)/)
    .map((part) => part.trim())
    .filter((part) => part.length > 3).length;
}

export const projectCountRule: PassportRule = {
  id: "portfolio.projects.count",
  category: "projects",
  weight: 5,
  severity: "improve",
  copy: {
    message: `Show ${MIN_PROJECTS} to ${MAX_PROJECTS} projects.`,
    suggestion: "Enough to show range, few enough that each one is strong. Class projects count."
  },
  check: (ctx) => {
    const count = ctx.projects.length;
    if (count >= MIN_PROJECTS && count <= MAX_PROJECTS) return { score: 1 };
    if (count === 0) {
      return {
        score: 0,
        failures: [{ target: "projects", severity: "critical", message: "Add your first project. Your Passport is empty without one." }]
      };
    }
    if (count < MIN_PROJECTS) {
      return {
        score: count / MIN_PROJECTS,
        failures: [{ target: "projects", message: `You have ${count} project${count === 1 ? "" : "s"}. Add ${MIN_PROJECTS - count} more to show your range.` }]
      };
    }
    return {
      score: 0.8,
      failures: [
        {
          target: "projects",
          severity: "polish",
          message: `You have ${count} projects. Employers rarely look past the first ${MAX_PROJECTS}.`,
          suggestion: "Keep your strongest six and remove or merge the rest."
        }
      ]
    };
  }
};

/** Case-study completeness of one project, 0–100 (used to compare projects). */
export function projectStrength(project: StudentProject, ctx: StudentContext): number {
  return runRules(projectRules, project, ctx).score;
}

export const strongestFirstRule: PassportRule = {
  id: "portfolio.projects.strongest-first",
  category: "projects",
  weight: 2,
  severity: "polish",
  copy: {
    message: "Lead with your strongest project.",
    suggestion: "Employers look at the first project most. Feature the one with the clearest story and best visuals."
  },
  appliesTo: (ctx) => ctx.projects.length >= 2,
  check: (ctx) => {
    const strengths = ctx.projects.map((project) => projectStrength(project, ctx));
    const best = Math.max(...strengths);
    const featuredIndex = ctx.projects.findIndex((project) => project.isFeatured);
    if (featuredIndex === -1) {
      return { score: 0.5, failures: [{ target: "projects", message: "None of your projects is featured yet." }] };
    }
    if (strengths[featuredIndex] >= best - 5) return { score: 1 };
    const bestIndex = strengths.indexOf(best);
    return {
      score: 0.5,
      failures: [
        {
          target: `projects[${featuredIndex}]`,
          message: `“${ctx.projects[bestIndex].title}” is stronger than your featured project. Consider featuring it instead.`
        }
      ]
    };
  }
};

export const bioRule: PassportRule = {
  id: "portfolio.profile.bio",
  category: "profile",
  weight: 3,
  severity: "improve",
  copy: {
    message: "Write a 2–3 sentence bio.",
    suggestion: "Say who you are, what you make, and what you're looking for.",
    example: {
      weak: "I love design!!",
      strong: "Year 2 UX design student at Example Polytechnic. I design calm, accessible apps and wayfinding. Looking for a product design internship from May 2027."
    }
  },
  check: (ctx) => {
    const bio = (ctx.profile.bio ?? "").trim();
    if (!bio) return { score: 0, failures: [{ target: "profile.bio" }] };
    const sentences = sentenceCount(bio);
    const mentionsGoal = /\b(looking|seeking|open to|interested in|hoping|want to|aiming|available)\b/i.test(bio);
    if (sentences >= 2 && sentences <= 4 && mentionsGoal) return { score: 1 };
    if (!mentionsGoal) {
      return {
        score: 0.6,
        failures: [{ target: "profile.bio", message: "Your bio doesn't say what you're looking for.", suggestion: "End with the kind of internship or role you want, and when." }]
      };
    }
    return {
      score: 0.7,
      failures: [
        {
          target: "profile.bio",
          severity: "polish",
          message: sentences < 2 ? "Your bio is a single sentence." : "Your bio is long for a first impression.",
          suggestion: "Aim for 2–3 sentences: who you are, what you make, what you're looking for."
        }
      ]
    };
  }
};

export const headlineRule: PassportRule = {
  id: "portfolio.profile.headline",
  category: "profile",
  weight: 2,
  severity: "improve",
  copy: {
    message: "Add a headline under your name.",
    suggestion: "One line: your course and year, and what you do.",
    example: { weak: "Student", strong: "Year 2 UX Design student · wayfinding and mobile apps" }
  },
  check: (ctx) => ((ctx.profile.headline ?? "").trim() ? { score: 1 } : { score: 0, failures: [{ target: "profile.headline" }] })
};

export const contactRule: PassportRule = {
  id: "portfolio.profile.contact",
  category: "profile",
  weight: 4,
  severity: "critical",
  copy: {
    message: "Add a contact email.",
    suggestion: "Employers who like your work need a way to reach you."
  },
  check: (ctx) => ((ctx.profile.contactEmail ?? "").trim() ? { score: 1 } : { score: 0, failures: [{ target: "profile.contactEmail" }] })
};

export const resumeRule: PassportRule = {
  id: "portfolio.profile.resume",
  category: "profile",
  weight: 2,
  severity: "improve",
  copy: {
    message: "Attach your resume.",
    suggestion: "Build one with the Resume builder, then add the PDF link to your Passport."
  },
  check: (ctx) => (ctx.profile.resumeUrl ? { score: 1 } : { score: 0, failures: [{ target: "profile.resumeUrl" }] })
};

export const educationRule: PassportRule = {
  id: "portfolio.profile.education",
  category: "profile",
  weight: 2,
  severity: "improve",
  copy: {
    message: "Add your school and course.",
    suggestion: "Internship employers check this first, and Merit uses it to match you with opportunities."
  },
  check: (ctx) => (ctx.education.length ? { score: 1 } : { score: 0, failures: [{ target: "profile.education" }] })
};

/** Passport strength: profile rules, project-set rules and every project rule across projects. */
export const passportRules: PassportRule[] = [
  projectCountRule,
  contactRule,
  bioRule,
  headlineRule,
  educationRule,
  resumeRule,
  strongestFirstRule,
  ...projectRules.map(acrossProjects)
];

export const passportAdvisor = new RuleBasedAdvisor<StudentContext>(passportRules);

export const PASSPORT_CATEGORY_LABELS: Record<string, string> = {
  profile: "Profile",
  projects: "Projects",
  "case-study": "Case studies",
  visuals: "Visuals"
};

export type ChecklistItem = { ruleId: string; label: string; done: boolean };

/** Per-project checklist: each applicable project rule, done or not. */
export function projectChecklist(project: StudentProject, ctx: StudentContext): ChecklistItem[] {
  return projectRules
    .filter((rule) => !rule.appliesTo || rule.appliesTo(project, ctx))
    .map((rule) => {
      const result = rule.check(project, ctx);
      return { ruleId: rule.id, label: PROJECT_CHECKLIST_LABELS[rule.id] ?? rule.id, done: result.score >= 1 };
    });
}

export { projectRules } from "@/lib/advisor/rules/portfolio/project";
