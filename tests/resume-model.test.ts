import { describe, expect, it } from "vitest";
import { emptyStudentContext } from "@/lib/advisor/context";
import type { StudentContext, StudentProject } from "@/lib/advisor/types";
import {
  addMissingPassportProjects,
  emptyResume,
  normalizeResume,
  passportUrlFor,
  prefillResume
} from "@/lib/resume/model";
import { contactItems, formatDateRange, formatMonth, resumeFileName } from "@/lib/resume/format";

const NOW = "2026-11-23T00:00:00.000Z";
const APP = "https://meritsg.com";

function project(overrides: Partial<StudentProject>): StudentProject {
  return {
    projectId: "p1",
    title: "Campus wayfinding",
    hook: "Signs that new students can follow",
    problemSolved: "New students got lost in week one.",
    whatWasBuilt: "Designed 14 colour-coded signs in Figma. Tested them with 12 students.",
    impact: "Route-finding time fell from 9 to 4 minutes.",
    projectType: "design",
    category: "Design / Visual",
    coverImageUrl: null,
    isFeatured: true,
    skills: ["Figma", "Illustrator"],
    artifacts: [],
    createdAt: NOW,
    ...overrides
  };
}

function context(overrides: Partial<StudentContext> = {}): StudentContext {
  const base = emptyStudentContext("user-1", NOW);
  return {
    ...base,
    profile: {
      ...base.profile,
      name: "Avery Tan",
      headline: "Year 2 UX Design student",
      contactEmail: "avery@example.com",
      portfolioLinks: ["https://www.linkedin.com/in/averytan", "https://behance.net/avery"],
      passportSlug: "avery-tan"
    },
    projects: [project({}), project({ projectId: "p2", title: "Zine", skills: ["InDesign"], impact: null })],
    skills: ["figma", "illustrator", "indesign"],
    ...overrides
  };
}

describe("passportUrlFor", () => {
  it("uses the slug when there is one, otherwise the user id path", () => {
    expect(passportUrlFor(context(), APP)).toBe("https://meritsg.com/passport/avery-tan");
    const noSlug = context();
    noSlug.profile.passportSlug = null;
    expect(passportUrlFor(noSlug, APP)).toBe("https://meritsg.com/c/user-1");
  });
});

describe("prefillResume", () => {
  const resume = prefillResume(context(), { appUrl: APP });

  it("fills basics from the profile and finds LinkedIn among the links", () => {
    expect(resume.basics).toMatchObject({
      fullName: "Avery Tan",
      email: "avery@example.com",
      headline: "Year 2 UX Design student",
      linkedinUrl: "https://www.linkedin.com/in/averytan",
      portfolioUrl: "https://meritsg.com/passport/avery-tan"
    });
  });

  it("turns each Passport project into a draft project entry with evidence link and bullets", () => {
    expect(resume.projects).toHaveLength(2);
    expect(resume.projects[0]).toMatchObject({
      title: "Campus wayfinding",
      tools: ["Figma", "Illustrator"],
      link: "https://meritsg.com/projects/p1",
      sourceProjectId: "p1",
      bullets: [
        "Designed 14 colour-coded signs in Figma.",
        "Tested them with 12 students.",
        "Route-finding time fell from 9 to 4 minutes."
      ]
    });
    expect(resume.projects[1].bullets).toEqual([
      "Designed 14 colour-coded signs in Figma.",
      "Tested them with 12 students."
    ]);
  });

  it("collects skills from projects, keeping their original case", () => {
    expect(resume.skills).toEqual(["Figma", "Illustrator", "InDesign"]);
  });

  it("prefills education from the profile", () => {
    const withEducation = prefillResume(
      context({
        education: [{ institution: "Example Polytechnic", course: "Diploma in UX Design", startDate: "2025-04", expectedGraduation: "2028-03", yearOfStudy: 2 }]
      }),
      { appUrl: APP }
    );
    expect(withEducation.education).toHaveLength(1);
    expect(withEducation.education[0]).toMatchObject({
      institution: "Example Polytechnic",
      course: "Diploma in UX Design",
      startDate: "2025-04",
      endDate: "2028-03"
    });
  });

  it("starts education and experience empty, with unique entry ids", () => {
    expect(resume.education).toEqual([]);
    expect(resume.experience).toEqual([]);
    expect(new Set(resume.projects.map((entry) => entry.id)).size).toBe(2);
  });
});

describe("addMissingPassportProjects", () => {
  it("adds only Passport projects that are not already in the resume", () => {
    const resume = prefillResume(context({ projects: [project({})] }), { appUrl: APP });
    const { resume: updated, added } = addMissingPassportProjects(resume, context(), { appUrl: APP });
    expect(added).toBe(1);
    expect(updated.projects.map((entry) => entry.sourceProjectId)).toEqual(["p1", "p2"]);
    expect(addMissingPassportProjects(updated, context(), { appUrl: APP }).added).toBe(0);
  });
});

describe("normalizeResume", () => {
  it("returns an empty resume for junk", () => {
    expect(normalizeResume(null)).toEqual(emptyResume());
    expect(normalizeResume("nope")).toEqual(emptyResume());
  });

  it("keeps valid fields and repairs missing or wrongly typed ones", () => {
    const repaired = normalizeResume({
      basics: { fullName: "Avery", email: 42 },
      projects: [{ id: "x", title: "Zine", bullets: ["One", 3, "Two"] }],
      skills: ["Figma", null]
    });
    expect(repaired.basics.fullName).toBe("Avery");
    expect(repaired.basics.email).toBe("");
    expect(repaired.projects[0]).toMatchObject({ id: "x", title: "Zine", bullets: ["One", "Two"], tools: [], current: false });
    expect(repaired.skills).toEqual(["Figma"]);
    expect(repaired.schemaVersion).toBe(1);
  });
});

describe("format helpers", () => {
  it("formats months and ranges", () => {
    expect(formatMonth("2026-03")).toBe("Mar 2026");
    expect(formatMonth("03/2026")).toBe("");
    expect(formatDateRange({ startDate: "2026-01", endDate: "2026-03" })).toBe("Jan 2026 – Mar 2026");
    expect(formatDateRange({ startDate: "2026-01", endDate: "", current: true })).toBe("Jan 2026 – Present");
    expect(formatDateRange({ startDate: "", endDate: "2028-05", expected: true })).toBe("Expected May 2028");
  });

  it("builds the contact line without URL schemes and a safe file name", () => {
    const resume = prefillResume(context(), { appUrl: APP });
    expect(contactItems(resume)).toEqual([
      "avery@example.com",
      "www.linkedin.com/in/averytan",
      "meritsg.com/passport/avery-tan"
    ]);
    expect(resumeFileName(resume)).toBe("Avery-Tan-Resume.pdf");
  });
});
