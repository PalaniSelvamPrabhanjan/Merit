import { emptyStudentContext } from "@/lib/advisor/context";
import type { StudentContext, StudentProject } from "@/lib/advisor/types";

// Fictional student used by tests and dev preview pages. Passes every portfolio rule.
// Not real student data; image URLs are placeholders.

export const SAMPLE_PORTFOLIO_NOW = "2026-11-23T00:00:00.000Z";

function img(name: string, altText: string) {
  return { url: `https://example.com/storage/v1/object/public/project-artifacts/u/1763880000000-abcdef-${name}`, type: "image", label: name, altText };
}

export function sampleProject(overrides: Partial<StudentProject> = {}): StudentProject {
  return {
    projectId: "p-wayfinding",
    title: "Campus wayfinding redesign",
    hook: "Colour-coded signs that new students can follow on day one",
    problemSolved:
      "First-year students at our 12-building campus missed classes in week one because signs used building codes nobody knew yet.",
    whatWasBuilt:
      "Interviewed 12 first-year students and mapped the 5 routes where they got lost. Sketched three sign systems, tested paper prototypes on site, then refined the colour-coded version in Illustrator and built a matching map in Figma.",
    impact: "Route-finding time fell from 9 to 4 minutes in tests with 12 students; the school is printing the signs for 2027.",
    role: "Lead visual designer in a team of 4; owned the sign system and map",
    startedMonth: "2026-01",
    finishedMonth: "2026-03",
    coverAltText: "Final colour-coded sign outside Block B",
    projectType: "design",
    category: "Design / Visual",
    coverImageUrl: img("cover.png", "").url,
    isFeatured: true,
    skills: ["Figma", "Illustrator", "User interviews"],
    artifacts: [
      img("sketches.png", "Pencil sketches of three sign layouts"),
      img("prototype.png", "Paper prototype taped to a corridor wall"),
      img("map.png", "Campus map with five colour-coded routes")
    ],
    createdAt: SAMPLE_PORTFOLIO_NOW,
    ...overrides
  };
}

export function samplePortfolioContext(): StudentContext {
  const ctx = emptyStudentContext("sample-user", SAMPLE_PORTFOLIO_NOW);
  return {
    ...ctx,
    profile: {
      ...ctx.profile,
      name: "Avery Tan",
      headline: "Year 2 UX Design student · wayfinding and mobile apps",
      bio: "Year 2 UX design student at Example Polytechnic. I design calm, accessible apps and wayfinding systems. Looking for a product design internship from May 2027.",
      contactEmail: "avery.tan@example.com",
      targetRoles: ["Product design intern"],
      resumeUrl: "https://example.com/avery-tan-resume.pdf",
      passportSlug: "avery-tan",
      roleType: "candidate"
    },
    education: [
      { institution: "Example Polytechnic", course: "Diploma in User Experience Design", startDate: "2025-04", expectedGraduation: "2028-03", yearOfStudy: 2 }
    ],
    projects: [
      sampleProject(),
      sampleProject({ projectId: "p-queue", title: "Hawker queue app concept", isFeatured: false }),
      sampleProject({ projectId: "p-zine", title: "Neighbourhood zine", isFeatured: false })
    ]
  };
}
