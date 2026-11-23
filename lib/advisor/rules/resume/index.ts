import { RuleBasedAdvisor } from "@/lib/advisor/runner";
import type { Rule } from "@/lib/advisor/types";
import { bulletRules } from "@/lib/advisor/rules/resume/bullets";
import { completenessRules } from "@/lib/advisor/rules/resume/completeness";
import { contentRules } from "@/lib/advisor/rules/resume/content";
import type { ResumeData } from "@/lib/resume/types";

/** All resume rules, in display order. See docs/resume-builder.md for the list. */
export const resumeRules: Rule<ResumeData>[] = [...completenessRules, ...bulletRules, ...contentRules];

export const resumeAdvisor = new RuleBasedAdvisor<ResumeData>(resumeRules);

/** Category display names for the feedback panel. */
export const RESUME_CATEGORY_LABELS: Record<string, string> = {
  completeness: "Complete",
  bullets: "Bullets",
  content: "Content",
  layout: "Length",
  design: "Design"
};
