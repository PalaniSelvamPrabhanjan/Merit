"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { runRules } from "@/lib/advisor/runner";
import { resumeRules } from "@/lib/advisor/rules/resume";
import type { Finding, StudentContext } from "@/lib/advisor/types";
import { applyAutoFix, type ResumeAutoFix } from "@/lib/resume/autofix";
import { resumeFileName } from "@/lib/resume/format";
import { addMissingPassportProjects, prefillResume } from "@/lib/resume/model";
import { downloadBlob, renderResumePdfBlob } from "@/lib/resume/pdf";
import { readLocalDraft, saveResume, snapshotResume } from "@/lib/resume/storage";
import {
  fieldIdForTarget,
  firstStepNeedingWork,
  openIssuesByStep,
  RESUME_STEPS,
  stepForTarget,
  type ResumeStepId
} from "@/lib/resume/targets";
import type { ResumeData } from "@/lib/resume/types";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { ResumeFeedback } from "@/components/resume/resume-feedback";
import { ResumePreview } from "@/components/resume/resume-preview";
import {
  BasicsStep,
  EducationStep,
  ExperienceStep,
  ExtrasStep,
  ProjectsStep,
  SkillsStep,
  type StepProps
} from "@/components/resume/resume-steps";

export type ResumePersistence = "account" | "device" | "demo";

type SaveState = "idle" | "saving" | "saved-account" | "saved-device" | "error" | "demo";

type MobileTab = "edit" | "preview" | "feedback";

const SAVE_LABELS: Record<SaveState, string> = {
  idle: "",
  saving: "Saving…",
  "saved-account": "All changes saved",
  "saved-device": "Saved on this device only",
  error: "Couldn't save. Your changes are kept on this page; we'll retry.",
  demo: "Demo: changes aren't saved"
};

