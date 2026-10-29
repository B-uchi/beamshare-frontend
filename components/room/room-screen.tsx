"use client";

import Link from "next/link";
import { getHopClient, useHop } from "@/hooks/use-hop";
import { useHydrated } from "@/hooks/use-hydrated";
import { Logo } from "@/components/site/logo";
import { JoinForm } from "./join-form";
import { Room } from "./room";

const ENDED_NOTICE: Record<string, string> = {
  expired: "Your earlier seat in this room has expired. Join again to continue.",
};

export function RoomScreen({ code }: { code: string }) {
  const state = useHop();
  const stored = useHydrated() ? getHopClient().storedRoom() : undefined;

  const here = state.room?.code === code;
  if (here && (state.phase === "in-room" || state.phase === "ended")) return <Room state={state} />;

  if (stored === undefined || (state.phase === "connecting" && stored === code)) {
    return <Reconnecting code={code} />;
  }

  const notice =
    state.phase === "in-room" && state.room
      ? `Joining will take you out of room ${state.room.code}.`
      : state.ended
        ? ENDED_NOTICE[state.ended]
        : undefined;

  return (
    <main className="flex min-h-dvh flex-col bg-ground">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
        <Logo />
        <Link href="/new" className="btn btn-ghost btn-sm">Start your own room</Link>
      </div>
      <div className="flex flex-1 items-start justify-center px-4 pb-24 pt-8 sm:items-center sm:pt-0">
        <JoinForm fixedCode={code} notice={notice} />
      </div>
    </main>
  );
}

function Reconnecting({ code }: { code: string }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-ground px-4" aria-live="polite">
      <div className="sign sign-tight px-8 py-5 text-center">
        <p className="font-display text-5xl font-bold tracking-[0.08em] tnum">{code}</p>
      </div>
      <p className="flex items-center gap-2 text-ink-2">
        <span className="live-dot size-2 rounded-full bg-signal" aria-hidden /> Rejoining the room…
      </p>
    </main>
  );
}
