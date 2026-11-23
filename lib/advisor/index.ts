// Public API of the advisor engine. Import from "@/lib/advisor" in rules and UI.
// The database loader is server-only: import it from "@/lib/advisor/context-loader".
export type {
  Advisor,
  Finding,
  Review,
  Rule,
  RuleCopy,
  RuleFailure,
  RuleResult,
  ScoreLabel,
  Severity,
  StudentContext,
  StudentEducation,
  StudentProfile,
  StudentProject
} from "@/lib/advisor/types";
export { labelForScore, SCORE_LABEL_THRESHOLDS, SEVERITY_ORDER } from "@/lib/advisor/config";
export { RuleBasedAdvisor, runRules } from "@/lib/advisor/runner";
export { buildStudentContext, emptyStudentContext } from "@/lib/advisor/context";
export {
  ACTION_VERBS,
  ACTION_VERBS_PRESENT,
  FILLER_PHRASES,
  findFillerPhrases,
  leadingActionVerb
} from "@/lib/advisor/data/language";
