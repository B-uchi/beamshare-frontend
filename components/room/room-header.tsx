"use client";

import { Check, Copy, Lock, LockOpen, LogOut, Power, UserPlus } from "lucide-react";
import type { SignalingStatus } from "@/lib/hop/signaling";
import { HopMark } from "@/components/site/logo";
import Link from "next/link";
import { useCopy, useRoomLink } from "./invite";
import { cn } from "@/lib/utils";

interface RoomHeaderProps {
  code: string;
  isHost: boolean;
  locked: boolean;
  ended: boolean;
  connection: SignalingStatus;
  onInvite: () => void;
  onLock: (locked: boolean) => void;
  onLeave: () => void;
}

export function RoomHeader({ code, isHost, locked, ended, connection, onInvite, onLock, onLeave }: RoomHeaderProps) {
  const link = useRoomLink(code);
  const { copied, copy } = useCopy();

  return (
    <header className="sticky top-0 z-30 border-b border-rule bg-panel">
      <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-3 px-4 sm:px-6">
        <Link href="/" aria-label="Hop home" className="rounded-md">
          <HopMark />
        </Link>

        <button
          type="button"
          onClick={() => void copy(link)}
          className="group inline-flex h-10 items-center gap-2.5 rounded-md bg-cobalt pl-3 pr-2.5 text-cobalt-ink transition-colors hover:bg-cobalt-deep"
          aria-label={`Room ${code}. Copy invite link`}
        >
          <span className="font-display text-xl font-bold tracking-[0.08em] tnum">{code}</span>
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4 opacity-70 group-hover:opacity-100" aria-hidden />}
        </button>

        <ConnectionPill connection={connection} ended={ended} />

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {!ended && (
            <button type="button" className="btn btn-outline btn-sm" onClick={onInvite}>
              <UserPlus className="size-4" aria-hidden />
              <span className="hidden sm:inline">Invite</span>
            </button>
          )}
          {isHost && !ended && (
            <button
              type="button"
              className={cn("btn btn-sm", locked ? "btn-signal" : "btn-outline")}
              onClick={() => onLock(!locked)}
              aria-pressed={locked}
              title={locked ? "Room locked: no one new can join" : "Lock the room so no one new can join"}
            >
              {locked ? <Lock className="size-4" aria-hidden /> : <LockOpen className="size-4" aria-hidden />}
              <span className="hidden md:inline">{locked ? "Locked" : "Lock"}</span>
            </button>
          )}
          {!ended && (
            <button type="button" className={cn("btn btn-sm", isHost ? "btn-danger" : "btn-outline")} onClick={onLeave}>
              {isHost ? <Power className="size-4" aria-hidden /> : <LogOut className="size-4" aria-hidden />}
              <span className="hidden sm:inline">{isHost ? "End room" : "Leave"}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function ConnectionPill({ connection, ended }: { connection: SignalingStatus; ended: boolean }) {
  if (ended) {
    return <span className="text-sm font-semibold text-ink-3">Ended</span>;
  }
  const live = connection === "open";
  const label = live
    ? "Live"
    : connection === "offline"
      ? "You're offline"
      : "Reconnecting…";
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-2">
      <span
        aria-hidden
        className={cn(
          "size-2.5 rounded-full bg-signal ring-2 ring-signal/30",
          !live && "live-dot"
        )}
      />
      <span className={cn(!live && "hidden sm:inline")}>{label}</span>
    </span>
  );
}
