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

export function labelForScore(score: number): ScoreLabel {
  const band = SCORE_LABEL_THRESHOLDS.find((threshold) => score >= threshold.min);
  return band ? band.label : "Getting started";
}
