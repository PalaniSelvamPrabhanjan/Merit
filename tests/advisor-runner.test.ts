import { describe, expect, it } from "vitest";
import { labelForScore } from "@/lib/advisor/config";
import { RuleBasedAdvisor, runRules } from "@/lib/advisor/runner";
import { emptyStudentContext } from "@/lib/advisor/context";
import type { Rule } from "@/lib/advisor/types";

type Doc = { title: string; bullets: string[]; email: string };

const ctx = emptyStudentContext("user-1", "2026-11-23T00:00:00.000Z");

const hasTitle: Rule<Doc> = {
  id: "doc.title",
  category: "completeness",
  weight: 3,
  severity: "critical",
  copy: { message: "Add a title.", suggestion: "Give it a short title." },
  check: (doc) => (doc.title.trim() ? { score: 1 } : { score: 0, failures: [{ target: "title" }] })
};

const hasEmail: Rule<Doc> = {
  id: "doc.email",
  category: "completeness",
  weight: 1,
  severity: "improve",
  copy: { message: "Add an email.", suggestion: "Use a professional address." },
  check: (doc) => (doc.email ? { score: 1 } : { score: 0, failures: [{ target: "email" }] })
};

const bulletsHaveNumbers: Rule<Doc> = {
  id: "doc.bullets.numbers",
  category: "bullets",
  weight: 2,
  severity: "polish",
  copy: {
    message: "This bullet has no number or result.",
    suggestion: "Add a number, scale or outcome.",
    example: { weak: "Made posters.", strong: "Designed 6 posters seen by 2,000 students." }
  },
  appliesTo: (doc) => doc.bullets.length > 0,
  check: (doc) => {
    const failing = doc.bullets
      .map((bullet, index) => ({ bullet, index }))
      .filter(({ bullet }) => !/\d/.test(bullet));
    return {
      score: (doc.bullets.length - failing.length) / doc.bullets.length,
      failures: failing.map(({ index }) => ({ target: `bullets[${index}]` }))
    };
  }
};

const rules = [hasTitle, hasEmail, bulletsHaveNumbers];

describe("runRules", () => {
  it("scores 100 with no findings when every rule passes", () => {
    const review = runRules(rules, { title: "Poster", bullets: ["Made 3 posters"], email: "a@b.co" }, ctx);
    expect(review.score).toBe(100);
    expect(review.label).toBe("Interview-ready");
    expect(review.findings).toEqual([]);
    expect(review.nextBestAction).toBeUndefined();
    expect(review.categories).toEqual({ completeness: 100, bullets: 100 });
  });

  it("weights the overall score and category scores, with partial credit", () => {
    // title fails (w3, 0), email passes (w1, 1), bullets 1 of 2 pass (w2, 0.5)
    const review = runRules(rules, { title: "", bullets: ["Made 3 posters", "Made posters"], email: "a@b.co" }, ctx);
    expect(review.score).toBe(Math.round(((0 * 3 + 1 * 1 + 0.5 * 2) / 6) * 100)); // 33
    expect(review.categories).toEqual({ completeness: 25, bullets: 50 });
    expect(review.label).toBe("Getting started");
  });

  it("leaves rules that do not apply out of scoring and categories", () => {
    const review = runRules(rules, { title: "Poster", bullets: [], email: "a@b.co" }, ctx);
    expect(review.score).toBe(100);
    expect(review.categories).toEqual({ completeness: 100 });
  });

  it("builds findings from rule copy, one per failure, with rule id, category and target", () => {
    const review = runRules(rules, { title: "Poster", bullets: ["Made posters"], email: "a@b.co" }, ctx);
    expect(review.findings).toEqual([
      {
        ruleId: "doc.bullets.numbers",
        severity: "polish",
        category: "bullets",
        target: "bullets[0]",
        message: "This bullet has no number or result.",
        suggestion: "Add a number, scale or outcome.",
        example: { weak: "Made posters.", strong: "Designed 6 posters seen by 2,000 students." }
      }
    ]);
  });

  it("lets a failure override copy and severity", () => {
    const custom: Rule<Doc> = {
      ...hasEmail,
      check: () => ({
        score: 0,
        failures: [{ target: "email", message: "That email looks like a typo.", severity: "critical", autoFix: { email: "a@b.com" } }]
      })
    };
    const [finding] = runRules([custom], { title: "", bullets: [], email: "a@b.con" }, ctx).findings;
    expect(finding.message).toBe("That email looks like a typo.");
    expect(finding.suggestion).toBe("Use a professional address.");
    expect(finding.severity).toBe("critical");
    expect(finding.autoFix).toEqual({ email: "a@b.com" });
  });

  it("sorts findings by severity, then by points to gain, and picks the top one as next best action", () => {
    const review = runRules(rules, { title: "", bullets: ["Made posters"], email: "" }, ctx);
    expect(review.findings.map((finding) => finding.ruleId)).toEqual(["doc.title", "doc.email", "doc.bullets.numbers"]);
    expect(review.nextBestAction?.ruleId).toBe("doc.title");
  });

  it("ranks findings of equal severity by the points fixing them would add", () => {
    const small: Rule<Doc> = { ...hasEmail, id: "small", weight: 1, severity: "improve" };
    const big: Rule<Doc> = { ...hasEmail, id: "big", weight: 5, severity: "improve" };
    const review = runRules([small, big], { title: "", bullets: [], email: "" }, ctx);
    expect(review.findings.map((finding) => finding.ruleId)).toEqual(["big", "small"]);
  });

  it("clamps rule scores to 0..1 and scores an empty rule set as 100", () => {
    const wild: Rule<Doc> = { ...hasTitle, check: () => ({ score: 7 }) };
    expect(runRules([wild], { title: "", bullets: [], email: "" }, ctx).score).toBe(100);
    expect(runRules([], { title: "", bullets: [], email: "" }, ctx)).toEqual({
      score: 100,
      label: "Interview-ready",
      categories: {},
      findings: [],
      nextBestAction: undefined
    });
  });

  it("rejects duplicate rule ids and non-positive weights", () => {
    expect(() => runRules([hasTitle, hasTitle], { title: "", bullets: [], email: "" }, ctx)).toThrow(/duplicate rule id/i);
    expect(() => runRules([{ ...hasTitle, weight: 0 }], { title: "", bullets: [], email: "" }, ctx)).toThrow(/weight/i);
  });
});

describe("labelForScore", () => {
  it.each([
    [0, "Getting started"],
    [39, "Getting started"],
    [40, "Solid"],
    [64, "Solid"],
    [65, "Strong"],
    [84, "Strong"],
    [85, "Interview-ready"],
    [100, "Interview-ready"]
  ] as const)("%i -> %s", (score, label) => {
    expect(labelForScore(score)).toBe(label);
  });
});

describe("RuleBasedAdvisor", () => {
  it("implements Advisor<T> by running its rule set", async () => {
    const advisor = new RuleBasedAdvisor(rules);
    const review = await advisor.review({ title: "", bullets: [], email: "a@b.co" }, ctx);
    expect(review.nextBestAction?.ruleId).toBe("doc.title");
  });
});
