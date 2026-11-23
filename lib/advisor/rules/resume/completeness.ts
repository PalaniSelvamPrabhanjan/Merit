import type { Rule } from "@/lib/advisor/types";
import { filledEntries, isDesignStudent, isHttpUrl } from "@/lib/advisor/rules/resume/helpers";
import { isMonthValue } from "@/lib/resume/format";
import type { ResumeData } from "@/lib/resume/types";

type ResumeRule = Rule<ResumeData>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const nameRule: ResumeRule = {
  id: "resume.basics.name",
  category: "completeness",
  weight: 5,
  severity: "critical",
  copy: {
    message: "Your resume needs your full name at the top.",
    suggestion: "Use the name you want employers to call you, first and last."
  },
  check: (resume) =>
    resume.basics.fullName.trim().length >= 2 ? { score: 1 } : { score: 0, failures: [{ target: "basics.fullName" }] }
};

export const emailRule: ResumeRule = {
  id: "resume.basics.email",
  category: "completeness",
  weight: 5,
  severity: "critical",
  copy: {
    message: "Add an email address employers can reach you on.",
    suggestion: "Use a personal address you check daily, ideally firstname.lastname@…",
    example: { weak: "xXdesignqueenXx@mail.com", strong: "avery.tan@gmail.com" }
  },
  check: (resume) => {
    const email = resume.basics.email.trim();
    if (EMAIL.test(email)) return { score: 1 };
    return {
      score: 0,
      failures: [{ target: "basics.email", ...(email ? { message: "That email address doesn't look complete." } : {}) }]
    };
  }
};

export const phoneOrLinkedInRule: ResumeRule = {
  id: "resume.basics.phone-or-linkedin",
  category: "completeness",
  weight: 2,
  severity: "improve",
  copy: {
    message: "Add a phone number or LinkedIn profile.",
    suggestion: "Recruiters often call or message on LinkedIn to arrange interviews."
  },
  check: (resume) =>
    resume.basics.phone.trim() || isHttpUrl(resume.basics.linkedinUrl)
      ? { score: 1 }
      : { score: 0, failures: [{ target: "basics.phone" }] }
};

export const portfolioRule: ResumeRule = {
  id: "resume.basics.portfolio",
  category: "completeness",
  weight: 4,
  severity: "improve",
  copy: {
    message: "Add a link to your portfolio or Merit Passport.",
    suggestion: "Put it in the header so reviewers can see your work in one click."
  },
  check: (resume, ctx) => {
    if (isHttpUrl(resume.basics.portfolioUrl)) return { score: 1 };
    const design = isDesignStudent(resume, ctx);
    return {
      score: 0,
      failures: [
        {
          target: "basics.portfolioUrl",
          severity: design ? "critical" : "improve",
          ...(design
            ? { message: "Design employers expect a portfolio link. Without one, most won't read further." }
            : {}),
          autoFix: { type: "use-passport-url" }
        }
      ]
    };
  }
};

export const locationRule: ResumeRule = {
  id: "resume.basics.location",
  category: "completeness",
  weight: 1,
  severity: "polish",
  copy: {
    message: "Say where you are based or can work.",
    suggestion: "One short line is enough, e.g. “Singapore · open to hybrid” or “Relocating to London by June 2027”."
  },
  check: (resume) =>
    resume.basics.location.trim() ? { score: 1 } : { score: 0, failures: [{ target: "basics.location" }] }
};

export const educationPresentRule: ResumeRule = {
  id: "resume.education.present",
  category: "completeness",
  weight: 5,
  severity: "critical",
  copy: {
    message: "Add your current course and school.",
    suggestion: "Internship reviewers check this first. Include the full course name.",
    example: { weak: "Poly", strong: "Diploma in User Experience Design, Example Polytechnic" }
  },
  check: (resume) => {
    const complete = resume.education.some((entry) => entry.institution.trim() && entry.course.trim());
    if (complete) return { score: 1 };
    const index = resume.education.findIndex((entry) => entry.institution.trim() || entry.course.trim());
    if (index === -1) return { score: 0, failures: [{ target: "education" }] };
    const entry = resume.education[index];
    return {
      score: 0.5,
      failures: [
        {
          target: `education[${index}].${entry.institution.trim() ? "course" : "institution"}`,
          message: entry.institution.trim() ? "Add the name of your course." : "Add the name of your school."
        }
      ]
    };
  }
};

export const graduationRule: ResumeRule = {
  id: "resume.education.graduation",
  category: "completeness",
  weight: 2,
  severity: "improve",
  copy: {
    message: "Add your expected graduation date.",
    suggestion: "Employers use it to check you're available for the internship period.",
    example: { weak: "2026 – now", strong: "Expected May 2028" }
  },
  appliesTo: (resume) => resume.education.some((entry) => entry.institution.trim()),
  check: (resume) => {
    const started = resume.education
      .map((entry, index) => ({ entry, index }))
      .filter(({ entry }) => entry.institution.trim());
    const missing = started.filter(({ entry }) => !isMonthValue(entry.endDate));
    return {
      score: 1 - missing.length / started.length,
      failures: missing.map(({ index }) => ({ target: `education[${index}].endDate` }))
    };
  }
};

export const entriesMinimumRule: ResumeRule = {
  id: "resume.entries.minimum",
  category: "completeness",
  weight: 5,
  severity: "critical",
  copy: {
    message: "Add at least two projects or experiences.",
    suggestion: "Class projects, competitions, freelance work and part-time jobs all count."
  },
  check: (resume) => {
    const count = filledEntries(resume).length;
    if (count >= 2) return { score: 1 };
    return {
      score: count / 2,
      failures: [
        {
          target: "projects",
          message:
            count === 0
              ? "Add at least two projects or experiences."
              : "Add one more project or experience. Internship resumes need at least two."
        }
      ]
    };
  }
};

export const skillsPresentRule: ResumeRule = {
  id: "resume.skills.present",
  category: "completeness",
  weight: 4,
  severity: "critical",
  copy: {
    message: "List at least three skills.",
    suggestion: "Name specific tools and methods, e.g. Figma, Illustrator, user interviews, usability testing."
  },
  check: (resume) => {
    const count = resume.skills.filter((skill) => skill.trim()).length;
    return count >= 3 ? { score: 1 } : { score: count / 3, failures: [{ target: "skills" }] };
  }
};

export const completenessRules: ResumeRule[] = [
  nameRule,
  emailRule,
  phoneOrLinkedInRule,
  portfolioRule,
  locationRule,
  educationPresentRule,
  graduationRule,
  entriesMinimumRule,
  skillsPresentRule
];
