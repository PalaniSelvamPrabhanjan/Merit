"use client";

import type { Finding } from "@/lib/advisor/types";
import { buildResumeDocument } from "@/lib/resume/document";
import { estimateResumeLines, LINES_PER_PAGE } from "@/lib/resume/length";
import { findingsAt } from "@/lib/resume/targets";
import type { ResumeData } from "@/lib/resume/types";
import { cn } from "@/lib/utils";

/**
 * On-screen preview of the classic template. Built from the same document model as the
 * PDF (lib/resume/document.ts), styled to match it. Bullets with open findings are marked.
 */
export function ResumePreview({
  resume,
  findings,
  highlightedTarget,
  onSelectTarget
}: {
  resume: ResumeData;
  findings: Finding[];
  highlightedTarget: string | null;
  onSelectTarget: (target: string) => void;
}) {
  const doc = buildResumeDocument(resume);
  const lines = estimateResumeLines(resume);
  const overflow = lines > LINES_PER_PAGE;
  const flagged = (target: string) => findingsAt(findings, target).some((finding) => finding.severity !== "polish");

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-[#5c5244]">
        <span>Preview · A4, one column, ATS-safe</span>
        <span className={cn("tabular-nums", overflow && "font-semibold text-[#a3261b]")}>
          {overflow ? `About ${lines - LINES_PER_PAGE} lines over one page` : `Fits on one page (about ${lines} of ${LINES_PER_PAGE} lines)`}
        </span>
      </div>
      <article
        aria-label="Resume preview"
        className="relative bg-white px-[7%] py-[6%] text-[11px] leading-[1.4] text-[#111] shadow-[0_1px_8px_rgba(22,19,15,0.14)]"
        style={{ fontFamily: "Helvetica, Arial, sans-serif", minHeight: "min(1123px, 140vw)" }}
      >
        {doc.name ? (
          <p className="text-[20px] font-bold leading-tight">{doc.name}</p>
        ) : (
          <p className="text-[20px] font-bold leading-tight text-[#767676]">Your name</p>
        )}
        {doc.headline ? <p className="mt-0.5 text-[11.5px]">{doc.headline}</p> : null}
        {doc.contact.length ? <p className="mt-1 break-words text-[10.5px] text-[#222]">{doc.contact.join("  |  ")}</p> : null}

        {doc.sections.map((section) => (
          <section className="mt-3" key={section.id}>
            <h3 className="mb-1.5 border-b border-[#111] pb-0.5 text-[11.5px] font-bold uppercase" style={{ fontFamily: "inherit", letterSpacing: 0 }}>
              {section.heading}
            </h3>
            {section.text ? <p>{section.text}</p> : null}
            {section.entries.map((entry) => (
              <div className="mb-1.5" key={entry.target}>
                {entry.title || entry.dates ? (
                  <div className="flex justify-between gap-3">
                    <span className="font-bold">{entry.title}</span>
                    <span className="shrink-0">{entry.dates}</span>
                  </div>
                ) : null}
                {entry.subtitle ? <p className="break-words italic">{entry.subtitle}</p> : null}
                {section.id === "education" || section.id === "extras" ? (
                  entry.bullets.map((bullet) => <p key={bullet.target}>{bullet.text}</p>)
                ) : (
                  <ul className="mt-0.5 list-disc space-y-0.5 pl-4">
                    {entry.bullets.map((bullet) => (
                      <li key={bullet.target}>
                        <button
                          className={cn(
                            "inline text-left",
                            flagged(bullet.target) && "underline decoration-[#b8742a] decoration-wavy decoration-1 underline-offset-2",
                            highlightedTarget === bullet.target && "bg-[#fff2bf]"
                          )}
                          onClick={() => onSelectTarget(bullet.target)}
                          title={flagged(bullet.target) ? "This bullet has feedback. Click to edit it." : "Edit this bullet"}
                          type="button"
                        >
                          {bullet.text}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </section>
        ))}

        {doc.sections.length === 0 ? (
          <p className="mt-6 text-[#767676]">Your sections appear here as you fill in each step.</p>
        ) : null}
      </article>
    </div>
  );
}
