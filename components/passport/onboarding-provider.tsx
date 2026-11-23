"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  freshOnboarding,
  readLocalOnboarding,
  saveOnboarding,
  type OnboardingPersistence,
  type OnboardingState
} from "@/lib/onboarding/state";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

type OnboardingApi = {
  state: OnboardingState;
  completeWelcome: () => void;
  dismissTip: (tipId: string) => void;
  isTipVisible: (tipId: string) => boolean;
  setChecklistHidden: (hidden: boolean) => void;
  /** Help menu: show the welcome and every tip again. */
  replay: () => void;
};

const OnboardingContext = createContext<OnboardingApi | null>(null);

export function OnboardingProvider({
  userId,
  initialState,
  persistence,
  children
}: {
  userId: string;
  initialState: OnboardingState;
  persistence: OnboardingPersistence;
  children: ReactNode;
}) {
  const [state, setState] = useState(initialState);

  useEffect(() => {
    if (persistence !== "device") return;
    const local = readLocalOnboarding(userId);
    if (local) setState(local);
  }, [persistence, userId]);

  const update = useCallback(
    (next: (current: OnboardingState) => OnboardingState) => {
      setState((current) => {
        const value = next(current);
        void saveOnboarding(persistence === "account" ? createBrowserSupabaseClient() : null, userId, value, persistence);
        return value;
      });
    },
    [persistence, userId]
  );

  const api = useMemo<OnboardingApi>(
    () => ({
      state,
      completeWelcome: () => update((current) => ({ ...current, welcomeCompleted: true })),
      dismissTip: (tipId) =>
        update((current) => ({ ...current, dismissedTips: Array.from(new Set([...current.dismissedTips, tipId])) })),
      // Tips appear only after the welcome, one place at a time, until dismissed.
      isTipVisible: (tipId) => state.welcomeCompleted && !state.dismissedTips.includes(tipId),
      setChecklistHidden: (hidden) => update((current) => ({ ...current, checklistHidden: hidden })),
      replay: () => update(() => ({ ...freshOnboarding() }))
    }),
    [state, update]
  );

  return <OnboardingContext.Provider value={api}>{children}</OnboardingContext.Provider>;
}

/** Onboarding API, or a no-op version when rendered outside the provider. */
export function useOnboarding(): OnboardingApi {
  const api = useContext(OnboardingContext);
  if (api) return api;
  return {
    state: { welcomeCompleted: true, dismissedTips: [], checklistHidden: true },
    completeWelcome: () => undefined,
    dismissTip: () => undefined,
    isTipVisible: () => false,
    setChecklistHidden: () => undefined,
    replay: () => undefined
  };
}
