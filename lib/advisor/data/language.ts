/**
 * Language data for resume and portfolio rules. Edit the lists here; rules read them.
 * Keep entries lower-case. Add a verb as [past tense, present tense].
 */

const VERB_PAIRS: ReadonlyArray<readonly [past: string, present: string]> = [
  // Design and making
  ["designed", "design"],
  ["prototyped", "prototype"],
  ["illustrated", "illustrate"],
  ["sketched", "sketch"],
  ["wireframed", "wireframe"],
  ["animated", "animate"],
  ["modelled", "model"],
  ["modeled", "model"],
  ["rendered", "render"],
  ["photographed", "photograph"],
  ["filmed", "film"],
  ["edited", "edit"],
  ["crafted", "craft"],
  ["branded", "brand"],
  ["visualised", "visualise"],
  ["visualized", "visualize"],
  ["composed", "compose"],
  ["styled", "style"],
  ["mapped", "map"],
  // Research and testing
  ["researched", "research"],
  ["interviewed", "interview"],
  ["surveyed", "survey"],
  ["tested", "test"],
  ["evaluated", "evaluate"],
  ["analysed", "analyse"],
  ["analyzed", "analyze"],
  ["synthesised", "synthesise"],
  ["synthesized", "synthesize"],
  ["identified", "identify"],
  ["validated", "validate"],
  ["audited", "audit"],
  // Building and improving
  ["built", "build"],
  ["created", "create"],
  ["developed", "develop"],
  ["launched", "launch"],
  ["shipped", "ship"],
  ["implemented", "implement"],
  ["iterated", "iterate"],
  ["redesigned", "redesign"],
  ["improved", "improve"],
  ["increased", "increase"],
  ["reduced", "reduce"],
  ["simplified", "simplify"],
  ["streamlined", "streamline"],
  ["automated", "automate"],
  ["optimised", "optimise"],
  ["optimized", "optimize"],
  ["delivered", "deliver"],
  ["produced", "produce"],
  ["published", "publish"],
  ["wrote", "write"],
  ["coded", "code"],
  ["engineered", "engineer"],
  ["documented", "document"],
  // Leading and working with others
  ["led", "lead"],
  ["managed", "manage"],
  ["coordinated", "coordinate"],
  ["organised", "organise"],
  ["organized", "organize"],
  ["facilitated", "facilitate"],
  ["presented", "present"],
  ["pitched", "pitch"],
  ["mentored", "mentor"],
  ["taught", "teach"],
  ["collaborated", "collaborate"],
  ["partnered", "partner"],
  ["negotiated", "negotiate"],
  ["planned", "plan"],
  ["initiated", "initiate"],
  ["founded", "found"],
  ["won", "win"],
  ["achieved", "achieve"],
  ["grew", "grow"],
  ["secured", "secure"],
  // Everyday doing verbs students use
  ["ran", "run"],
  ["prepared", "prepare"],
  ["conducted", "conduct"],
  ["curated", "curate"],
  ["drafted", "draft"],
  ["refined", "refine"],
  ["assembled", "assemble"],
  ["sourced", "source"],
  ["generated", "generate"],
  ["hosted", "host"],
  ["revamped", "revamp"],
  ["restructured", "restructure"],
  ["translated", "translate"],
  ["captured", "capture"],
  ["fixed", "fix"],
  ["resolved", "resolve"],
  ["trained", "train"],
  ["tutored", "tutor"],
  ["advised", "advise"],
  ["handled", "handle"],
  ["served", "serve"],
  ["installed", "install"],
  ["configured", "configure"],
  ["measured", "measure"],
  ["calculated", "calculate"],
  ["recorded", "record"],
  ["printed", "print"],
  ["exhibited", "exhibit"],
  ["recruited", "recruit"],
  ["onboarded", "onboard"],
  ["scheduled", "schedule"],
  ["promoted", "promote"],
  ["marketed", "market"],
  ["sold", "sell"]
];

/** Strong action verbs, past tense (for finished roles and projects). */
export const ACTION_VERBS: readonly string[] = Array.from(new Set(VERB_PAIRS.map(([past]) => past)));

/** Present-tense forms (for current roles). */
export const ACTION_VERBS_PRESENT: readonly string[] = Array.from(new Set(VERB_PAIRS.map(([, present]) => present)));

const ALL_VERB_FORMS = new Set<string>([...ACTION_VERBS, ...ACTION_VERBS_PRESENT]);

export interface FillerPhrase {
  phrase: string;
  /** Why it weakens the line. */
  reason: string;
  /** What to write instead. */
  instead: string;
}

