import type { SupabaseClient } from "@supabase/supabase-js";
import { isMissingRelationOrColumnError } from "@/lib/db/schema-compat";

/** Per-student onboarding progress (table user_onboarding, migration 20261123000003). */
export interface OnboardingState {
  welcomeCompleted: boolean;
  dismissedTips: string[];
  checklistHidden: boolean;
}

/** "account": saved to Supabase. "device": table missing, saved in this browser. "demo": not saved. */
export type OnboardingPersistence = "account" | "device" | "demo";

export const TIP_IDS = {
  viewPassport: "tip-view-passport",
  addProject: "tip-add-project",
  featured: "tip-featured-first",
  strength: "tip-strength-panel"
} as const;

export function freshOnboarding(): OnboardingState {
  return { welcomeCompleted: false, dismissedTips: [], checklistHidden: false };
}

export function onboardingFromRow(row: Record<string, unknown> | null | undefined): OnboardingState {
  if (!row) return freshOnboarding();
  return {
    welcomeCompleted: Boolean(row.welcome_completed_at),
    dismissedTips: Array.isArray(row.dismissed_tips) ? row.dismissed_tips.filter((tip): tip is string => typeof tip === "string") : [],
    checklistHidden: row.checklist_hidden === true
  };
}

export async function loadOnboarding(
  supabase: SupabaseClient,
  userId: string
): Promise<{ state: OnboardingState; persistence: OnboardingPersistence }> {
  const { data, error } = await supabase
    .from("user_onboarding")
    .select("welcome_completed_at, dismissed_tips, checklist_hidden")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    if (isMissingRelationOrColumnError(error.message, ["user_onboarding"])) {
      return { state: freshOnboarding(), persistence: "device" };
    }
    // Never block the dashboard on onboarding state.
    return { state: freshOnboarding(), persistence: "device" };
  }
  return { state: onboardingFromRow(data as Record<string, unknown> | null), persistence: "account" };
}

function localKey(userId: string) {
  return `merit-onboarding:${userId}`;
}

export function readLocalOnboarding(userId: string): OnboardingState | null {
  try {
    const raw = window.localStorage.getItem(localKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      welcomeCompleted: parsed.welcomeCompleted === true,
      dismissedTips: Array.isArray(parsed.dismissedTips) ? parsed.dismissedTips.filter((tip) => typeof tip === "string") : [],
      checklistHidden: parsed.checklistHidden === true
    };
  } catch {
    return null;
  }
}

export async function saveOnboarding(
  supabase: SupabaseClient | null,
  userId: string,
  state: OnboardingState,
  persistence: OnboardingPersistence
): Promise<void> {
  if (persistence === "demo") return;
  if (persistence === "device" || !supabase) {
    try {
      window.localStorage.setItem(localKey(userId), JSON.stringify(state));
    } catch {
      // storage blocked: the state lasts for this page view only
    }
    return;
  }
  await supabase.from("user_onboarding").upsert(
    {
      user_id: userId,
      welcome_completed_at: state.welcomeCompleted ? new Date().toISOString() : null,
      dismissed_tips: state.dismissedTips,
      checklist_hidden: state.checklistHidden
    },
    { onConflict: "user_id" }
  );
}
