import { describe, expect, it } from "vitest";
import { runRules } from "@/lib/advisor/runner";
import type { Rule, StudentContext, StudentProject } from "@/lib/advisor/types";
import {
  acrossProjects,
  bioRule,
  contactRule,
  educationRule,
  headlineRule,
  passportAdvisor,
  passportRules,
  projectChecklist,
  projectCountRule,
  resumeRule,
  strongestFirstRule
} from "@/lib/advisor/rules/portfolio";
import {
  altTextRule,
  coverRule,
  outcomeRule,
  problemRule,
  processImagesRule,
  processRule,
  projectImages,
  projectRules,
  roleRule,
  timeframeRule,
  toolsRule
} from "@/lib/advisor/rules/portfolio/project";
import { samplePortfolioContext, sampleProject } from "@/lib/portfolio/sample";

const ctx = samplePortfolioContext();

function projectCase(rule: Rule<StudentProject>, mutate: (project: StudentProject) => void, targets: string[]) {
  return [rule, mutate, targets] as const;
}

const projectCases = [
  projectCase(coverRule, (p) => (p.coverImageUrl = null), ["coverImageUrl"]),
  projectCase(problemRule, (p) => (p.problemSolved = p.hook), ["problemSolved"]),
  projectCase(roleRule, (p) => (p.role = " "), ["role"]),
  projectCase(processRule, (p) => (p.whatWasBuilt = "Made it in Figma."), ["whatWasBuilt"]),
  projectCase(outcomeRule, (p) => (p.impact = null), ["impact"]),
  projectCase(processImagesRule, (p) => (p.artifacts = p.artifacts.slice(0, 1)), ["images"]),
  projectCase(altTextRule, (p) => (p.artifacts = p.artifacts.map((a) => ({ ...a, altText: "" }))), ["images"]),
  projectCase(toolsRule, (p) => (p.skills = []), ["skills"]),
  projectCase(timeframeRule, (p) => (p.startedMonth = ""), ["startedMonth"])
];

describe("project rules", () => {
  it("covers every project rule with a case", () => {
    expect(projectCases.map(([rule]) => rule.id).sort()).toEqual(projectRules.map((rule) => rule.id).sort());
  });

  describe.each(projectCases.map(([rule, mutate, targets]) => [rule.id, rule, mutate, targets] as const))("%s", (_id, rule, mutate, targets) => {
    it("passes on a strong project", () => {
      expect(runRules([rule], sampleProject(), ctx).findings).toEqual([]);
    });

    it("fails with the right target", () => {
      const project = sampleProject();
      mutate(project);
      const review = runRules([rule], project, ctx);
      expect(review.findings.map((finding) => finding.target)).toEqual(targets);
      expect(review.score).toBeLessThan(100);
    });
  });

  it("only asks design projects for process images", () => {
    const web = sampleProject({ projectType: "web", artifacts: [] });
    expect(runRules([processImagesRule], web, ctx).categories).toEqual({});
  });

  it("downgrades an outcome without a result to polish", () => {
    const [finding] = runRules([outcomeRule], sampleProject({ impact: "Everyone in class enjoyed using the signs very much." }), ctx).findings;
    expect(finding.severity).toBe("polish");
  });

  it("counts the cover once even when it is also uploaded to the gallery", () => {
    const project = sampleProject();
    project.artifacts.push({ url: project.coverImageUrl!.replace("1763880000000-abcdef", "1763880009999-zzzzzz"), type: "image", label: "", altText: "" });
    expect(projectImages(project)).toHaveLength(4);
  });
});

type PassportCase = readonly [Rule<StudentContext>, (c: StudentContext) => void, string[]];

const passportCases: PassportCase[] = [
  [projectCountRule, (c) => (c.projects = c.projects.slice(0, 1)), ["projects"]],
  [contactRule, (c) => (c.profile.contactEmail = ""), ["profile.contactEmail"]],
  [bioRule, (c) => (c.profile.bio = "I love design and making things look nice for people."), ["profile.bio"]],
  [headlineRule, (c) => (c.profile.headline = null), ["profile.headline"]],
  [educationRule, (c) => (c.education = []), ["profile.education"]],
  [resumeRule, (c) => (c.profile.resumeUrl = null), ["profile.resumeUrl"]],
  [strongestFirstRule, (c) => (c.projects[0] = { ...c.projects[0], impact: null, whatWasBuilt: "Short.", role: "" }), ["projects[0]"]]
];

describe("passport rules", () => {
  it("the sample Passport passes every rule", async () => {
    const review = await passportAdvisor.review(ctx, ctx);
    expect(review.findings).toEqual([]);
    expect(review.score).toBe(100);
    expect(review.label).toBe("Interview-ready");
  });

  it.each(passportCases.map(([rule, mutate, targets]) => [rule.id, rule, mutate, targets] as const))("%s fails with the right target", (_id, rule, mutate, targets) => {
    const c = samplePortfolioContext();
    mutate(c);
    expect(runRules([rule], c, c).findings.map((finding) => finding.target)).toEqual(targets);
  });

  it("an empty Passport makes adding a project the critical next step", async () => {
    const c = samplePortfolioContext();
    c.projects = [];
    const review = await passportAdvisor.review(c, c);
    expect(review.nextBestAction?.ruleId).toBe("portfolio.projects.count");
    expect(review.nextBestAction?.severity).toBe("critical");
    expect(review.label).not.toBe("Strong");
  });

  it("runs project rules across projects with prefixed targets and named messages", () => {
    const c = samplePortfolioContext();
    c.projects[2] = { ...c.projects[2], role: "" };
    const review = runRules([acrossProjects(roleRule)], c, c);
    expect(review.findings).toHaveLength(1);
    expect(review.findings[0].target).toBe("projects[2].role");
    expect(review.findings[0].message).toContain("Neighbourhood zine");
    expect(review.score).toBe(67);
  });

  it("includes every project rule in the Passport rule set", () => {
    const ids = passportRules.map((rule) => rule.id);
    for (const rule of projectRules) expect(ids).toContain(rule.id);
  });

  it("builds a per-project checklist", () => {
    const items = projectChecklist(sampleProject({ role: "" }), ctx);
    expect(items.find((item) => item.label === "Your role")?.done).toBe(false);
    expect(items.find((item) => item.label === "Cover image")?.done).toBe(true);
  });
});
