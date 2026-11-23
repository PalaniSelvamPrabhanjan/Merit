# Advisor engine (Stage 2)

Everything in Merit that **judges or advises** (resume checks, Passport strength, opportunity matching) goes through one small interface. Today a rule-based advisor implements it. Later an LLM-backed `AgentAdvisor` can implement the same interface, with no UI changes.

```
lib/advisor/
  types.ts            Finding, Review, Advisor<T>, Rule<T>, StudentContext
  config.ts           score label thresholds, severity order
  runner.ts           runRules() and RuleBasedAdvisor
  context.ts          buildStudentContext(), emptyStudentContext()  (pure)
  context-loader.ts   loadStudentContext(supabase, userId)          (server-only)
  data/language.ts    action verbs, filler phrases, helpers
  index.ts            public exports
  rules/              (Stages 3–5) resume/, portfolio/, matching/
tests/advisor-*.test.ts
```

## 1. The contract

```ts
type Severity = "critical" | "improve" | "polish";

interface Finding {
  ruleId: string; severity: Severity; category: string;
  target: string;            // "experience[1].bullets[2]", "projects[0].outcome"
  message: string;           // what is wrong, plain language
  suggestion: string;        // how to fix it
  example?: { weak: string; strong: string };
  autoFix?: unknown;         // structured one-click fix; shape defined by the rule
}

interface Review {
  score: number;                       // 0–100
  label: ScoreLabel;                   // Getting started | Solid | Strong | Interview-ready
  categories: Record<string, number>;  // 0–100 per category
  findings: Finding[];                 // sorted, most valuable first
  nextBestAction?: Finding;            // findings[0]
}

interface Advisor<T> { review(input: T, ctx: StudentContext): Promise<Review> }
```

This matches the brief, with two additions: `Finding.category`, so the UI can group findings and draw category bars, and `Review.label`, so every screen uses the same score bands.

## 2. Writing a rule

A rule is **data plus one small pure function**. All copy lives in the rule, never in a component.

```ts
import type { Rule } from "@/lib/advisor";
import { leadingActionVerb } from "@/lib/advisor";

export const bulletStartsWithVerb: Rule<Resume> = {
  id: "resume.bullets.action-verb",
  category: "bullets",
  weight: 3,                 // relative importance within the rule set (> 0)
  severity: "improve",
  copy: {
    message: "This bullet doesn't start with an action verb.",
    suggestion: "Lead with what you did: Designed, Tested, Led…",
    example: { weak: "Responsible for the signs.", strong: "Designed 14 wayfinding signs in Figma." }
  },
  appliesTo: (resume) => resume.experience.length > 0,   // optional; false = not scored
  check: (resume) => {
    const bullets = resume.experience.flatMap((entry, i) =>
      entry.bullets.map((text, j) => ({ text, target: `experience[${i}].bullets[${j}]` })));
    const failing = bullets.filter((bullet) => !leadingActionVerb(bullet.text));
    return {
      score: bullets.length ? 1 - failing.length / bullets.length : 1,   // partial credit
      failures: failing.map((bullet) => ({ target: bullet.target }))   // copy comes from rule.copy
    };
  }
};
```

Rules of thumb:
- **Pure.** No database, network, randomness or `Date.now()`. Use `ctx.now` for anything date-based, so tests are deterministic.
- **One concern per rule.** Return a score from 0 to 1 (partial credit is fine) and one failure per offending item. A failure may override `message`, `suggestion`, `example` or `severity` for that one item (for example, to quote the offending phrase), and may carry an `autoFix`.
- **Tests.** Every rule gets at least one passing and one failing example.
- **Ids** are dotted and stable (`resume.bullets.action-verb`). The UI and analytics key off them.

Rule sets live in `lib/advisor/rules/<domain>/` (resume in Stage 3, portfolio in Stage 4, matching in Stage 5). Each folder exports an array of rules plus an advisor:

```ts
export const resumeRules = [bulletStartsWithVerb, /* … */];
export const resumeAdvisor = new RuleBasedAdvisor(resumeRules);
```

## 3. How scoring works

`runRules(rules, input, ctx)`:

