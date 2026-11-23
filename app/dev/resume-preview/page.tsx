import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ResumeBuilder } from "@/components/resume/resume-builder";
import { emptyResume, prefillResume } from "@/lib/resume/model";
import { sampleContext, sampleResume } from "@/lib/resume/sample";
import type { StudentProject } from "@/lib/advisor/types";

// Development-only preview of the resume builder with a fictional student, so the UI
// can be checked without a database. Returns 404 in production builds.
//   /dev/resume-preview            a typical first draft prefilled from a Passport
//   /dev/resume-preview?state=empty   a brand-new student with nothing filled in
//   /dev/resume-preview?state=done    a finished resume that passes every rule

const DRAFT_PROJECTS: StudentProject[] = [
  {
    projectId: "example-wayfinding",
    title: "Campus wayfinding redesign",
    hook: "Signs that new students can follow",
    problemSolved: "New students got lost in week one.",
    whatWasBuilt: "Responsible for making the signs in Figma. I tested them with students.",
    impact: null,
    role: "",
    startedMonth: "",
    finishedMonth: "",
    coverAltText: "",
    projectType: "design",
    category: "Design / Visual",
    coverImageUrl: null,
    isFeatured: true,
    skills: ["Figma", "Illustrator", "Teamwork"],
    artifacts: [],
    createdAt: "2026-03-01T00:00:00.000Z"
  }
];

export default async function ResumePreviewPage({ searchParams }: { searchParams: Promise<{ state?: string }> }) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  const { state } = await searchParams;
  const base = sampleContext();
  const context = { ...base, projects: state === "done" ? [] : DRAFT_PROJECTS, skills: ["figma", "illustrator"] };
  const appUrl = "https://meritsg.com";

  const initialResume =
    state === "done"
      ? sampleResume()
      : state === "empty"
        ? emptyResume()
        : prefillResume(context, { appUrl });

  return (
    <AppShell userEmail="preview@example.com">
      <ResumeBuilder appUrl={appUrl} context={context} initialResume={initialResume} persistence="demo" userId="preview" />
    </AppShell>
  );
}
