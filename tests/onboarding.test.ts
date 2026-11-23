import { describe, expect, it } from "vitest";
import { emptyStudentContext } from "@/lib/advisor/context";
import { gettingStartedItems } from "@/lib/onboarding/checklist";
import { freshOnboarding, onboardingFromRow } from "@/lib/onboarding/state";
import { samplePortfolioContext } from "@/lib/portfolio/sample";

describe("getting started checklist", () => {
  it("is all open for a brand-new student", () => {
    const items = gettingStartedItems(emptyStudentContext("new"));
    expect(items.map((item) => item.id)).toEqual(["education", "bio", "first-project", "process-images", "resume", "passport-link"]);
    expect(items.every((item) => !item.done)).toBe(true);
    expect(items.find((item) => item.id === "process-images")?.action).toEqual({ kind: "link", href: "/projects/new", label: "Add project" });
  });

  it("is all done for a complete Passport", () => {
    expect(gettingStartedItems(samplePortfolioContext()).every((item) => item.done)).toBe(true);
  });

  it("points the process-images step at the first project's editor", () => {
    const ctx = samplePortfolioContext();
    ctx.projects = ctx.projects.map((project) => ({ ...project, artifacts: [] }));
    const item = gettingStartedItems(ctx).find((entry) => entry.id === "process-images")!;
    expect(item.done).toBe(false);
    expect(item.action).toMatchObject({ kind: "link", href: "/projects/p-wayfinding/edit#case-images" });
  });
});

describe("onboarding state", () => {
  it("reads a missing row as a fresh start", () => {
    expect(onboardingFromRow(null)).toEqual(freshOnboarding());
  });

  it("reads a stored row", () => {
    expect(
      onboardingFromRow({ welcome_completed_at: "2026-11-23T00:00:00Z", dismissed_tips: ["tip-a", 4], checklist_hidden: true })
    ).toEqual({ welcomeCompleted: true, dismissedTips: ["tip-a"], checklistHidden: true });
  });
});
