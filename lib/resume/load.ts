import "server-only";

import { isMissingRelationOrColumnError } from "@/lib/db/schema-compat";
import { normalizeResume } from "@/lib/resume/model";
import type { ResumeData } from "@/lib/resume/types";
import type { createServerSupabaseClient } from "@/lib/supabase/server";

type DbClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export type StoredResume =
  | { status: "found"; resume: ResumeData }
  | { status: "none" }
  /** The resumes table isn't deployed yet: the builder saves on the device instead. */
  | { status: "unavailable" };

export async function loadStoredResume(supabase: DbClient, userId: string): Promise<StoredResume> {
  const { data, error } = await supabase.from("resumes").select("data").eq("user_id", userId).maybeSingle();
  if (error) {
    if (isMissingRelationOrColumnError(error.message, ["resumes"])) {
      return { status: "unavailable" };
    }
    throw new Error(`Failed to load resume: ${error.message}`);
  }
  if (!data) {
    return { status: "none" };
  }
  return { status: "found", resume: normalizeResume((data as { data: unknown }).data) };
}
