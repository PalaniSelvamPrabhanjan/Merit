import "server-only";

import { buildStudentContext } from "@/lib/advisor/context";
import type { StudentContext } from "@/lib/advisor/types";
import { getViewerProfile } from "@/lib/db/profile";
import { fetchProjectsByUser } from "@/lib/db/projects";
import type { createServerSupabaseClient } from "@/lib/supabase/server";

type DbClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

/**
 * Load everything Merit already knows about a student, for advisors and rules.
 * Uses the caller's Supabase client, so Row Level Security still applies.
 */
export async function loadStudentContext(supabase: DbClient, userId: string): Promise<StudentContext> {
  const [profile, projects] = await Promise.all([
    getViewerProfile(supabase, userId),
    fetchProjectsByUser(supabase, userId)
  ]);
  return buildStudentContext({ userId, profile, projects });
}
