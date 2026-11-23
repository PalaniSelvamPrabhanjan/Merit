"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Finding, Review, StudentContext } from "@/lib/advisor/types";
import { runRules } from "@/lib/advisor/runner";
import { PASSPORT_CATEGORY_LABELS, passportRules, projectChecklist } from "@/lib/advisor/rules/portfolio";
import { gettingStartedItems, type ChecklistAction } from "@/lib/onboarding/checklist";
import { TIP_IDS } from "@/lib/onboarding/state";
import { destinationForTarget } from "@/lib/portfolio/targets";
import { cn } from "@/lib/utils";
import { ExampleBox, SEVERITY_STYLES } from "@/components/resume/resume-fields";
import { CoachTip } from "@/components/passport/coach-tip";
import { useOnboarding } from "@/components/passport/onboarding-provider";

const LABEL_NOTES: Record<Review["label"], string> = {
  "Getting started": "Everyone starts here. Most students reach Solid after their first two projects.",
  Solid: "The basics are in place. Strengthen your case studies next.",
  Strong: "A Passport employers will enjoy reading. A few details left.",
  "Interview-ready": "Ready to share. Send your Passport link with every application."
};

export function scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
  const focusable = element.querySelector<HTMLElement>("h2, h3, button, a, input, textarea");
  window.setTimeout(() => focusable?.focus({ preventScroll: true }), 300);
}

function ActionButton({ action, primary = false }: { action: ChecklistAction | { kind: "link"; href: string; label: string }; primary?: boolean }) {
  const className = cn(
    "inline-flex items-center border px-3 py-1.5 text-sm font-medium",
    primary ? "border-[#d9ae19] bg-[#f3c945] text-[#11100e] hover:bg-[#f6d45d]" : "border-[#16130f] text-[#16130f] hover:bg-[#ebe3d6]"
  );
  if (action.kind === "link") {
    return (
      <Link className={className} href={action.href}>
        {action.label}
      </Link>
    );
  }
  return (
    <button className={className} onClick={() => scrollToSection(action.sectionId)} type="button">
      {action.label}
    </button>
  );
}

