import { describe, expect, it } from "vitest";
import { runRules } from "@/lib/advisor/runner";
import type { Rule } from "@/lib/advisor/types";
import { resumeAdvisor, resumeRules } from "@/lib/advisor/rules/resume";
import {
  actionVerbRule,
  bulletCountRule,
  bulletLengthRule,
  pronounRule,
  quantifiedRule,
  tenseRule,
  uniqueVerbsRule,
  withoutLeadingI
} from "@/lib/advisor/rules/resume/bullets";
import {
  educationPresentRule,
  emailRule,
  entriesMinimumRule,
  graduationRule,
  locationRule,
  nameRule,
  phoneOrLinkedInRule,
  portfolioRule,
  skillsPresentRule
} from "@/lib/advisor/rules/resume/completeness";
import {
  fillerRule,
  onePageRule,
  projectEvidenceRule,
  softSkillsRule,
  toolsInBulletsRule
} from "@/lib/advisor/rules/resume/content";
import { applyAutoFix, type ResumeAutoFix } from "@/lib/resume/autofix";
import { sampleContext, sampleResume } from "@/lib/resume/sample";
import type { ResumeData } from "@/lib/resume/types";

const ctx = sampleContext();

function run(rule: Rule<ResumeData>, resume: ResumeData) {
  return runRules([rule], resume, ctx);
}

function edit(mutate: (resume: ResumeData) => void): ResumeData {
  const resume = sampleResume();
  mutate(resume);
  return resume;
}

/** [rule, failing edit, expected failing targets] — every rule passes on the sample resume. */
const cases: Array<[Rule<ResumeData>, (resume: ResumeData) => void, string[]]> = [
  [nameRule, (r) => (r.basics.fullName = ""), ["basics.fullName"]],
  [emailRule, (r) => (r.basics.email = "avery@"), ["basics.email"]],
  [phoneOrLinkedInRule, (r) => ((r.basics.phone = ""), (r.basics.linkedinUrl = "")), ["basics.phone"]],
  [portfolioRule, (r) => (r.basics.portfolioUrl = ""), ["basics.portfolioUrl"]],
  [locationRule, (r) => (r.basics.location = " "), ["basics.location"]],
  [educationPresentRule, (r) => (r.education[0].course = ""), ["education[0].course"]],
  [graduationRule, (r) => (r.education[0].endDate = "soon"), ["education[0].endDate"]],
  [entriesMinimumRule, (r) => ((r.projects = r.projects.slice(0, 1)), (r.experience = [])), ["projects"]],
  [skillsPresentRule, (r) => (r.skills = ["Figma"]), ["skills"]],
  [actionVerbRule, (r) => (r.projects[0].bullets[1] = "The signs were made in Illustrator for 14 buildings."), ["projects[0].bullets[1]"]],
  [pronounRule, (r) => (r.projects[1].bullets[0] = "I prototyped a 9-screen ordering flow in Figma."), ["projects[1].bullets[0]"]],
  [bulletLengthRule, (r) => (r.projects[0].bullets[2] = "Tested 3 rounds."), ["projects[0].bullets[2]"]],
  [quantifiedRule, (r) => (r.projects[1].bullets[1] = "Ran usability tests with office workers and fixed navigation issues."), ["projects[1].bullets[1]"]],
  [tenseRule, (r) => (r.experience[0].bullets[0] = "Prepared print-ready files in InDesign for 20 client orders."), ["experience[0].bullets[0]"]],
  [uniqueVerbsRule, (r) => (r.projects[0].bullets[2] = "Interviewed 8 staff about where visitors ask for directions."), ["projects[0].bullets[2]"]],
  [bulletCountRule, (r) => (r.projects[1].bullets = ["", " "]), ["projects[1]"]],
  [onePageRule, (r) => (r.projects[0].bullets = Array.from({ length: 60 }, (_, i) => `Designed screen ${i} of a very long flow in Figma with plenty of detail.`)), ["layout"]],
  [fillerRule, (r) => (r.experience[0].bullets[1] = "Responsible for social media graphics reaching 3,000 followers."), ["experience[0].bullets[1]"]],
  [softSkillsRule, (r) => r.skills.push("Teamwork", "Creativity"), ["skills"]],
  [projectEvidenceRule, (r) => (r.projects[1].link = ""), ["projects[1].link"]],
  [toolsInBulletsRule, (r) => {
    r.projects.forEach((p) => (p.bullets = p.bullets.map((b) => b.replace(/ in (Figma|Illustrator)/g, ""))));
    r.experience.forEach((e) => (e.bullets = e.bullets.map((b) => b.replace(/ in (InDesign|Photoshop)/g, ""))));
  }, ["skills"]]
];

