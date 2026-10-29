"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, RotateCw } from "lucide-react";
import { getHopClient, useHop } from "@/hooks/use-hop";
import { HopError } from "@/lib/hop/client";
import { Logo } from "@/components/site/logo";

export function NewRoom() {
  const router = useRouter();
  const { phase, room } = useHop();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  const busyElsewhere = phase === "in-room" && room;

  const open = useCallback(async () => {
    setError(null);
    try {
      const code = await getHopClient().create();
      router.replace(`/r/${code}`);
    } catch (err) {
      setError(err instanceof HopError ? err.message : "Couldn't open a room. Try again.");
    }
  }, [router]);

  useEffect(() => {
    if (started.current || busyElsewhere || phase === "connecting") return;
    started.current = true;
    void open();
  }, [open, busyElsewhere, phase]);

  return (
    <main className="flex min-h-dvh flex-col bg-cobalt text-cobalt-ink">
      <div className="mx-auto flex w-full max-w-7xl px-4 py-5 sm:px-8">
        <Logo onCobalt />
      </div>
      <div className="flex flex-1 items-center justify-center px-4 pb-24">
        <div className="w-full max-w-lg space-y-6 text-center" aria-live="polite">
          {busyElsewhere ? (
            <>
              <h1 className="text-4xl font-bold sm:text-5xl">You&rsquo;re already in room {room.code}</h1>
              <p className="text-lg text-cobalt-ink-2">Opening a new room will take you out of that one.</p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Link href={`/r/${room.code}`} className="btn btn-on-cobalt btn-lg">
                  Back to {room.code} <ArrowRight className="size-5" aria-hidden />
                </Link>
                <button type="button" className="btn btn-cobalt-ghost btn-lg" onClick={() => void open()}>
                  Open a new room
                </button>
              </div>
            </>
          ) : error ? (
            <>
              <h1 className="text-4xl font-bold sm:text-5xl">Couldn&rsquo;t open a room</h1>
              <p className="text-lg text-cobalt-ink-2">{error}</p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <button type="button" className="btn btn-signal btn-lg" onClick={() => void open()}>
                  <RotateCw className="size-5" aria-hidden /> Try again
                </button>
                <Link href="/" className="btn btn-cobalt-ghost btn-lg">Back home</Link>
              </div>
            </>
          ) : (
            <>
              <div aria-hidden className="mx-auto flex w-56 items-center">
                <span className="size-6 flex-none rounded-full border-[5px] border-white bg-cobalt" />
                <span className="relative h-1.5 flex-1 overflow-hidden bg-white/30">
                  <span className="absolute inset-y-0 left-0 w-1/3 animate-[board-sheen_1.1s_var(--ease-out)_infinite] bg-signal" />
                </span>
                <span className="size-6 flex-none rounded-full border-[5px] border-white/40 bg-cobalt" />
              </div>
              <h1 className="text-4xl font-bold sm:text-5xl">Opening your room</h1>
              <p className="text-lg text-cobalt-ink-2">Getting a code from the signaling server.</p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
