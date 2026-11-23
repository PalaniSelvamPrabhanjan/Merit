/**
 * Word lists used by resume rules. Lower-case. Edit here; no component changes needed.
 */

/** Soft skills belong in bullets as evidence, not in the Skills list. */
export const SOFT_SKILLS: readonly string[] = [
  "communication",
  "communication skills",
  "teamwork",
  "team player",
  "team work",
  "leadership",
  "problem solving",
  "problem-solving",
  "time management",
  "creativity",
  "creative",
  "hardworking",
  "hard-working",
  "hard working",
  "adaptability",
  "adaptable",
  "critical thinking",
  "attention to detail",
  "detail-oriented",
  "detail oriented",
  "interpersonal skills",
  "work ethic",
  "multitasking",
  "multi-tasking",
  "organisation",
  "organization",
  "organised",
  "organized",
  "punctual",
  "punctuality",
  "motivated",
  "self-motivated",
  "passionate",
  "fast learner",
  "quick learner",
  "independent",
  "reliable",
  "responsible",
  "flexible",
  "positive attitude",
  "good attitude"
];

/** Tools a design recruiter expects to see used in bullets, not only listed. */
export const DESIGN_TOOLS: readonly string[] = [
  "figma",
  "figjam",
  "adobe xd",
  "sketch",
  "illustrator",
  "photoshop",
  "indesign",
  "after effects",
  "premiere pro",
  "lightroom",
  "adobe creative cloud",
  "blender",
  "cinema 4d",
  "procreate",
  "canva",
  "framer",
  "protopie",
  "miro",
  "webflow",
  "rhino",
  "autocad",
  "sketchup",
  "revit",
  "keyshot",
  "fusion 360",
  "solidworks"
];

/** Words that signal an outcome even without a number. */
export const OUTCOME_WORDS: readonly string[] = [
  "percent",
  "doubled",
  "tripled",
  "halved",
  "hundreds",
  "thousands",
  "award",
  "awarded",
  "won",
  "winner",
  "finalist",
  "shortlisted",
  "first place",
  "launched",
  "shipped",
  "published",
  "exhibited",
  "featured",
  "selected",
  "adopted",
  "funded",
  "increased",
  "reduced",
  "improved",
  "cut",
  "grew",
  "saved"
];

/** Signals that a student is applying for design roles. */
export const DESIGN_ROLE_PATTERN =
  /\b(design|designer|ux|ui|graphic|visual|illustrat\w*|interior|architect\w*|product design|motion|brand\w*|typograph\w*|animation)\b/i;

export const FIRST_PERSON_PATTERN = /\b(i|me|my|mine|myself)\b/i;
