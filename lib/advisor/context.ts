import type { ProjectCardData } from "@/lib/db/projects";
import type { ViewerProfile } from "@/lib/db/profile";
import { findCvLink, isValidCvLink } from "@/lib/profile/cv-link";
import { hasEducation } from "@/lib/profile/education";
import type { StudentContext, StudentProject } from "@/lib/advisor/types";

// Pure builders only. The database loader lives in context-loader.ts (server-only),
// so rules and tests can import this file without pulling in Supabase.

export function emptyStudentContext(userId: string, now: string = new Date().toISOString()): StudentContext {
  return {
    userId,
    profile: {
      name: null,
      headline: null,
      bio: null,
      contactEmail: null,
      targetRoles: [],
      portfolioLinks: [],
      resumeUrl: null,
      passportSlug: null,
      roleType: null
    },
    projects: [],
    skills: [],
    education: [],
    resume: null,
    now
  };
}

function toStudentProject(project: ProjectCardData): StudentProject {
  return {
    projectId: project.projectId,
    title: project.title,
    hook: project.hook,
    problemSolved: project.problemSolved,
    whatWasBuilt: project.whatWasBuilt,
    impact: project.impact,
    role: project.role,
    startedMonth: project.startedMonth,
    finishedMonth: project.finishedMonth,
    coverAltText: project.coverAltText,
    projectType: project.projectType,
    category: project.category,
    coverImageUrl: project.coverImageUrl,
    isFeatured: project.isFeatured,
    skills: project.skills,
    artifacts: project.artifacts.map((artifact) => ({
      url: artifact.url,
      type: artifact.type,
      label: artifact.label,
      altText: artifact.altText
    })),
    createdAt: project.createdAt
  };
}

function uniqueSkills(projects: StudentProject[]): string[] {
  const seen = new Set<string>();
  for (const project of projects) {
    for (const skill of project.skills) {
      const normalized = skill.trim().toLowerCase();
      if (normalized) {
        seen.add(normalized);
      }
    }
  }
  return Array.from(seen).sort();
}

export function buildStudentContext({
  userId,
  profile,
  projects,
  now = new Date().toISOString()
}: {
  userId: string;
  profile: ViewerProfile | null;
  projects: ProjectCardData[];
  now?: string;
}): StudentContext {
  const base = emptyStudentContext(userId, now);
  const studentProjects = projects.map(toStudentProject);
  const links = profile?.portfolioLinks ?? [];

  return {
    ...base,
    profile: profile
      ? {
          name: profile.name,
          headline: profile.headline,
          bio: profile.bio,
          contactEmail: profile.contactEmail,
          targetRoles: profile.targetRoles,
          portfolioLinks: links.filter((link) => !isValidCvLink(link)),
          resumeUrl: findCvLink(links) || null,
          passportSlug: profile.passportSlug,
          roleType: profile.roleType
        }
      : base.profile,
    projects: studentProjects,
    skills: uniqueSkills(studentProjects),
    education:
      profile?.education && hasEducation(profile.education)
        ? [
            {
              institution: profile.education.institution,
              course: profile.education.course,
              startDate: profile.education.startMonth || null,
              expectedGraduation: profile.education.graduationMonth || null,
              yearOfStudy: profile.education.yearOfStudy
            }
          ]
        : []
  };
}
