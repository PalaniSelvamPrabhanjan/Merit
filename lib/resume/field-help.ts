/**
 * Copy for resume builder fields: label, helper text and an optional weak vs strong
 * example shown beside the field. Keep it short and specific to students.
 */
export interface FieldHelp {
  label: string;
  hint?: string;
  placeholder?: string;
  example?: { weak: string; strong: string };
}

export const FIELD_HELP = {
  fullName: { label: "Full name", placeholder: "Avery Tan" },
  headline: {
    label: "One-line headline",
    hint: "Your course and year, and what you're looking for.",
    placeholder: "Year 2 UX Design student seeking a 2027 product design internship",
    example: { weak: "Hard-working creative person", strong: "Year 2 UX Design student seeking a summer 2027 internship" }
  },
  email: { label: "Email", hint: "A personal address you check daily.", placeholder: "avery.tan@gmail.com" },
  phone: { label: "Phone", hint: "Include the country code.", placeholder: "+65 8123 4567" },
  linkedinUrl: { label: "LinkedIn URL", placeholder: "https://www.linkedin.com/in/your-name" },
  portfolioUrl: {
    label: "Portfolio or Merit Passport link",
    hint: "Design employers open this before anything else. Your Passport link works well."
  },
  location: {
    label: "Location and availability",
    hint: "Where you're based and when you can start.",
    placeholder: "Singapore · available May–Aug 2027"
  },
  institution: { label: "School", placeholder: "Example Polytechnic" },
  course: {
    label: "Course",
    hint: "Use the full official name.",
    placeholder: "Diploma in User Experience Design",
    example: { weak: "UXD", strong: "Diploma in User Experience Design" }
  },
  eduStart: { label: "Started", hint: "Month and year." },
  eduEnd: { label: "Graduation (expected)", hint: "Employers check this against the internship dates." },
  eduDetails: {
    label: "Highlights (optional)",
    hint: "One line: awards, relevant modules or GPA.",
    placeholder: "Director's List 2025 · Modules: Interaction Design, Design Research"
  },
  projectTitle: { label: "Project title", placeholder: "Campus wayfinding redesign" },
  projectRole: {
    label: "Your role",
    hint: "What you did and the team size.",
    placeholder: "UX designer, team of 4",
    example: { weak: "Member", strong: "Lead visual designer, team of 4" }
  },
  projectTools: { label: "Tools", hint: "Comma separated.", placeholder: "Figma, Illustrator" },
  projectLink: { label: "Evidence link", hint: "Merit project page, live site or case study." },
  start: { label: "Start", hint: "Month and year." },
  end: { label: "End" },
  current: { label: "I'm still doing this" },
  bullets: {
    label: "Bullets",
    hint: "2–4 bullets. Start with a verb, say how, and end with what changed.",
    example: {
      weak: "Responsible for making the signs.",
      strong: "Designed 14 colour-coded signs in Illustrator, cutting route-finding time from 9 to 4 minutes."
    }
  },
  organisation: { label: "Organisation", placeholder: "Example Print Studio" },
  expRole: { label: "Job title", placeholder: "Part-time design assistant" },
  expLocation: { label: "Location (optional)", placeholder: "Singapore" },
  skills: {
    label: "Skills",
    hint: "Tools and methods, comma separated. Show soft skills in your bullets instead.",
    placeholder: "Figma, Illustrator, Photoshop, user interviews, usability testing",
    example: { weak: "Teamwork, Creativity, Microsoft Word", strong: "Figma, Illustrator, user interviews, usability testing" }
  },
  extraLabel: { label: "Heading", placeholder: "Awards" },
  extraText: {
    label: "Details",
    placeholder: "Finalist, Example Design Hackathon 2026 (top 5 of 40 teams)",
    example: { weak: "Hackathon", strong: "Finalist, Example Design Hackathon 2026 (top 5 of 40 teams)" }
  }
} satisfies Record<string, FieldHelp>;

export type FieldHelpKey = keyof typeof FIELD_HELP;
