import { labelForScore, SEVERITY_ORDER } from "@/lib/advisor/config";
import type { Advisor, Finding, Review, Rule, StudentContext } from "@/lib/advisor/types";

type RankedFinding = { finding: Finding; gain: number; order: number };

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
}

function validateRules<T>(rules: ReadonlyArray<Rule<T>>) {
  const seen = new Set<string>();
  for (const rule of rules) {
    if (seen.has(rule.id)) {
      throw new Error(`Duplicate rule id "${rule.id}" in rule set.`);
    }
    seen.add(rule.id);
    if (!(rule.weight > 0)) {
      throw new Error(`Rule "${rule.id}" must have a weight greater than 0.`);
    }
  }
}

/**
 * Run a rule set against one input and return a Review.
 *
 * Scoring:
 * - Each applicable rule returns a score from 0 to 1 (clamped).
 * - Overall score = sum(weight × score) / sum(weight) × 100, rounded.
 * - Category score = the same, using only that category's rules.
 * - Rules whose `appliesTo` returns false are left out entirely.
 *
 * Ranking: findings are sorted by severity, then by the points fixing them would add
 * (rule weight × missing score, shared across that rule's failures), then rule order.
 * The first finding is the next best action.
 */
export function runRules<T>(rules: ReadonlyArray<Rule<T>>, input: T, ctx: StudentContext): Review {
  validateRules(rules);

  let weightTotal = 0;
  let weightedScore = 0;
  const categoryTotals = new Map<string, { weight: number; weighted: number }>();
  const ranked: RankedFinding[] = [];

  rules.forEach((rule, ruleIndex) => {
    if (rule.appliesTo && !rule.appliesTo(input, ctx)) {
      return;
    }

    const result = rule.check(input, ctx);
    const score = clamp01(result.score);

    weightTotal += rule.weight;
    weightedScore += rule.weight * score;
    const category = categoryTotals.get(rule.category) ?? { weight: 0, weighted: 0 };
    category.weight += rule.weight;
    category.weighted += rule.weight * score;
    categoryTotals.set(rule.category, category);

    const failures = result.failures ?? [];
    const totalGain = rule.weight * (1 - score);
    const gainPerFailure = failures.length > 0 ? totalGain / failures.length : 0;

    failures.forEach((failure, failureIndex) => {
      const example = failure.example ?? rule.copy.example;
      const finding: Finding = {
        ruleId: rule.id,
        severity: failure.severity ?? rule.severity,
        category: rule.category,
        target: failure.target,
        message: failure.message ?? rule.copy.message,
        suggestion: failure.suggestion ?? rule.copy.suggestion,
        ...(example ? { example } : {}),
        ...(failure.autoFix !== undefined ? { autoFix: failure.autoFix } : {})
      };
      ranked.push({ finding, gain: gainPerFailure, order: ruleIndex * 10_000 + failureIndex });
    });
  });

  ranked.sort(
    (a, b) =>
      SEVERITY_ORDER[a.finding.severity] - SEVERITY_ORDER[b.finding.severity] ||
      b.gain - a.gain ||
      a.order - b.order
  );

  const score = weightTotal > 0 ? Math.round((weightedScore / weightTotal) * 100) : 100;
  const categories: Record<string, number> = {};
  for (const [name, totals] of categoryTotals) {
    categories[name] = Math.round((totals.weighted / totals.weight) * 100);
  }
  const findings = ranked.map((item) => item.finding);

  return {
    score,
    label: labelForScore(score),
    categories,
    findings,
    nextBestAction: findings[0]
  };
}

/** Advisor backed by a fixed rule set. Async so it is interchangeable with an AgentAdvisor. */
export class RuleBasedAdvisor<T> implements Advisor<T> {
  constructor(private readonly rules: ReadonlyArray<Rule<T>>) {
    validateRules(rules);
  }

  async review(input: T, ctx: StudentContext): Promise<Review> {
    return runRules(this.rules, input, ctx);
  }
}
