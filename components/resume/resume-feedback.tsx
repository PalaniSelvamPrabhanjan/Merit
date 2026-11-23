"use client";

import type { Finding, Review, Severity } from "@/lib/advisor/types";
import { RESUME_CATEGORY_LABELS } from "@/lib/advisor/rules/resume";
import { autoFixLabel, isResumeAutoFix, type ResumeAutoFix } from "@/lib/resume/autofix";
import { RESUME_STEPS, stepForTarget } from "@/lib/resume/targets";
import { cn } from "@/lib/utils";
import { ExampleBox, SEVERITY_STYLES } from "@/components/resume/resume-fields";

const GROUPS: ReadonlyArray<{ severity: Severity; title: string }> = [
  { severity: "critical", title: "Must fix" },
  { severity: "improve", title: "Improve" },
  { severity: "polish", title: "Polish" }
];

const LABEL_NOTES: Record<Review["label"], string> = {
  "Getting started": "Everyone starts here. Fix the items under Must fix first.",
  Solid: "The essentials are in place. Sharpen your bullets next.",
  Strong: "A good resume. A few changes will make it stand out.",
  "Interview-ready": "Ready to send. Download it and tailor it for each role."
};

function stepLabel(target: string) {
  return RESUME_STEPS.find((step) => step.id === stepForTarget(target))?.label ?? "";
}

function FindingItem({
  finding,
  onShow,
  onFix
}: {
  finding: Finding;
  onShow: (finding: Finding) => void;
  onFix: (fix: ResumeAutoFix) => void;
}) {
  const fix = isResumeAutoFix(finding.autoFix) ? finding.autoFix : null;
  return (
    <li className="space-y-1.5 border-t border-[#d7cebd] py-3 first:border-t-0">
      <p className="text-sm leading-5 text-[#16130f]">{finding.message}</p>
      <p className="text-xs leading-5 text-[#4d4437]">{finding.suggestion}</p>
      <div className="flex flex-wrap gap-2 pt-0.5">
        <button
          className="border border-[#16130f] bg-white px-2.5 py-1 text-xs font-medium text-[#16130f] hover:bg-[#ebe3d6]"
          onClick={() => onShow(finding)}
          type="button"
        >
          Show me where<span className="sr-only"> ({stepLabel(finding.target)})</span>
        </button>
        {fix ? (
          <button
            className="border border-[#d9ae19] bg-[#f3c945] px-2.5 py-1 text-xs font-medium text-[#11100e] hover:bg-[#f6d45d]"
            onClick={() => onFix(fix)}
            type="button"
          >
            {autoFixLabel(fix)}
          </button>
        ) : null}
      </div>
    </li>
  );
}

export function ResumeFeedback({
  review,
  onShow,
  onFix
}: {
  review: Review;
  onShow: (finding: Finding) => void;
  onFix: (fix: ResumeAutoFix) => void;
}) {
  const next = review.nextBestAction;
  const nextFix = next && isResumeAutoFix(next.autoFix) ? next.autoFix : null;

  return (
    <aside aria-labelledby="resume-strength-heading" className="space-y-5 border border-[#d7cebd] bg-[#eee8dd] p-4">
      <div className="space-y-1" aria-live="polite">
        <h2 className="font-serif text-2xl text-[#16130f]" id="resume-strength-heading">
          Resume strength
        </h2>
        <p className="flex items-baseline gap-2">
          <span className="font-serif text-5xl leading-none tabular-nums text-[#16130f]">{review.score}</span>
          <span className="text-sm text-[#4d4437]">/ 100</span>
          <span className="ml-1 border border-[#16130f] px-2 py-0.5 text-xs font-semibold text-[#16130f]">{review.label}</span>
        </p>
        <p className="text-xs leading-5 text-[#4d4437]">{LABEL_NOTES[review.label]}</p>
      </div>

      {next ? (
        <div className="space-y-2 border-l-4 border-[#f3c945] bg-[#fffaf0] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4d4437]">Next best step</p>
          <p className="text-sm font-medium leading-5 text-[#16130f]">{next.message}</p>
          <p className="text-xs leading-5 text-[#4d4437]">{next.suggestion}</p>
          {next.example ? <ExampleBox example={next.example} /> : null}
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              className="border border-[#16130f] bg-[#16130f] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#2d2923]"
              onClick={() => onShow(next)}
              type="button"
            >
              Fix this now
            </button>
            {nextFix ? (
              <button
                className="border border-[#d9ae19] bg-[#f3c945] px-3 py-1.5 text-xs font-medium text-[#11100e] hover:bg-[#f6d45d]"
                onClick={() => onFix(nextFix)}
                type="button"
              >
                {autoFixLabel(nextFix)}
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="border-l-4 border-[#2f6b3a] bg-[#eaf3ea] p-3 text-sm text-[#1f3a24]">
          No issues found. Download your PDF and tailor it to each role you apply for.
        </p>
      )}

      <ul aria-label="Scores by category" className="space-y-2">
        {Object.entries(review.categories).map(([category, score]) => (
          <li className="grid grid-cols-[84px_1fr_32px] items-center gap-2 text-xs" key={category}>
            <span className="text-[#16130f]">{RESUME_CATEGORY_LABELS[category] ?? category}</span>
            <span aria-hidden="true" className="h-2 bg-[#d7cebd]">
              <span className="block h-full bg-[#16130f]" style={{ width: `${score}%` }} />
            </span>
            <span className="text-right tabular-nums text-[#16130f]">
              {score}
              <span className="sr-only"> out of 100</span>
            </span>
          </li>
        ))}
      </ul>

      {GROUPS.map(({ severity, title }) => {
        const items = review.findings.filter((finding) => finding.severity === severity);
        if (!items.length) return null;
        const style = SEVERITY_STYLES[severity];
        return (
          <details className="group" key={severity} open={severity !== "polish"}>
            <summary className={cn("cursor-pointer list-none text-sm font-semibold", style.text)}>
              <span aria-hidden="true" className="mr-1 inline-block transition-transform group-open:rotate-90">
                ›
              </span>
              {title} ({items.length})
            </summary>
            <ul className="mt-1">
              {items.map((finding, index) => (
                <FindingItem finding={finding} key={`${finding.ruleId}-${finding.target}-${index}`} onFix={onFix} onShow={onShow} />
              ))}
            </ul>
          </details>
        );
      })}
    </aside>
  );
}
