import type { ScoreLabel, Severity } from "@/lib/advisor/types";

/**
 * Score bands, checked from the top. A score at or above `min` gets that label.
 * Labels are deliberately encouraging so a low score does not feel like failure.
 */
export const SCORE_LABEL_THRESHOLDS: ReadonlyArray<{ min: number; label: ScoreLabel }> = [
  { min: 85, label: "Interview-ready" },
  { min: 65, label: "Strong" },
  { min: 40, label: "Solid" },
  { min: 0, label: "Getting started" }
];

/** Lower number = shown first. */
export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 0,
  improve: 1,
  polish: 2
};

/**
 * While any critical finding is open, the label can't go above this, whatever the
 * score: "Strong" with a missing essential would mislead the student.
 */
export const LABEL_CAP_WITH_CRITICAL: ScoreLabel = "Solid";

const LABEL_RANK: Record<ScoreLabel, number> = { "Getting started": 0, Solid: 1, Strong: 2, "Interview-ready": 3 };

export function labelForReview(score: number, hasCritical: boolean): ScoreLabel {
  const label = labelForScore(score);
  return hasCritical && LABEL_RANK[label] > LABEL_RANK[LABEL_CAP_WITH_CRITICAL] ? LABEL_CAP_WITH_CRITICAL : label;
}

export function labelForScore(score: number): ScoreLabel {
  const band = SCORE_LABEL_THRESHOLDS.find((threshold) => score >= threshold.min);
  return band ? band.label : "Getting started";
}
