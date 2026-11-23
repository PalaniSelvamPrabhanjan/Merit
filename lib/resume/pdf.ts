"use client";

import { createElement } from "react";
import { buildResumeDocument } from "@/lib/resume/document";
import { resumeFileName } from "@/lib/resume/format";
import type { ResumeData } from "@/lib/resume/types";

/**
 * Build the PDF in the browser. @react-pdf/renderer (about 2 MB) is only downloaded
 * when the student clicks Download.
 */
export async function renderResumePdfBlob(resume: ResumeData): Promise<Blob> {
  const [{ pdf }, { ResumePdfDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/resume/resume-pdf")
  ]);
  const title = resumeFileName(resume).replace(/\.pdf$/, "").replace(/-/g, " ");
  const element = createElement(ResumePdfDocument, { doc: buildResumeDocument(resume), title });
  // pdf() expects a <Document> element; ResumePdfDocument returns one.
  return pdf(element as Parameters<typeof pdf>[0]).toBlob();
}

/** Save a Blob as a file via a temporary object URL. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