describe("resume rules", () => {
  it("the sample resume passes every rule with a perfect score", async () => {
    const review = await resumeAdvisor.review(sampleResume(), ctx);
    expect(review.findings).toEqual([]);
    expect(review.score).toBe(100);
    expect(review.label).toBe("Interview-ready");
  });

  it("covers every rule in the rule set with a test case", () => {
    expect(cases.map(([rule]) => rule.id).sort()).toEqual(resumeRules.map((rule) => rule.id).sort());
  });

  describe.each(cases.map(([rule, mutate, targets]) => [rule.id, rule, mutate, targets] as const))("%s", (_id, rule, mutate, targets) => {
    it("passes on a good resume", () => {
      const review = run(rule, sampleResume());
      expect(review.findings).toEqual([]);
      expect(review.score).toBe(100);
    });

    it("fails with the right targets", () => {
      const review = run(rule, edit(mutate));
      expect(review.findings.map((finding) => finding.target)).toEqual(targets);
      expect(review.score).toBeLessThan(100);
      for (const finding of review.findings) {
        expect(finding.message.length).toBeGreaterThan(0);
        expect(finding.suggestion.length).toBeGreaterThan(0);
      }
    });
  });
});

describe("rule details", () => {
  it("makes a missing portfolio critical for design students, with a Passport fix", () => {
    const [finding] = run(portfolioRule, edit((r) => (r.basics.portfolioUrl = ""))).findings;
    expect(finding.severity).toBe("critical");
    expect(finding.autoFix).toEqual({ type: "use-passport-url" });
  });

  it("keeps a missing portfolio at 'improve' for non-design students", () => {
    const plain = { ...ctx, profile: { ...ctx.profile, headline: "Accounting student", targetRoles: ["Audit intern"] } };
    const resume = edit((r) => ((r.basics.portfolioUrl = ""), (r.basics.headline = "Accounting student")));
    expect(runRules([portfolioRule], resume, plain).findings[0].severity).toBe("improve");
  });

  it("skips the design tools rule for non-design students", () => {
    const plain = { ...ctx, profile: { ...ctx.profile, headline: "Accounting student", targetRoles: [] } };
    const resume = edit((r) => ((r.basics.headline = "Accounting student"), (r.skills = ["Excel", "Xero", "SQL"])));
    expect(runRules([toolsInBulletsRule], resume, plain).categories).toEqual({});
  });

  it("names the tense to use", () => {
    const review = run(tenseRule, edit((r) => (r.projects[0].bullets[0] = "Interview 12 first-year students about week one.")));
    expect(review.findings[0].message).toContain("“interviewed”");
  });

  it("quotes the filler phrase and suggests what to write instead", () => {
    const [finding] = run(fillerRule, edit((r) => (r.basics.headline = "Hard-working team player"))).findings;
    expect(finding.target).toBe("basics.headline");
    expect(finding.message).toContain("hard-working");
  });

  it("offers safe one-click fixes that apply cleanly", () => {
    const pronoun = edit((r) => (r.projects[1].bullets[0] = "I prototyped a 9-screen ordering flow in Figma."));
    const pronounFix = run(pronounRule, pronoun).findings[0].autoFix as ResumeAutoFix;
    expect(applyAutoFix(pronoun, pronounFix, { passportUrl: "" }).projects[1].bullets[0]).toBe(
      "Prototyped a 9-screen ordering flow in Figma."
    );

    const soft = edit((r) => r.skills.push("Teamwork"));
    const softFix = run(softSkillsRule, soft).findings[0].autoFix as ResumeAutoFix;
    expect(applyAutoFix(soft, softFix, { passportUrl: "" }).skills).toEqual(sampleResume().skills);

    const noLink = edit((r) => (r.basics.portfolioUrl = ""));
    const linkFix = run(portfolioRule, noLink).findings[0].autoFix as ResumeAutoFix;
    expect(applyAutoFix(noLink, linkFix, { passportUrl: "https://meritsg.com/c/1" }).basics.portfolioUrl).toBe(
      "https://meritsg.com/c/1"
    );
  });

  it("only rewrites a leading 'I'", () => {
    expect(withoutLeadingI("I led a team of 4")).toBe("Led a team of 4");
    expect(withoutLeadingI("Led my team of 4")).toBeNull();
  });

  it("an empty resume scores low and starts with critical fixes", async () => {
    const review = await resumeAdvisor.review(
      { ...sampleResume(), basics: { ...sampleResume().basics, fullName: "", email: "", portfolioUrl: "" }, education: [], projects: [], experience: [], skills: [], extras: [] },
      ctx
    );
    expect(review.label).toBe("Getting started");
    expect(review.nextBestAction?.severity).toBe("critical");
  });
});

describe("no duplicate findings for one problem", () => {
  it("leaves 'Responsible for…' to the filler rule and 'I …' to the pronoun rule", () => {
    const resume = edit((r) => {
      r.projects[0].bullets[0] = "Responsible for interviewing 12 students about week one.";
      r.projects[0].bullets[1] = "I designed 14 colour-coded signs in Illustrator.";
    });
    expect(run(actionVerbRule, resume).findings).toEqual([]);
    expect(run(fillerRule, resume).findings.map((f) => f.target)).toEqual(["projects[0].bullets[0]"]);
    expect(run(pronounRule, resume).findings.map((f) => f.target)).toEqual(["projects[0].bullets[1]"]);
  });
});
