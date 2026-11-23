import { emptyStudentContext } from "@/lib/advisor/context";
import type { StudentContext } from "@/lib/advisor/types";
import type { ResumeData } from "@/lib/resume/types";

// Fictional sample student used by tests, the dev preview page and the sample PDF.
// It passes every resume rule. Not real student data.

export const SAMPLE_NOW = "2026-11-23T00:00:00.000Z";

export function sampleResume(): ResumeData {
  return {
    schemaVersion: 1,
    template: "classic",
    basics: {
      fullName: "Avery Tan",
      email: "avery.tan@example.com",
      phone: "+65 8123 4567",
      linkedinUrl: "https://www.linkedin.com/in/avery-tan-example",
      portfolioUrl: "https://meritsg.com/passport/avery-tan",
      location: "Singapore · available May–Aug 2027",
      headline: "Year 2 User Experience Design student"
    },
    education: [
      {
        id: "edu-1",
        institution: "Example Polytechnic",
        course: "Diploma in User Experience Design",
        startDate: "2025-04",
        endDate: "2028-03",
        details: "Director's List 2025 · Modules: Interaction Design, Design Research, Visual Communication"
      }
    ],
    projects: [
      {
        id: "proj-1",
        title: "Campus wayfinding redesign",
        role: "UX designer, team of 4",
        tools: ["Figma", "Illustrator"],
        startDate: "2026-01",
        endDate: "2026-03",
        current: false,
        link: "https://meritsg.com/projects/example-wayfinding",
        sourceProjectId: null,
        bullets: [
          "Interviewed 12 first-year students to map where and why they got lost in week one.",
          "Designed 14 colour-coded signs in Illustrator and a matching campus map in Figma.",
          "Tested 3 prototype rounds; the final design cut route-finding time from 9 to 4 minutes."
        ]
      },
      {
        id: "proj-2",
        title: "Hawker queue app concept",
        role: "Solo project",
        tools: ["Figma", "ProtoPie"],
        startDate: "2026-05",
        endDate: "2026-07",
        current: false,
        link: "https://meritsg.com/projects/example-queue",
        sourceProjectId: null,
        bullets: [
          "Prototyped a 9-screen ordering flow in Figma for busy lunch-hour hawker centres.",
          "Ran usability tests with 6 office workers and fixed 4 navigation issues they found."
        ]
      }
    ],
    experience: [
      {
        id: "exp-1",
        organisation: "Example Print Studio",
        role: "Part-time design assistant",
        location: "Singapore",
        startDate: "2026-08",
        endDate: "",
        current: true,
        bullets: [
          "Prepare print-ready files in InDesign for about 20 client orders each month.",
          "Create social media graphics in Photoshop that reach 3,000 followers weekly."
        ]
      }
    ],
    skills: ["Figma", "Illustrator", "Photoshop", "InDesign", "ProtoPie", "User interviews", "Usability testing"],
    extras: [
      { id: "extra-1", label: "Awards", text: "Finalist, Example Design Hackathon 2026 (top 5 of 40 teams)" },
      { id: "extra-2", label: "Languages", text: "English (fluent), Mandarin (conversational)" }
    ]
  };
}

export function sampleContext(): StudentContext {
  const ctx = emptyStudentContext("sample-user", SAMPLE_NOW);
  return {
    ...ctx,
    profile: {
      ...ctx.profile,
      name: "Avery Tan",
      headline: "Year 2 User Experience Design student",
      contactEmail: "avery.tan@example.com",
      targetRoles: ["UX Design Intern"],
      passportSlug: "avery-tan"
    }
  };
}
