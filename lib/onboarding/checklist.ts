import type { StudentContext } from "@/lib/advisor/types";
import { MIN_PROCESS_IMAGES, projectImages } from "@/lib/advisor/rules/portfolio/project";

export type ChecklistAction = { kind: "link"; href: string; label: string } | { kind: "section"; sectionId: string; label: string };

export interface GettingStartedItem {
  id: string;
  label: string;
  why: string;
  done: boolean;
  action: ChecklistAction;
}

/** The first-run "Getting started" checklist, in order. */
export function gettingStartedItems(ctx: StudentContext): GettingStartedItem[] {
  const firstProject = ctx.projects[0];
  return [
    {
      id: "education",
      label: "Add your school and course",
      why: "Employers check this first.",
      done: ctx.education.length > 0,
      action: { kind: "section", sectionId: "card-education", label: "Add education" }
    },
    {
      id: "bio",
      label: "Write a 2–3 sentence bio",
      why: "Who you are, what you make, what you're looking for.",
      done: Boolean((ctx.profile.bio ?? "").trim()),
      action: { kind: "section", sectionId: "card-profile", label: "Write bio" }
    },
    {
      id: "first-project",
      label: "Add your first project",
      why: "Pick something you're proud of. You can add more later.",
      done: ctx.projects.length > 0,
      action: { kind: "link", href: "/projects/new", label: "Add project" }
    },
    {
      id: "process-images",
      label: `Show your process: ${MIN_PROCESS_IMAGES}+ images on a project`,
      why: "Sketches and iterations show how you think, not just the final shot.",
      done: ctx.projects.some((project) => projectImages(project).length >= MIN_PROCESS_IMAGES),
      action: firstProject
        ? { kind: "link", href: `/projects/${firstProject.projectId}/edit#case-images`, label: "Add images" }
        : { kind: "link", href: "/projects/new", label: "Add project" }
    },
    {
      id: "resume",
      label: "Attach your resume",
      why: "Build one with the Resume builder, then add the PDF link.",
      done: Boolean(ctx.profile.resumeUrl),
      action: { kind: "link", href: "/resume", label: "Open Resume builder" }
    },
    {
      id: "passport-link",
      label: "Choose your Passport link",
      why: "A short link like meritsg.com/passport/your-name is easy to share.",
      done: Boolean(ctx.profile.passportSlug),
      action: { kind: "link", href: "/profile#passport", label: "Set link" }
    }
  ];
}
