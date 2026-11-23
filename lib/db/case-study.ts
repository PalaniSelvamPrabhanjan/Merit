import type { SupabaseClient } from "@supabase/supabase-js";
import { isMonthValue } from "@/lib/resume/format";

// Case-study fields added in migration 20261123000003. Loaded with separate queries so
// that, before the migration is applied, every page still works (fields read as empty).

export type CaseStudyExtras = {
  role: string;
  startedMonth: string;
  finishedMonth: string;
  coverAltText: string;
  /** Alt text by artifact URL. */
  artifactAltText: Record<string, string>;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function month(value: unknown) {
  const raw = text(value);
  return isMonthValue(raw) ? raw : "";
}

export async function fetchCaseStudyExtras(
  supabase: SupabaseClient,
  projectIds: string[]
): Promise<Map<string, CaseStudyExtras>> {
  const result = new Map<string, CaseStudyExtras>();
  const ids = projectIds.filter(Boolean);
  if (ids.length === 0) return result;

  const [projects, artifacts] = await Promise.all([
    supabase.from("projects").select("project_id, role, started_month, finished_month, cover_alt_text").in("project_id", ids),
    supabase.from("artifacts").select("project_id, artifact_url, alt_text").in("project_id", ids)
  ]);

  if (!projects.error) {
    for (const row of (projects.data ?? []) as Array<Record<string, unknown>>) {
      result.set(text(row.project_id), {
        role: text(row.role),
        startedMonth: month(row.started_month),
        finishedMonth: month(row.finished_month),
        coverAltText: text(row.cover_alt_text),
        artifactAltText: {}
      });
    }
  }
  if (!artifacts.error) {
    for (const row of (artifacts.data ?? []) as Array<Record<string, unknown>>) {
      const projectId = text(row.project_id);
      const alt = text(row.alt_text);
      if (!alt) continue;
      const entry =
        result.get(projectId) ?? { role: "", startedMonth: "", finishedMonth: "", coverAltText: "", artifactAltText: {} };
      entry.artifactAltText[text(row.artifact_url)] = alt;
      result.set(projectId, entry);
    }
  }
  return result;
}

type CaseStudyCard = {
  projectId: string;
  role: string;
  startedMonth: string;
  finishedMonth: string;
  coverAltText: string;
  artifacts: Array<{ url: string; altText: string }>;
};

/** Fill case-study fields on project cards. Never throws. */
export async function attachCaseStudy<T extends CaseStudyCard>(supabase: SupabaseClient, cards: T[]): Promise<T[]> {
  if (cards.length === 0) return cards;
  let extras: Map<string, CaseStudyExtras>;
  try {
    extras = await fetchCaseStudyExtras(
      supabase,
      cards.map((card) => card.projectId)
    );
  } catch {
    return cards;
  }
  return cards.map((card) => {
    const entry = extras.get(card.projectId);
    if (!entry) return card;
    return {
      ...card,
      role: entry.role,
      startedMonth: entry.startedMonth,
      finishedMonth: entry.finishedMonth,
      coverAltText: entry.coverAltText,
      artifacts: card.artifacts.map((artifact) => ({ ...artifact, altText: entry.artifactAltText[artifact.url] ?? artifact.altText }))
    };
  });
}