const STEP_COMPONENTS: Record<Exclude<ResumeStepId, "review">, (props: StepProps) => React.ReactNode> = {
  basics: BasicsStep,
  education: EducationStep,
  projects: ProjectsStep,
  experience: ExperienceStep,
  skills: SkillsStep,
  extras: ExtrasStep
};

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function ResumeBuilder({
  userId,
  initialResume,
  context,
  appUrl,
  persistence
}: {
  userId: string;
  initialResume: ResumeData;
  context: StudentContext;
  appUrl: string;
  persistence: ResumePersistence;
}) {
  const [resume, setResume] = useState(initialResume);
  const reviewed = useDebounced(resume, 250);
  const review = useMemo(() => runRules(resumeRules, reviewed, context), [reviewed, context]);
  const [step, setStep] = useState<ResumeStepId>(() => firstStepNeedingWork(runRules(resumeRules, initialResume, context).findings));
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>("edit");
  const [saveState, setSaveState] = useState<SaveState>(persistence === "demo" ? "demo" : "idle");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const firstSave = useRef(true);

  const passportUrl = useMemo(() => prefillResume(context, { appUrl }).basics.portfolioUrl, [context, appUrl]);
  const prefilledBasics = useMemo(() => {
    const prefill = prefillResume(context, { appUrl }).basics;
    const keys = Object.keys(prefill) as Array<keyof typeof prefill>;
    return new Set<string>(keys.filter((key) => prefill[key] && prefill[key] === resume.basics[key]));
  }, [context, appUrl, resume.basics]);
  const newPassportProjects = useMemo(
    () => addMissingPassportProjects(resume, context, { appUrl }).added,
    [resume, context, appUrl]
  );

  // Device-only mode: pick up a draft saved earlier in this browser.
  useEffect(() => {
    if (persistence !== "device") return;
    const draft = readLocalDraft(userId);
    if (draft) {
      firstSave.current = true;
      setResume(draft);
    }
  }, [persistence, userId]);

  // Autosave, debounced.
  useEffect(() => {
    if (persistence === "demo") return;
    if (firstSave.current) {
      firstSave.current = false;
      return;
    }
    setSaveState("saving");
    const timer = window.setTimeout(async () => {
      const client = persistence === "account" ? createBrowserSupabaseClient() : null;
      const result = await saveResume(client, userId, resume, review.score);
      setSaveState(result.ok ? (result.where === "account" ? "saved-account" : "saved-device") : "error");
    }, 1000);
    return () => window.clearTimeout(timer);
    // review.score is read at save time; saving on score changes alone is unnecessary.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resume, persistence, userId]);

  const update = useCallback((updater: (current: ResumeData) => ResumeData) => setResume(updater), []);

  const goTo = useCallback((target: string) => {
    const nextStep = stepForTarget(target);
    setStep(nextStep);
    setMobileTab("edit");
    setHighlighted(target);
    window.setTimeout(() => {
      const candidates = [fieldIdForTarget(target), `${fieldIdForTarget(target)}-findings`, `rf-${nextStep}-findings`, "resume-step-heading"];
      const element = candidates.map((id) => document.getElementById(id)).find(Boolean);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (element instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(element.tagName)) {
        element.focus({ preventScroll: true });
      } else {
        document.getElementById("resume-step-heading")?.focus({ preventScroll: true });
      }
    }, 60);
  }, []);

  const showFinding = useCallback((finding: Finding) => goTo(finding.target), [goTo]);

  const fix = useCallback(
    (autoFix: ResumeAutoFix) => {
      setResume((current) => applyAutoFix(current, autoFix, { passportUrl }));
      setNotice("Fixed. Your score will update in a moment.");
      window.setTimeout(() => setNotice(null), 3000);
    },
    [passportUrl]
  );

  const importProjects = () => {
    setResume((current) => addMissingPassportProjects(current, context, { appUrl }).resume);
    setStep("projects");
  };

  const download = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const blob = await renderResumePdfBlob(resume);
      downloadBlob(blob, resumeFileName(resume));
      if (persistence === "account") {
        void snapshotResume(createBrowserSupabaseClient(), userId, resume, review.score);
      }
    } catch (error) {
      setDownloadError(error instanceof Error ? `Couldn't create the PDF: ${error.message}` : "Couldn't create the PDF. Try again.");
    } finally {
      setDownloading(false);
    }
  };

  const counts = openIssuesByStep(review.findings);
  const stepIndex = RESUME_STEPS.findIndex((item) => item.id === step);
  const StepComponent = step === "review" ? null : STEP_COMPONENTS[step];
  const stepProps: StepProps = { resume, update, findings: review.findings, highlightedTarget: highlighted, prefilledBasics };

  const downloadButton = (
    <button
      className="inline-flex min-h-10 items-center justify-center border border-[#d9ae19] bg-[#f3c945] px-4 py-2 text-sm font-semibold text-[#11100e] hover:bg-[#f6d45d] disabled:opacity-60"
      disabled={downloading}
      onClick={download}
      type="button"
    >
      {downloading ? "Preparing PDF…" : "Download PDF"}
    </button>
  );

  return (
    <div className="editorial-wide space-y-5 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#d7cebd] pb-5">
        <div className="space-y-1.5">
          <p className="label-caps">Resume</p>
          <h1 className="font-serif text-3xl leading-none text-[#16130f]">Resume builder</h1>
          <p className="max-w-2xl text-sm leading-6 text-[#4d4437]">
            We filled in what Merit already knows from your Passport. Work through the steps; feedback updates as you type.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p aria-live="polite" className={cn("text-xs", saveState === "error" ? "text-[#a3261b]" : "text-[#4d4437]")}>
            {SAVE_LABELS[saveState]}
          </p>
          {downloadButton}
        </div>
      </header>

      {downloadError ? (
        <p className="border border-[#a3261b] bg-[#fbecea] p-3 text-sm text-[#a3261b]" role="alert">
          {downloadError}
        </p>
      ) : null}
      {notice ? (
        <p className="text-sm text-[#2f6b3a]" role="status">
          {notice}
        </p>
      ) : null}
      {newPassportProjects > 0 && persistence !== "demo" ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-[#d7cebd] bg-[#fbf8f0] p-3 text-sm text-[#16130f]">
          <span>
            You have {newPassportProjects} Passport project{newPassportProjects === 1 ? "" : "s"} not on this resume yet.
          </span>
          <button className="border border-[#16130f] px-3 py-1.5 text-sm font-medium hover:bg-[#ebe3d6]" onClick={importProjects} type="button">
            Add {newPassportProjects === 1 ? "it" : "them"} as drafts
          </button>
        </div>
      ) : null}

      <nav aria-label="Resume steps" className="relative overflow-x-auto pb-1">
        <ol className="flex min-w-max gap-1.5">
          {RESUME_STEPS.map((item, index) => {
            const open = counts[item.id];
            const active = item.id === step;
            return (
              <li key={item.id}>
                <button
                  aria-current={active ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 border px-3 py-2 text-sm",
                    active ? "border-[#16130f] bg-[#16130f] text-white" : "border-[#d7cebd] bg-[#fbf8f0] text-[#16130f] hover:border-[#16130f]"
                  )}
                  onClick={() => {
                    setStep(item.id);
                    setHighlighted(null);
                  }}
                  type="button"
                >
                  <span aria-hidden="true" className="tabular-nums opacity-70">
                    {index + 1}.
                  </span>
                  {item.label}
                  {item.id !== "review" ? (
                    open > 0 ? (
                      <span className={cn("ml-0.5 px-1.5 text-xs font-semibold", active ? "bg-white text-[#16130f]" : "bg-[#fdf1e2] text-[#8a4600]")}>
                        {open}
                        <span className="sr-only"> to fix</span>
                      </span>
                    ) : (
                      <span aria-label="done" className={active ? "text-white" : "text-[#2f6b3a]"}>
                        ✓
                      </span>
                    )
                  ) : null}
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div aria-label="Builder view" className="flex xl:hidden" role="tablist">
        {(
          [
            ["edit", "Edit"],
            ["preview", "Preview"],
            ["feedback", `Feedback (${review.findings.length})`]
          ] as const
        ).map(([id, label]) => (
          <button
            aria-controls={`resume-panel-${id}`}
            aria-selected={mobileTab === id}
            className={cn(
              "flex-1 border border-[#16130f] px-3 py-2 text-sm font-medium [&+&]:border-l-0",
              mobileTab === id ? "bg-[#16130f] text-white" : "bg-transparent text-[#16130f]"
            )}
            id={`resume-tab-${id}`}
            key={id}
            onClick={() => setMobileTab(id)}
            role="tab"
            type="button"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)_340px]">
        <section
          aria-labelledby="resume-tab-edit"
          className={cn("min-w-0 space-y-6", mobileTab !== "edit" && "hidden xl:block")}
          id="resume-panel-edit"
          role="tabpanel"
        >
          <p className="sr-only" id="resume-step-heading" tabIndex={-1}>
            Step {stepIndex + 1} of {RESUME_STEPS.length}: {RESUME_STEPS[stepIndex].label}
          </p>
          <div className="border border-[#d7cebd] bg-[#eee8dd] p-4 sm:p-5">
            {StepComponent ? (
              <StepComponent {...stepProps} />
            ) : (
              <ReviewStep downloadButton={downloadButton} findingsCount={review.findings.length} onShowFirst={() => review.nextBestAction && showFinding(review.nextBestAction)} resume={resume} score={review.score} />
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              className="border border-[#16130f] px-4 py-2 text-sm font-medium text-[#16130f] hover:bg-[#ebe3d6] disabled:opacity-40"
              disabled={stepIndex === 0}
              onClick={() => setStep(RESUME_STEPS[Math.max(0, stepIndex - 1)].id)}
              type="button"
            >
              Back
            </button>
            {stepIndex < RESUME_STEPS.length - 1 ? (
              <button
                className="border border-[#d9ae19] bg-[#f3c945] px-4 py-2 text-sm font-semibold text-[#11100e] hover:bg-[#f6d45d]"
                onClick={() => {
                  setStep(RESUME_STEPS[stepIndex + 1].id);
                  setHighlighted(null);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                type="button"
              >
                Next: {RESUME_STEPS[stepIndex + 1].label}
              </button>
            ) : null}
          </div>
        </section>

        <section
          aria-labelledby="resume-tab-preview"
          className={cn("min-w-0", mobileTab !== "preview" && "hidden xl:block")}
          id="resume-panel-preview"
          role="tabpanel"
        >
          <div className="xl:sticky xl:top-24">
            <ResumePreview findings={review.findings} highlightedTarget={highlighted} onSelectTarget={goTo} resume={resume} />
          </div>
        </section>

        <section
          aria-labelledby="resume-tab-feedback"
          className={cn("min-w-0", mobileTab !== "feedback" && "hidden xl:block")}
          id="resume-panel-feedback"
          role="tabpanel"
        >
          <div className="xl:sticky xl:top-24 xl:max-h-[calc(100vh-7rem)] xl:overflow-y-auto">
            <ResumeFeedback onFix={fix} onShow={showFinding} review={review} />
          </div>
        </section>
      </div>
    </div>
  );
}

function ReviewStep({
  resume,
  score,
  findingsCount,
  onShowFirst,
  downloadButton
}: {
  resume: ResumeData;
  score: number;
  findingsCount: number;
  onShowFirst: () => void;
  downloadButton: React.ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h2 className="font-serif text-2xl text-[#16130f]">Review and download</h2>
        <p className="max-w-prose text-sm leading-6 text-[#4d4437]">
          Your resume scores {score} out of 100
          {findingsCount ? ` with ${findingsCount} suggestion${findingsCount === 1 ? "" : "s"} left.` : " with nothing left to fix."}
        </p>
      </div>
      <ul className="list-disc space-y-1.5 pl-5 text-sm leading-6 text-[#16130f]">
        <li>The PDF uses one column, standard headings and real text, so applicant tracking systems can read it.</li>
        <li>
          It saves as <span className="font-semibold">{resumeFileName(resume)}</span>, so recruiters can find it.
        </li>
        <li>Tailor it for each role: move the most relevant project first and reuse words from the job post.</li>
      </ul>
      <div className="flex flex-wrap gap-3">
        {downloadButton}
        {findingsCount ? (
          <button
            className="border border-[#16130f] px-4 py-2 text-sm font-medium text-[#16130f] hover:bg-[#ebe3d6]"
            onClick={onShowFirst}
            type="button"
          >
            Fix the next suggestion first
          </button>
        ) : null}
      </div>
    </div>
  );
}
