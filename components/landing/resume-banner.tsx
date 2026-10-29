"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getHopClient, useHop } from "@/hooks/use-hop";
import { useHydrated } from "@/hooks/use-hydrated";

/** Navigated away mid-room? Offer the way back instead of silently dropping it. */
export function ResumeBanner() {
  const { phase, room } = useHop();
  const stored = useHydrated() ? getHopClient().storedRoom() : null;

  const code = phase === "in-room" ? room?.code : stored;
  if (!code || phase === "ended") return null;

  return (
    <div className="bg-signal text-signal-ink">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 text-sm font-semibold sm:px-8">
        <span>You&rsquo;re still in room <span className="tnum tracking-wider">{code}</span></span>
        <Link href={`/r/${code}`} className="inline-flex items-center gap-1.5 underline underline-offset-4">
          Return to room <ArrowRight className="size-4" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
