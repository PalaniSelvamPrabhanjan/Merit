"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingRelationOrColumnError } from "@/lib/db/schema-compat";
import { normalizeResume } from "@/lib/resume/model";
import { RESUME_SCHEMA_VERSION, type ResumeData } from "@/lib/resume/types";

// The app's browser client is created without the Database generic, so accept any client.
type Client = SupabaseClient;
type Json = Record<string, unknown>;

export type SaveResult = { ok: true; where: "account" | "device" } | { ok: false; error: string };

function localKey(userId: string) {
  return `merit-resume-draft:${userId}`;
}

export function readLocalDraft(userId: string): ResumeData | null {
  try {
    const raw = window.localStorage.getItem(localKey(userId));
    return raw ? normalizeResume(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function writeLocalDraft(userId: string, resume: ResumeData): boolean {
  try {
    window.localStorage.setItem(localKey(userId), JSON.stringify(resume));
    return true;
  } catch {
    return false;
  }
}

function isMissingTable(message: string) {
  return isMissingRelationOrColumnError(message, ["resumes", "resume_versions"]);
}

/** Upsert the current draft. Falls back to this device when the table isn't deployed yet. */
export async function saveResume(
  supabase: Client | null,
  userId: string,
  resume: ResumeData,
  score: number
): Promise<SaveResult> {
  if (!supabase) {
    return writeLocalDraft(userId, resume) ? { ok: true, where: "device" } : { ok: false, error: "This browser blocked saving." };
  }
  const { error } = await supabase.from("resumes").upsert(
    { user_id: userId, data: resume as unknown as Json, schema_version: RESUME_SCHEMA_VERSION, score },
    { onConflict: "user_id" }
  );
  if (!error) {
    return { ok: true, where: "account" };
  }
  if (isMissingTable(error.message)) {
    return writeLocalDraft(userId, resume) ? { ok: true, where: "device" } : { ok: false, error: error.message };
  }
  return { ok: false, error: error.message };
}

/** Keep a snapshot of what was downloaded. Best effort: never blocks the download. */
export async function snapshotResume(supabase: Client | null, userId: string, resume: ResumeData, score: number) {
  if (!supabase) return;
  try {
    const { data, error } = await supabase.from("resumes").select("resume_id").eq("user_id", userId).maybeSingle();
    if (error || !data) return;
    await supabase.from("resume_versions").insert({
      resume_id: (data as { resume_id: string }).resume_id,
      user_id: userId,
      data: resume as unknown as Json,
      schema_version: RESUME_SCHEMA_VERSION,
      score,
      reason: "download"
    });
  } catch {
    // ignore: history is a nice-to-have
  }
}