1. Skips rules whose `appliesTo` returns false. They don't count toward the score or categories.
2. Clamps each rule's score to 0–1.
3. **Overall** = Σ(weight × score) / Σ(weight) × 100, rounded. **Category** = the same over that category's rules.
4. Turns each failure into a `Finding`, using the rule's copy unless the failure overrides it.
5. **Sorts** findings by severity (critical → improve → polish), then by the points fixing them would add (`weight × (1 − score)`, shared across that rule's failures), then by rule order.
6. `nextBestAction` = the first finding.
7. `label` comes from `SCORE_LABEL_THRESHOLDS` in `config.ts`: 0–39 Getting started, 40–64 Solid, 65–84 Strong, 85+ Interview-ready.

An empty or fully-passing rule set scores 100. Duplicate rule ids and weights of 0 or less throw an error.

## 4. StudentContext: what Merit already knows

```ts
interface StudentContext {
  userId: string;
  profile: { name, headline, bio, contactEmail, targetRoles, portfolioLinks, resumeUrl, passportSlug, roleType };
  projects: StudentProject[];   // title, hook, problemSolved, whatWasBuilt, impact, type, cover, skills, artifacts…
  skills: string[];             // unique, lower-case, across all projects
  education: StudentEducation[];// [] until Stage 3 stores education
  resume: unknown | null;       // structured resume from Stage 3
  now: string;                  // ISO clock, injected
}
```

- Server code: `await loadStudentContext(supabase, userId)` from `@/lib/advisor/context-loader`. It uses the caller's Supabase client, so Row Level Security still applies.
- Tests and client code: `buildStudentContext({ userId, profile, projects, now })` or `emptyStudentContext(userId, now)`.
- `profile.resumeUrl` is pulled out of `portfolio_links` with the shared `lib/profile/cv-link.ts` check, and `portfolioLinks` excludes it.

## 5. Language data

`lib/advisor/data/language.ts`:
- `ACTION_VERBS` (past tense) and `ACTION_VERBS_PRESENT`, stored as pairs so a tense rule can tell past from current roles. They include design-specific verbs (prototyped, wireframed, illustrated, iterated…).
- `FILLER_PHRASES`, each with a `reason` and what to write `instead` ("responsible for", "team player", "hard-working"…).
- `leadingActionVerb(bullet)` returns the verb a bullet starts with (bullet characters are ignored), or null.
- `findFillerPhrases(text)` returns filler matches in text order, on whole words only.

To change the wording or add a phrase, edit this file. No component changes are needed.

## 6. Plugging in an LLM `AgentAdvisor` later

The UI only ever sees `Advisor<T>` and `Review`, so an agent can **replace** or **support** the rules:

```ts
class AgentAdvisor<T> implements Advisor<T> {
  constructor(private llm: LlmClient, private schemaName: string) {}
  async review(input: T, ctx: StudentContext): Promise<Review> {
    // 1. Send the structured input + StudentContext (not rendered text) to the model,
    //    asking for findings in the Finding JSON shape (ruleId like "agent.bullets.clarity").
    // 2. Validate the JSON against the Finding/Review shape; drop anything malformed.
    // 3. Return a Review. Use labelForScore() so labels stay consistent.
  }
}

// Recommended: rules stay the source of the score; the agent adds findings.
class HybridAdvisor<T> implements Advisor<T> {
  constructor(private rules: RuleBasedAdvisor<T>, private agent: AgentAdvisor<T>) {}
  async review(input: T, ctx: StudentContext): Promise<Review> {
    const base = await this.rules.review(input, ctx);
    const extra = await this.agent.review(input, ctx).catch(() => null); // never block on the model
    if (!extra) return base;
    const findings = [...base.findings, ...extra.findings]; // re-sort with the same severity order
    return { ...base, findings, nextBestAction: findings[0] };
  }
}
```

Guidelines for that step:
- **Keep the rule score as the number students see.** It is explainable and stable. Let the agent add or rephrase findings and examples.
- **Rule ids stay stable**, so agent findings can cite which rule they elaborate on.
- **Context is already structured.** Structured resume and project fields, not rendered text, are what the agent receives. That's why the brief asks for every answer to be stored as structured fields.
- The existing `/api/career-coach` route (OpenAI, behind `MERIT_FLAG_CAREER_COACH`) is a natural place to host the agent call later, server-side, so keys never reach the browser.
- Cache reviews by a hash of (input, context), and keep the rule-based review as the fallback when the model is slow or unavailable.

## 7. Tests

```bash
npm test   # includes tests/advisor-runner, advisor-context, advisor-language
```

- Runner: weighting, partial credit, `appliesTo`, copy overrides, sort order, next best action, clamping, validation, the label bands, and the `RuleBasedAdvisor` wrapper.
- Context: profile mapping, CV link separation, skill merge and normalisation, the empty-profile fallback.
- Language: data hygiene, design verbs present, verb detection, filler matching on word boundaries.
