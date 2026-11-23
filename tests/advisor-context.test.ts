import { describe, expect, it } from "vitest";
import { buildStudentContext, emptyStudentContext } from "@/lib/advisor/context";
import type { ProjectCardData } from "@/lib/db/projects";
import type { ViewerProfile } from "@/lib/db/profile";

const NOW = "2026-11-23T00:00:00.000Z";

const profile: ViewerProfile = {
  userId: "user-1",
  email: "avery@example.com",
  name: "Avery Tan",
  headline: "Year 2 UX design student",
  roleType: "candidate",
  targetRoles: ["Product Design Intern"],
  bio: "I design calm interfaces.",
  contactEmail: "avery@example.com",
  portfolioLinks: ["https://behance.net/avery", "https://drive.google.com/file/d/abc/view"],
  passportSlug: "avery-tan",
  profileCompletionScore: 100
};

function project(overrides: Partial<ProjectCardData>): ProjectCardData {
  return {
    projectId: "p1",
    userId: "user-1",
    title: "Wayfinding",
    hook: "Signs for new students",
    problemSolved: "Students got lost",
    whatWasBuilt: "A sign system",
    category: "Design / Visual",
    projectType: "design",
    coverImageUrl: null,
    isFeatured: false,
    impact: null,
    createdAt: NOW,
    skills: [],
    artifacts: [],
    authorName: "Avery Tan",
    authorHeadline: null,
    engagement: { views: 0, likes: 0, saves: 0 },
    feedLabel: null,
    ...overrides
  };
}

describe("buildStudentContext", () => {
  it("maps the profile, separates the resume link from portfolio links, and merges skills", () => {
    const ctx = buildStudentContext({
      userId: "user-1",
      profile,
      projects: [
        project({ projectId: "p1", skills: ["Figma", "illustrator "] }),
        project({ projectId: "p2", skills: ["figma", "User Research"] })
      ],
      now: NOW
    });

    expect(ctx.profile.resumeUrl).toBe("https://drive.google.com/file/d/abc/view");
    expect(ctx.profile.portfolioLinks).toEqual(["https://behance.net/avery"]);
    expect(ctx.profile.name).toBe("Avery Tan");
    expect(ctx.projects.map((item) => item.projectId)).toEqual(["p1", "p2"]);
    expect(ctx.skills).toEqual(["figma", "illustrator", "user research"]);
    expect(ctx.education).toEqual([]);
    expect(ctx.resume).toBeNull();
    expect(ctx.now).toBe(NOW);
  });

  it("drops presentation-only fields such as engagement from projects", () => {
    const ctx = buildStudentContext({ userId: "user-1", profile, projects: [project({})], now: NOW });
    expect(ctx.projects[0]).not.toHaveProperty("engagement");
    expect(ctx.projects[0]).not.toHaveProperty("authorName");
  });

  it("falls back to an empty profile when the student has no profile row yet", () => {
    const ctx = buildStudentContext({ userId: "user-2", profile: null, projects: [], now: NOW });
    expect(ctx).toEqual(emptyStudentContext("user-2", NOW));
  });
});
