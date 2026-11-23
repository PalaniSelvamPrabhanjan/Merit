import type { Rule, RuleFailure } from "@/lib/advisor/types";
import { findFillerPhrases } from "@/lib/advisor/data/language";
import { DESIGN_TOOLS, SOFT_SKILLS } from "@/lib/advisor/data/resume-terms";
import { allBullets, hasAnyBullets, isDesignStudent, isHttpUrl } from "@/lib/advisor/rules/resume/helpers";
import { estimateResumeLines, LINES_PER_PAGE } from "@/lib/resume/length";
import type { ResumeData } from "@/lib/resume/types";

type ResumeRule = Rule<ResumeData>;

export const onePageRule: ResumeRule = {
  id: "resume.layout.one-page",
  category: "layout",
  weight: 4,
  severity: "critical",
  copy: {
    message: "Your resume is longer than one page.",
    suggestion: "Students should fit on one page. Cut the weakest entry or trim bullets to your best 2–3."
  },
  check: (resume) => {
    const lines = estimateResumeLines(resume);
    if (lines <= LINES_PER_PAGE) return { score: 1 };
    const over = lines - LINES_PER_PAGE;
    return {
      score: Math.max(0, 1 - over / LINES_PER_PAGE),
      failures: [{ target: "layout", message: `Your resume runs about ${over} line${over === 1 ? "" : "s"} past one page.` }]
    };
  }
};

export const fillerRule: ResumeRule = {
  id: "resume.content.filler",
  category: "content",
  weight: 2,
  severity: "improve",
  copy: {
    message: "Replace filler phrases with evidence.",
    suggestion: "Show the quality with something you did instead of claiming it."
  },
  appliesTo: (resume) => hasAnyBullets(resume) || Boolean(resume.basics.headline.trim()),
  check: (resume) => {
    const texts = [
      ...(resume.basics.headline.trim() ? [{ target: "basics.headline", text: resume.basics.headline }] : []),
      ...allBullets(resume).map((bullet) => ({ target: bullet.target, text: bullet.text }))
    ];
    const failures: RuleFailure[] = [];
    for (const { target, text } of texts) {
      const [first] = findFillerPhrases(text);
      if (first) {
        failures.push({ target, message: `“${first.phrase}”: ${first.reason}`, suggestion: first.instead });
      }
    }
    return { score: texts.length ? 1 - failures.length / texts.length : 1, failures };
  }
};

const SOFT_SKILL_SET = new Set(SOFT_SKILLS);

export const softSkillsRule: ResumeRule = {
  id: "resume.content.soft-skills",
  category: "content",
  weight: 2,
  severity: "improve",
  copy: {
    message: "Keep the Skills list to tools and methods.",
    suggestion: "Soft skills read as claims here. Show them in a bullet instead, e.g. “Led a team of 4…”.",
    example: { weak: "Teamwork, Creativity, Figma", strong: "Figma, Illustrator, user interviews, usability testing" }
  },
  appliesTo: (resume) => resume.skills.some((skill) => skill.trim()),
  check: (resume) => {
    const skills = resume.skills.map((skill) => skill.trim()).filter(Boolean);
    const soft = skills.filter((skill) => SOFT_SKILL_SET.has(skill.toLowerCase()));
    if (!soft.length) return { score: 1 };
    return {
      score: 1 - soft.length / skills.length,
      failures: [
        {
          target: "skills",
          message: `Move ${soft.map((skill) => `“${skill}”`).join(", ")} out of Skills.`,
          autoFix: { type: "remove-skills", skills: soft }
        }
      ]
    };
  }
};

export const projectEvidenceRule: ResumeRule = {
  id: "resume.content.project-evidence",
  category: "content",
  weight: 1,
  severity: "polish",
  copy: {
    message: "Link this project to evidence.",
    suggestion: "Add the Merit project page, a live site or a case study so reviewers can see the work."
  },
  appliesTo: (resume) => resume.projects.some((entry) => entry.title.trim()),
  check: (resume) => {
    const projects = resume.projects.map((entry, index) => ({ entry, index })).filter(({ entry }) => entry.title.trim());
    const missing = projects.filter(({ entry }) => !isHttpUrl(entry.link));
    return {
      score: 1 - missing.length / projects.length,
      failures: missing.map(({ index }) => ({ target: `projects[${index}].link` }))
    };
  }
};

function designToolsIn(text: string): string[] {
  const lower = text.toLowerCase();
  return DESIGN_TOOLS.filter((tool) => new RegExp(`(?<![a-z])${tool.replace(/\s+/g, "\\s+")}(?![a-z])`).test(lower));
}

export const toolsInBulletsRule: ResumeRule = {
  id: "resume.design.tools-in-bullets",
  category: "design",
  weight: 2,
  severity: "improve",
  copy: {
    message: "Show your design tools in action, not only in Skills.",
    suggestion: "Mention the tool inside a bullet so reviewers see what you made with it.",
    example: { weak: "Skills: Figma", strong: "Prototyped a 12-screen booking flow in Figma and tested it with 6 students." }
  },
  appliesTo: (resume, ctx) => isDesignStudent(resume, ctx) && designToolsIn(resume.skills.join(", ")).length > 0,
  check: (resume) => {
    const listed = designToolsIn(resume.skills.join(", "));
    const used = new Set(allBullets(resume).flatMap((bullet) => designToolsIn(bullet.text)));
    if (listed.some((tool) => used.has(tool))) return { score: 1 };
    return {
      score: 0,
      failures: [{ target: "skills", message: `None of your design tools (${listed.join(", ")}) appear in a bullet.` }]
    };
  }
};

export const contentRules: ResumeRule[] = [onePageRule, fillerRule, softSkillsRule, projectEvidenceRule, toolsInBulletsRule];
