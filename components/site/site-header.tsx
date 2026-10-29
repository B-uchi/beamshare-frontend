import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";

export function SiteHeader({ tone = "ground" }: { tone?: "ground" | "cobalt" }) {
  const onCobalt = tone === "cobalt";
  return (
    <header className={cn(onCobalt ? "bg-cobalt pt-2 text-cobalt-ink sm:pt-0" : "bg-ground text-ink")}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:h-20 sm:px-8">
        <Logo onCobalt={onCobalt} />
        <nav aria-label="Main" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/how-it-works"
            className={cn("btn btn-sm hidden sm:inline-flex", onCobalt ? "btn-cobalt-ghost border-transparent" : "btn-ghost")}
          >
            How it works
          </Link>
          <Link
            href="/privacy"
            className={cn("btn btn-sm hidden sm:inline-flex", onCobalt ? "btn-cobalt-ghost border-transparent" : "btn-ghost")}
          >
            Privacy
          </Link>
          <Link href="/new" className={cn("btn btn-sm", onCobalt ? "btn-on-cobalt" : "btn-primary")}>
            Start a room <ArrowRight className="size-4" aria-hidden />
          </Link>
        </nav>
      </div>
    </header>
  );
}
