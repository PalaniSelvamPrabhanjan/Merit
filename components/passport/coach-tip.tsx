"use client";

import { useOnboarding } from "@/components/passport/onboarding-provider";
import { cn } from "@/lib/utils";

/**
 * A dismissible, non-blocking tip shown next to a control the first time a student
 * sees it. Inline (not an overlay), so it never covers anything or traps focus.
 */
export function CoachTip({ tipId, children, className }: { tipId: string; children: React.ReactNode; className?: string }) {
  const { isTipVisible, dismissTip } = useOnboarding();
  if (!isTipVisible(tipId)) return null;
  return (
    <div className={cn("flex items-start gap-3 bg-[#16130f] px-3.5 py-2.5 text-sm leading-5 text-white", className)} role="note">
      <span aria-hidden="true" className="pt-px text-[#f3c945]">
        Tip
      </span>
      <p className="flex-1">{children}</p>
      <button
        className="shrink-0 border border-white/70 px-2 py-0.5 text-xs font-medium text-white hover:bg-white/10"
        onClick={() => dismissTip(tipId)}
        type="button"
      >
        Got it
      </button>
    </div>
  );
}
