import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  id
}: PropsWithChildren<{ className?: string; id?: string }>) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-none border border-[#d7cebd] bg-[#eee8dd] p-4 shadow-none",
        className
      )}
    >
      {children}
    </section>
  );
}
