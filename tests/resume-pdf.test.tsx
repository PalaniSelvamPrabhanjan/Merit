import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { ResumePdfDocument } from "@/components/resume/resume-pdf";
import { buildResumeDocument } from "@/lib/resume/document";
import { sampleResume } from "@/lib/resume/sample";

async function renderSample() {
  const resume = sampleResume();
  return renderToBuffer(<ResumePdfDocument doc={buildResumeDocument(resume)} title="Avery Tan Resume" />);
}

async function extract(buffer: Buffer) {
  const pdf = await getDocument({ data: new Uint8Array(buffer), verbosity: 0 }).promise;
  const pages: string[] = [];
  for (let number = 1; number <= pdf.numPages; number += 1) {
    const page = await pdf.getPage(number);
    const content = await page.getTextContent();
    pages.push(
      content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
    );
  }
  return { numPages: pdf.numPages, text: pages.join(" ") };
}

describe("resume PDF export", () => {
  it("produces a one-page PDF with real, extractable text in reading order", async () => {
    const buffer = await renderSample();
    if (process.env.WRITE_SAMPLE_PDF) {
      const out = path.resolve("docs/resume-builder/sample-resume.pdf");
      mkdirSync(path.dirname(out), { recursive: true });
      writeFileSync(out, buffer);
    }

    const { numPages, text } = await extract(buffer);
    expect(numPages).toBe(1);

    // Name and contact first, then the standard headings in the student order.
    const order = [
      "Avery Tan",
      "avery.tan@example.com",
      "meritsg.com/passport/avery-tan",
      "EDUCATION",
      "Example Polytechnic",
      "Diploma in User Experience Design",
      "PROJECTS",
      "Campus wayfinding redesign",
      "Interviewed 12 first-year students",
      "cut route-finding time from 9 to 4 minutes",
      "Hawker queue app concept",
      "EXPERIENCE",
      "Example Print Studio",
      "Prepare print-ready files in InDesign",
      "SKILLS",
      "Figma, Illustrator, Photoshop",
      "ADDITIONAL",
      "Awards: Finalist, Example Design Hackathon 2026"
    ];

    let cursor = -1;
    for (const needle of order) {
      const index = text.indexOf(needle, cursor + 1);
      expect(index, `“${needle}” should appear after the previous item`).toBeGreaterThan(cursor);
      cursor = index;
    }

    expect(text).toContain("Apr 2025 – Mar 2028");
    expect(text).toContain("Aug 2026 – Present");
  }, 30_000);
});