export const FILLER_PHRASES: readonly FillerPhrase[] = [
  { phrase: "responsible for", reason: "Describes a duty, not what you did.", instead: "Start with what you did: “Designed…”, “Ran…”." },
  { phrase: "duties included", reason: "Reads like a job description.", instead: "List what you achieved, one action per bullet." },
  { phrase: "tasked with", reason: "Says what you were asked, not what you did.", instead: "Lead with the action and the result." },
  { phrase: "helped with", reason: "Hides your contribution.", instead: "Name your part: “Created the icon set for…”." },
  { phrase: "assisted with", reason: "Hides your contribution.", instead: "Name your part and the outcome." },
  { phrase: "worked on", reason: "Vague about what you did.", instead: "Use a specific verb: designed, tested, built." },
  { phrase: "involved in", reason: "Vague about your role.", instead: "Say what you owned or delivered." },
  { phrase: "hard-working", reason: "A claim anyone can make.", instead: "Show it with a result or a deadline you met." },
  { phrase: "hardworking", reason: "A claim anyone can make.", instead: "Show it with a result or a deadline you met." },
  { phrase: "team player", reason: "A claim, not evidence.", instead: "Describe a team project and your part in it." },
  { phrase: "detail-oriented", reason: "A claim, not evidence.", instead: "Show precision, e.g. “Built a 40-component design system”." },
  { phrase: "detail oriented", reason: "A claim, not evidence.", instead: "Show precision with a concrete example." },
  { phrase: "self-motivated", reason: "A claim, not evidence.", instead: "Mention a self-started project instead." },
  { phrase: "go-getter", reason: "Cliché.", instead: "Describe something you started and finished." },
  { phrase: "fast learner", reason: "A claim, not evidence.", instead: "Name a tool you learned and what you made with it." },
  { phrase: "passionate about", reason: "Overused; says little.", instead: "Show the interest through a project." },
  { phrase: "think outside the box", reason: "Cliché.", instead: "Describe an unexpected solution you designed." },
  { phrase: "results-driven", reason: "A claim, not evidence.", instead: "State an actual result with a number." },
  { phrase: "excellent communication skills", reason: "A claim, not evidence.", instead: "Mention a presentation, workshop or interview you ran." },
  { phrase: "various", reason: "Vague.", instead: "Name them, or give a number." },
  { phrase: "etc", reason: "Trails off; looks unfinished.", instead: "List the important items and stop." }
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const FILLER_MATCHERS = FILLER_PHRASES.map((entry) => ({
  entry,
  pattern: new RegExp(`(?<![a-z])${escapeRegExp(entry.phrase)}(?![a-z])`, "i")
}));

/** Filler phrases found in the text, in the order they appear in the text. */
export function findFillerPhrases(text: string): FillerPhrase[] {
  return FILLER_MATCHERS.map(({ entry, pattern }) => ({ entry, index: text.search(pattern) }))
    .filter(({ index }) => index >= 0)
    .sort((a, b) => a.index - b.index)
    .map(({ entry }) => entry);
}

/**
 * The action verb a bullet starts with (ignoring bullet characters), lower-cased,
 * or null if it does not start with a known action verb.
 */
export function leadingActionVerb(bullet: string): string | null {
  const firstWord = bullet
    .trim()
    .replace(/^[•\-–—*·>\s]+/, "")
    .split(/\s+/)[0]
    ?.toLowerCase()
    .replace(/[^a-z]/g, "");
  return firstWord && ALL_VERB_FORMS.has(firstWord) ? firstWord : null;
}

const PAST_FORMS = new Set<string>(ACTION_VERBS);
const PRESENT_FORMS = new Set<string>(ACTION_VERBS_PRESENT);

/** "past", "present" or null for a known action verb (as returned by leadingActionVerb). */
export function verbTense(verb: string): "past" | "present" | null {
  const normalized = verb.toLowerCase();
  if (PAST_FORMS.has(normalized) && !PRESENT_FORMS.has(normalized)) {
    return "past";
  }
  if (PRESENT_FORMS.has(normalized) && !PAST_FORMS.has(normalized)) {
    return "present";
  }
  return null;
}

/** Present-tense form of a known past-tense verb ("designed" -> "design"), or null. */
export function presentFormOf(pastVerb: string): string | null {
  const pair = VERB_PAIRS.find(([past]) => past === pastVerb.toLowerCase());
  return pair ? pair[1] : null;
}

/** Past-tense form of a known present-tense verb ("design" -> "designed"), or null. */
export function pastFormOf(presentVerb: string): string | null {
  const pair = VERB_PAIRS.find(([, present]) => present === presentVerb.toLowerCase());
  return pair ? pair[0] : null;
}
