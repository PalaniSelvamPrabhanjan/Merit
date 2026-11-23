import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { buttonClassName } from "@/components/ui/button";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export default async function NotFound() {
  let userEmail: string | undefined;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();
    userEmail = user?.email ?? undefined;
  } catch {
    userEmail = undefined;
  }

  return (
    <AppShell userEmail={userEmail}>
      <section className="editorial-container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
        <p className="label-caps mb-5">Page not found</p>
        <h1 className="max-w-2xl font-serif text-4xl leading-tight text-[#16130f]">
          We couldn&apos;t find that page.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-[#6a5f4e]">
          The project or Passport may have been removed, or the link may be mistyped.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Link className={buttonClassName("primary", "min-w-56")} href={userEmail ? "/profile" : "/"}>
            {userEmail ? "Go to your dashboard" : "Go to the home page"}
          </Link>
          <Link className={buttonClassName("secondary", "min-w-56")} href="/home">
            Explore student work
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
