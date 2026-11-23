import type { MonthValue, ResumeData, ResumeExperience, ResumeProject } from "@/lib/resume/types";

// Shared formatting for the HTML preview and the PDF template, so they never drift.

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function isMonthValue(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

/** "2026-03" -> "Mar 2026". Anything else -> "". */
export function formatMonth(value: MonthValue): string {
  if (!isMonthValue(value)) {
    return "";
  }
  const [year, month] = value.split("-");
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

/** "Jan 2026 – Mar 2026", "Jan 2026 – Present", "Expected May 2028". */
export function formatDateRange({
  startDate,
  endDate,
  current = false,
  expected = false
}: {
  startDate: MonthValue;
  endDate: MonthValue;
  current?: boolean;
  expected?: boolean;
}): string {
  const start = formatMonth(startDate);
  const end = current ? "Present" : formatMonth(endDate);
  if (expected && end && !current) {
    return start ? `${start} – ${end}` : `Expected ${end}`;
  }
  if (start && end) {
    return start === end ? start : `${start} – ${end}`;
  }
  return start || end;
}

export function entryDateRange(entry: ResumeProject | ResumeExperience): string {
  return formatDateRange({ startDate: entry.startDate, endDate: entry.endDate, current: entry.current });
}

/** Contact line pieces in display order, empty ones removed. URLs are shown without the scheme. */
export function contactItems(data: ResumeData): string[] {
  const { basics } = data;
  return [basics.email, basics.phone, basics.location, basics.linkedinUrl, basics.portfolioUrl]
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/^https?:\/\//i, "").replace(/\/$/, ""));
}

export function cleanBullets(bullets: string[]): string[] {
  return bullets.map((bullet) => bullet.trim()).filter(Boolean);
}

/** "Avery Tan" -> "Avery-Tan-Resume.pdf" */
export function resumeFileName(data: ResumeData): string {
  const name = data.basics.fullName
    .trim()
    .replace(/[^A-Za-z0-9\s-]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .join("-");
  return `${name || "My"}-Resume.pdf`;
}