function FindingLink({ finding, ctx, label = "Fix this" }: { finding: Finding; ctx: StudentContext; label?: string }) {
  const destination = destinationForTarget(finding.target, ctx);
  const className = "border border-[#16130f] bg-white px-2.5 py-1 text-xs font-medium text-[#16130f] hover:bg-[#ebe3d6]";
  return destination.kind === "link" ? (
    <Link className={className} href={destination.href}>
      {label}
    </Link>
  ) : (
    <button className={className} onClick={() => scrollToSection(destination.sectionId)} type="button">
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------

function WelcomeDialog({ name, onStart, onSkip }: { name: string; onStart: () => void; onSkip: () => void }) {
  const startRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    startRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onSkip();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onSkip]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#16130f]/55 px-4 py-8">
      <div aria-describedby="welcome-intro" aria-labelledby="welcome-title" aria-modal="true" className="w-full max-w-2xl border border-[#d7cebd] bg-[#f4f0e8] p-6 sm:p-8" role="dialog">
        <p className="label-caps">Welcome</p>
        <h2 className="mt-2 font-serif text-3xl leading-tight text-[#16130f]" id="welcome-title">
          Welcome to Merit{name ? `, ${name.split(" ")[0]}` : ""}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#4d4437]" id="welcome-intro">
          Your <strong className="text-[#16130f]">Merit Passport</strong> is one link that shows employers what you have actually made. It sits
          next to your resume, not instead of it.
        </p>
        <ol className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            ["Your strongest 3–6 projects", "Employers look at the first one most, so lead with your best."],
            ["How you worked", "Sketches, iterations and wireframes show your thinking, not just the final shot."],
            ["What happened", "Feedback, a result, an award, or that it shipped."]
          ].map(([title, body], index) => (
            <li className="border border-[#d7cebd] bg-[#fbf8f0] p-3 text-sm" key={title}>
              <p className="font-semibold text-[#16130f]">
                {index + 1}. {title}
              </p>
              <p className="mt-1 leading-5 text-[#4d4437]">{body}</p>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-sm text-[#4d4437]">We&apos;ll show you what to do next and how your Passport compares. Setup takes about 10 minutes.</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            className="border border-[#d9ae19] bg-[#f3c945] px-4 py-2 text-sm font-semibold text-[#11100e] hover:bg-[#f6d45d]"
            onClick={onStart}
            ref={startRef}
            type="button"
          >
            Set up my Passport
          </button>
          <button className="px-2 py-2 text-sm text-[#16130f] underline underline-offset-4" onClick={onSkip} type="button">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}

function GettingStarted({ ctx }: { ctx: StudentContext }) {
  const { setChecklistHidden } = useOnboarding();
  const items = gettingStartedItems(ctx);
  const done = items.filter((item) => item.done).length;
  const next = items.find((item) => !item.done);
  const percent = Math.round((done / items.length) * 100);

  return (
    <section aria-labelledby="getting-started-heading" className="space-y-4 border border-[#d7cebd] bg-[#eee8dd] p-4 sm:p-5" id="getting-started">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-serif text-2xl text-[#16130f]" id="getting-started-heading">
            Getting started
          </h2>
          <p className="text-sm text-[#4d4437]">
            {done} of {items.length} done
          </p>
        </div>
        <button className="text-sm text-[#4d4437] underline underline-offset-4 hover:text-[#16130f]" onClick={() => setChecklistHidden(true)} type="button">
          Hide checklist
        </button>
      </div>
      <div aria-label="Setup progress" aria-valuemax={100} aria-valuemin={0} aria-valuenow={percent} className="h-2 bg-[#d7cebd]" role="progressbar">
        <div className="h-full bg-[#16130f]" style={{ width: `${percent}%` }} />
      </div>
      <ol className="divide-y divide-[#d7cebd]">
        {items.map((item) => (
          <li className="flex flex-wrap items-start gap-3 py-3" key={item.id}>
            <span
              aria-hidden="true"
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold",
                item.done ? "border-[#2f6b3a] bg-[#2f6b3a] text-white" : "border-[#6a5f4e]"
              )}
            >
              {item.done ? "✓" : ""}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-semibold", item.done ? "text-[#4d4437] line-through" : "text-[#16130f]")}>
                {item.label}
                <span className="sr-only">{item.done ? " (done)" : " (to do)"}</span>
              </p>
              {!item.done && item.id === next?.id ? <p className="mt-0.5 text-xs leading-5 text-[#4d4437]">{item.why}</p> : null}
            </div>
            {!item.done ? <ActionButton action={item.action} primary={item.id === next?.id} /> : null}
          </li>
        ))}
      </ol>
    </section>
  );
}

function PassportStrength({ ctx, review }: { ctx: StudentContext; review: Review }) {
  const [showAll, setShowAll] = useState(false);
  const next = review.nextBestAction;
  const findings = showAll ? review.findings : review.findings.slice(0, 4);

  return (
    <aside aria-labelledby="passport-strength-heading" className="space-y-5 border border-[#d7cebd] bg-[#eee8dd] p-4 sm:p-5" id="passport-strength">
      <div className="space-y-1" aria-live="polite">
        <h2 className="font-serif text-2xl text-[#16130f]" id="passport-strength-heading">
          Passport strength
        </h2>
        <p className="flex flex-wrap items-baseline gap-2">
          <span className="font-serif text-5xl leading-none tabular-nums text-[#16130f]">{review.score}</span>
          <span className="text-sm text-[#4d4437]">/ 100</span>
          <span className="border border-[#16130f] px-2 py-0.5 text-xs font-semibold text-[#16130f]">{review.label}</span>
        </p>
        <p className="text-xs leading-5 text-[#4d4437]">{LABEL_NOTES[review.label]}</p>
      </div>
      <CoachTip tipId={TIP_IDS.strength}>This score updates as you edit. Work through the next best step first.</CoachTip>

      {next ? (
        <div className="space-y-2 border-l-4 border-[#f3c945] bg-[#fffaf0] p-3">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#4d4437]">Next best step</p>
          <p className="text-sm font-medium leading-5 text-[#16130f]">{next.message}</p>
          <p className="text-xs leading-5 text-[#4d4437]">{next.suggestion}</p>
          {next.example ? <ExampleBox example={next.example} /> : null}
          <FindingLink ctx={ctx} finding={next} label="Fix this now" />
        </div>
      ) : (
        <p className="border-l-4 border-[#2f6b3a] bg-[#eaf3ea] p-3 text-sm text-[#1f3a24]">Nothing left to fix. Share your Passport link with every application.</p>
      )}

      <ul aria-label="Scores by category" className="space-y-2">
        {Object.entries(review.categories).map(([category, score]) => (
          <li className="grid grid-cols-[92px_1fr_32px] items-center gap-2 text-xs" key={category}>
            <span className="text-[#16130f]">{PASSPORT_CATEGORY_LABELS[category] ?? category}</span>
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

      {review.findings.length > 1 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#16130f]">All suggestions ({review.findings.length})</h3>
          <ul className="space-y-2">
            {findings.map((finding, index) => {
              const style = SEVERITY_STYLES[finding.severity];
              return (
                <li className="space-y-1.5 border-t border-[#d7cebd] pt-2" key={`${finding.ruleId}-${finding.target}-${index}`}>
                  <p className="text-sm leading-5 text-[#16130f]">
                    <span className={cn("mr-1 text-xs font-semibold", style.text)}>{style.label}:</span>
                    {finding.message}
                  </p>
                  <FindingLink ctx={ctx} finding={finding} />
                </li>
              );
            })}
          </ul>
          {review.findings.length > 4 ? (
            <button className="text-sm text-[#16130f] underline underline-offset-4" onClick={() => setShowAll((value) => !value)} type="button">
              {showAll ? "Show fewer" : `Show all ${review.findings.length}`}
            </button>
          ) : null}
        </div>
      ) : null}

      {ctx.projects.length ? (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[#16130f]">Project checklist</h3>
          {ctx.projects.map((project) => {
            const items = projectChecklist(project, ctx);
            const done = items.filter((item) => item.done).length;
            return (
              <details className="border border-[#d7cebd] bg-[#fbf8f0] p-3 text-sm" key={project.projectId}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
                  <span className="min-w-0 truncate font-medium text-[#16130f]">{project.title || "Untitled project"}</span>
                  <span className={cn("shrink-0 text-xs tabular-nums", done === items.length ? "text-[#2f6b3a]" : "text-[#4d4437]")}>
                    {done}/{items.length}
                  </span>
                </summary>
                <ul className="mt-2 space-y-1">
                  {items.map((item) => (
                    <li className="flex items-center gap-2 text-xs" key={item.ruleId}>
                      <span aria-hidden="true" className={item.done ? "text-[#2f6b3a]" : "text-[#8a4600]"}>
                        {item.done ? "✓" : "○"}
                      </span>
                      <span className={item.done ? "text-[#4d4437]" : "text-[#16130f]"}>
                        {item.label}
                        <span className="sr-only">{item.done ? " (done)" : " (to do)"}</span>
                      </span>
                    </li>
                  ))}
                </ul>
                {done < items.length ? (
                  <Link className="mt-2 inline-block text-xs font-medium text-[#16130f] underline underline-offset-4" href={`/projects/${project.projectId}/edit`}>
                    Improve this project
                  </Link>
                ) : null}
              </details>
            );
          })}
        </div>
      ) : null}
    </aside>
  );
}

export function HelpMenu() {
  const { replay } = useOnboarding();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  return (
    <div className="relative">
      <button
        aria-expanded={open}
        aria-haspopup="true"
        className="inline-flex h-11 items-center gap-1.5 border border-[#16130f] px-3 text-sm font-medium text-[#16130f] hover:bg-[#ebe3d6]"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        Help
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1 w-64 border border-[#d7cebd] bg-[#fbf8f0] p-2 shadow-[0_6px_18px_rgba(22,19,15,0.14)]">
          <button
            className="block w-full px-2 py-2 text-left text-sm text-[#16130f] hover:bg-[#ebe3d6]"
            onClick={() => {
              replay();
              setOpen(false);
              setMessage("Welcome tour restarted.");
            }}
            type="button"
          >
            Replay the welcome and tips
          </button>
          <button
            className="block w-full px-2 py-2 text-left text-sm text-[#16130f] hover:bg-[#ebe3d6]"
            onClick={() => {
              setOpen(false);
              scrollToSection("passport-strength");
            }}
            type="button"
          >
            How Passport strength works
          </button>
        </div>
      ) : null}
      <p aria-live="polite" className="sr-only">
        {message}
      </p>
    </div>
  );
}

/**
 * Coaching block at the top of the dashboard: welcome (once), getting-started
 * checklist and Passport strength.
 */
export function PassportCoach({ ctx }: { ctx: StudentContext }) {
  const onboarding = useOnboarding();
  const review = useMemo(() => runRules(passportRules, ctx, ctx), [ctx]);
  const allDone = gettingStartedItems(ctx).every((item) => item.done);
  const showChecklist = !onboarding.state.checklistHidden && !allDone;

  return (
    <>
      {!onboarding.state.welcomeCompleted && ctx.profile.roleType !== "recruiter" ? (
        <WelcomeDialog
          name={ctx.profile.name ?? ""}
          onSkip={onboarding.completeWelcome}
          onStart={() => {
            onboarding.completeWelcome();
            window.setTimeout(() => scrollToSection("getting-started"), 50);
          }}
        />
      ) : null}
      <div className={cn("grid grid-cols-1 gap-5", showChecklist && "xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)]")}>
        {showChecklist ? <GettingStarted ctx={ctx} /> : null}
        <PassportStrength ctx={ctx} review={review} />
      </div>
      {onboarding.state.checklistHidden && !allDone ? (
        <button className="text-sm text-[#16130f] underline underline-offset-4" onClick={() => onboarding.setChecklistHidden(false)} type="button">
          Show the getting-started checklist
        </button>
      ) : null}
    </>
  );
}

/** Empty state for a Passport with no projects yet. */
export function EmptyProjects() {
  return (
    <div className="space-y-4 border-2 border-dashed border-[#b9ad99] p-5 text-center sm:p-8">
      <p className="mx-auto max-w-xl text-sm leading-6 text-[#16130f]">
        <strong>No projects yet.</strong> A project is one piece of work told as a short story: the problem, your role, how you worked, and what happened.
      </p>
      <div aria-label="Example project card" className="mx-auto grid max-w-lg grid-cols-[96px_1fr] gap-3 border border-[#d7cebd] bg-[#fbf8f0] p-3 text-left" role="group">
        <div
          aria-hidden="true"
          className="min-h-[72px] bg-[repeating-linear-gradient(45deg,#e7dcc6,#e7dcc6_8px,#efe6d4_8px,#efe6d4_16px)]"
        />
        <div className="text-sm">
          <p className="font-semibold text-[#16130f]">Example: Campus wayfinding redesign</p>
          <p className="text-xs text-[#4d4437]">UX designer · Figma, Illustrator · 6 weeks</p>
          <p className="mt-1 text-xs leading-5 text-[#16130f]">Cut route-finding time for new students from 9 to 4 minutes in tests.</p>
        </div>
      </div>
      <Link
        className="inline-flex border border-[#d9ae19] bg-[#f3c945] px-4 py-2 text-sm font-semibold text-[#11100e] hover:bg-[#f6d45d]"
        href="/projects/new"
      >
        Add your first project
      </Link>
    </div>
  );
}
