import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ResumeBuilder } from "@/components/resume/resume-builder";
import { loadStudentContext } from "@/lib/advisor/context-loader";
import { buildAuthPath } from "@/lib/auth/auth-urls";
import { ensureUserAndProfile } from "@/lib/db/profile";
import { getPublicAppUrl } from "@/lib/public-config";
import { loadStoredResume } from "@/lib/resume/load";
import { prefillResume } from "@/lib/resume/model";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Resume builder · Merit" };

export default async function ResumePage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildAuthPath("/sign-in", "/resume"));
  }

  await ensureUserAndProfile(supabase, user);
  const appUrl = getPublicAppUrl() ?? "https://meritsg.com";
  const [context, stored] = await Promise.all([loadStudentContext(supabase, user.id), loadStoredResume(supabase, user.id)]);

  const initialResume = stored.status === "found" ? stored.resume : prefillResume(context, { appUrl });

  return (
    <AppShell roleType={context.profile.roleType} userEmail={user.email}>
      <ResumeBuilder
        appUrl={appUrl}
        context={context}
        initialResume={initialResume}
        persistence={stored.status === "unavailable" ? "device" : "account"}
        userId={user.id}
      />
    </AppShell>
  );
}
