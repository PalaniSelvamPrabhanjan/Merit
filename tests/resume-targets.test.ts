import { describe, expect, it } from "vitest";
import type { Finding } from "@/lib/advisor/types";
import {
  fieldIdForTarget,
  findingsAt,
  findingsFor,
  firstStepNeedingWork,
  openIssuesByStep,
  stepForTarget
} from "@/lib/resume/targets";

function finding(target: string, severity: Finding["severity"] = "improve"): Finding {
  return { ruleId: "r", severity, category: "c", target, message: "m", suggestion: "s" };
}

describe("resume targets", () => {
  it.each([
    ["basics.email", "basics"],
    ["education[0].endDate", "education"],
    ["projects[1].bullets[2]", "projects"],
    ["projects", "projects"],
    ["experience[0]", "experience"],
    ["skills", "skills"],
    ["extras[0].text", "extras"],
    ["layout", "review"]
  ] as const)("%s belongs to the %s step", (target, step) => {
    expect(stepForTarget(target)).toBe(step);
  });

  it("builds stable DOM ids for targets", () => {
    expect(fieldIdForTarget("projects[1].bullets[2]")).toBe("rf-projects-1-bullets-2");
    expect(fieldIdForTarget("basics.email")).toBe("rf-basics-email");
  });

  it("filters findings by exact target or by container", () => {
    const all = [finding("projects[1]"), finding("projects[1].bullets[0]"), finding("projects[10].link"), finding("skills")];
    expect(findingsFor(all, "projects[1]").map((f) => f.target)).toEqual(["projects[1]", "projects[1].bullets[0]"]);
    expect(findingsAt(all, "projects[1]").map((f) => f.target)).toEqual(["projects[1]"]);
  });

  it("counts open issues per step, ignoring polish", () => {
    const counts = openIssuesByStep([finding("skills"), finding("skills", "polish"), finding("basics.phone")]);
    expect(counts.skills).toBe(1);
    expect(counts.basics).toBe(1);
    expect(counts.review).toBe(0);
  });

  it("starts the student on the step with the first critical issue", () => {
    expect(firstStepNeedingWork([finding("skills"), finding("education", "critical")])).toBe("education");
    expect(firstStepNeedingWork([finding("skills", "polish"), finding("experience[0].bullets[0]")])).toBe("experience");
    expect(firstStepNeedingWork([finding("projects[0].link", "polish")])).toBe("review");
  });
});
