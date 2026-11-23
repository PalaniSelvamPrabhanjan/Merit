import type { Rule, RuleFailure } from "@/lib/advisor/types";
import { findFillerPhrases, leadingActionVerb, pastFormOf, presentFormOf, verbTense } from "@/lib/advisor/data/language";
import { FIRST_PERSON_PATTERN, OUTCOME_WORDS } from "@/lib/advisor/data/resume-terms";
import { allBullets, hasAnyBullets, truncate, type BulletRef } from "@/lib/advisor/rules/resume/helpers";
import { cleanBullets } from "@/lib/resume/format";
import type { ResumeData } from "@/lib/resume/types";

type ResumeRule = Rule<ResumeData>;

function perBullet(
  resume: ResumeData,
  failing: (bullet: BulletRef) => RuleFailure | null
): { score: number; failures: RuleFailure[] } {
  const bullets = allBullets(resume);
  const failures = bullets.map(failing).filter((failure): failure is RuleFailure => failure !== null);
  return { score: bullets.length ? 1 - failures.length / bullets.length : 1, failures };
}

export const actionVerbRule: ResumeRule = {
  id: "resume.bullets.action-verb",
  category: "bullets",
  weight: 3,
  severity: "improve",
  copy: {
    message: "Start this bullet with an action verb.",
    suggestion: "Lead with what you did: Designed, Tested, Interviewed, Led, Built…",
    example: { weak: "Responsible for the poster series.", strong: "Designed a 6-poster series for the open house." }
  },
  appliesTo: hasAnyBullets,
  check: (resume) =>
    perBullet(resume, (bullet) => {
      if (leadingActionVerb(bullet.text)) return null;
      // Leave these to the rules that explain them better (and offer fixes).
      if (/^\s*i\s/i.test(bullet.text)) return null;
      if (startsWithFiller(bullet.text)) return null;
      return { target: bullet.target, message: `“${truncate(bullet.text, 40)}” doesn't start with an action verb.` };
    })
};

/** True when the bullet opens with a filler phrase such as "Responsible for". */
function startsWithFiller(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return findFillerPhrases(trimmed).some((entry) => trimmed.startsWith(entry.phrase));
}

/** "I designed the logo" -> "Designed the logo". Null when no safe rewrite exists. */
export function withoutLeadingI(text: string): string | null {
  const match = text.match(/^\s*i\s+(.+)$/i);
  if (!match) return null;
  const rest = match[1];
  return rest.charAt(0).toUpperCase() + rest.slice(1);
}

export const pronounRule: ResumeRule = {
  id: "resume.bullets.pronouns",
  category: "bullets",
  weight: 2,
  severity: "improve",
  copy: {
    message: "Remove “I”, “me” and “my” from bullets.",
    suggestion: "Resumes are written without personal pronouns. Start with the verb instead.",
    example: { weak: "I designed my team's logo.", strong: "Designed the team logo used on 3 product launches." }
  },
  appliesTo: hasAnyBullets,
  check: (resume) =>
    perBullet(resume, (bullet) => {
      if (!FIRST_PERSON_PATTERN.test(bullet.text)) return null;
      const rewrite = withoutLeadingI(bullet.text);
      return {
        target: bullet.target,
        message: `“${truncate(bullet.text, 40)}” uses “I”, “me” or “my”.`,
        ...(rewrite && !FIRST_PERSON_PATTERN.test(rewrite)
          ? {
              autoFix: {
                type: "replace-bullet",
                section: bullet.section,
                entryIndex: bullet.entryIndex,
                bulletIndex: bullet.bulletIndex,
                value: rewrite,
                label: "Remove “I”"
              }
            }
          : {})
      };
    })
};

export const BULLET_MIN_CHARS = 30;
export const BULLET_MAX_CHARS = 200;

export const bulletLengthRule: ResumeRule = {
  id: "resume.bullets.length",
  category: "bullets",
  weight: 1,
  severity: "polish",
  copy: {
    message: "Keep each bullet to one or two lines.",
    suggestion: "Aim for 60–180 characters: what you did, how, and what changed."
  },
  appliesTo: hasAnyBullets,
  check: (resume) =>
    perBullet(resume, (bullet) => {
      if (bullet.text.length < BULLET_MIN_CHARS) {
        return {
          target: bullet.target,
          message: `“${truncate(bullet.text, 40)}” is very short.`,
          suggestion: "Add how you did it or what changed as a result."
        };
      }
      if (bullet.text.length > BULLET_MAX_CHARS) {
        return {
          target: bullet.target,
          message: `This bullet is ${bullet.text.length} characters, more than two lines.`,
          suggestion: "Split it into two bullets or cut the least important detail."
        };
      }
      return null;
    })
};

const OUTCOME_PATTERN = new RegExp(`(\\d|%|\\b(${OUTCOME_WORDS.join("|")})\\b)`, "i");

export const quantifiedRule: ResumeRule = {
  id: "resume.bullets.quantified",
  category: "bullets",
  weight: 3,
  severity: "improve",
  copy: {
    message: "Add a number, scale or result to this bullet.",
    suggestion: "How many people, screens, weeks or iterations? What changed because of your work?",
    example: { weak: "Designed signs for the campus.", strong: "Designed 14 signs that cut route-finding time from 9 to 4 minutes." }
  },
  appliesTo: hasAnyBullets,
  check: (resume) =>
    perBullet(resume, (bullet) =>
      OUTCOME_PATTERN.test(bullet.text)
        ? null
        : { target: bullet.target, message: `“${truncate(bullet.text, 40)}” has no number, scale or result.` }
    )
};

export const tenseRule: ResumeRule = {
  id: "resume.bullets.tense",
  category: "bullets",
  weight: 1,
  severity: "polish",
  copy: {
    message: "Match the verb tense to the dates.",
    suggestion: "Past tense for finished work, present tense for something you're doing now."
  },
  appliesTo: hasAnyBullets,
  check: (resume) =>
    perBullet(resume, (bullet) => {
      const verb = leadingActionVerb(bullet.text);
      if (!verb) return null;
      const tense = verbTense(verb);
      if (bullet.current && tense === "past") {
        return {
          target: bullet.target,
          message: `This is a current role, so use the present tense: “${presentFormOf(verb)}”, not “${verb}”.`
        };
      }
      if (!bullet.current && tense === "present") {
        return {
          target: bullet.target,
          message: `This work is finished, so use the past tense: “${pastFormOf(verb)}”, not “${verb}”.`
        };
      }
      return null;
    })
};

export const uniqueVerbsRule: ResumeRule = {
  id: "resume.bullets.unique-verbs",
  category: "bullets",
  weight: 1,
  severity: "polish",
  copy: {
    message: "Vary the opening verbs within an entry.",
    suggestion: "Repeating the same verb makes your work sound narrower than it was."
  },
  appliesTo: hasAnyBullets,
  check: (resume) =>
    perBullet(resume, (bullet) => {
      const verb = leadingActionVerb(bullet.text);
      if (!verb) return null;
      const entry = resume[bullet.section][bullet.entryIndex];
      const earlier = entry.bullets
        .slice(0, bullet.bulletIndex)
        .some((other) => other.trim() && leadingActionVerb(other) === verb);
      return earlier
        ? { target: bullet.target, message: `“${verb.charAt(0).toUpperCase() + verb.slice(1)}” is already used in this entry.` }
        : null;
    })
};

export const bulletCountRule: ResumeRule = {
  id: "resume.entries.bullet-count",
  category: "bullets",
  weight: 1,
  severity: "polish",
  copy: {
    message: "Give each entry 2–4 bullets.",
    suggestion: "One bullet looks thin; more than five buries your best point."
  },
  appliesTo: (resume) =>
    resume.projects.some((entry) => entry.title.trim()) ||
    resume.experience.some((entry) => entry.organisation.trim() || entry.role.trim()),
  check: (resume) => {
    const entries = [
      ...resume.projects.map((entry, index) => ({ target: `projects[${index}]`, name: entry.title, bullets: entry.bullets })),
      ...resume.experience.map((entry, index) => ({
        target: `experience[${index}]`,
        name: entry.organisation || entry.role,
        bullets: entry.bullets
      }))
    ].filter((entry) => entry.name.trim());
    const failures: RuleFailure[] = [];
    for (const entry of entries) {
      const count = cleanBullets(entry.bullets).length;
      if (count === 0) failures.push({ target: entry.target, message: `“${truncate(entry.name, 40)}” has no bullets yet.` });
      else if (count > 5) failures.push({ target: entry.target, message: `“${truncate(entry.name, 40)}” has ${count} bullets. Keep the best 4.` });
    }
    return { score: entries.length ? 1 - failures.length / entries.length : 1, failures };
  }
};

export const bulletRules: ResumeRule[] = [
  actionVerbRule,
  pronounRule,
  bulletLengthRule,
  quantifiedRule,
  tenseRule,
  uniqueVerbsRule,
  bulletCountRule
];
