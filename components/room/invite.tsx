"use client";

import { useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { Check, Link2, Share2 } from "lucide-react";
import { QrCode } from "@/components/ui/qr-code";
import { cn } from "@/lib/utils";

export function useRoomLink(code: string) {
  const hydrated = useHydrated();
  return hydrated ? `${window.location.origin}/r/${code}` : `/r/${code}`;
}

export function useCopy(timeout = 1800) {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (text: string, key = "default") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), timeout);
      return true;
    } catch {
      return false;
    }
  };
  return { copied, copy };
}

/** The platform sign: big code, QR, link. Used inline while waiting and in the invite dialog. */
export function InviteSign({ code, compact = false }: { code: string; compact?: boolean }) {
  const link = useRoomLink(code);
  const { copied, copy } = useCopy();
  const canShare = useHydrated() && typeof navigator.share === "function";

  return (
    <div className={cn("sign grid gap-6 p-6 sm:p-8", !compact && "md:grid-cols-[1fr_auto] md:items-center md:gap-10")}>
      <div className="min-w-0 space-y-5">
        <div>
          <h2 className="sr-only">Room code</h2>
          <p
            className={cn(
              "font-display font-bold leading-none tracking-[0.1em] tnum",
              compact ? "text-5xl" : "text-6xl sm:text-7xl lg:text-8xl"
            )}
            aria-label={code.split("").join(" ")}
          >
            {code}
          </p>
        </div>
        <p className="max-w-sm text-cobalt-ink-2">
          Type this code at <span className="font-semibold text-cobalt-ink">{shortHost(link)}</span>, open the link, or scan
          the code with a phone camera.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-on-cobalt" onClick={() => void copy(link, "link")}>
            {copied === "link" ? <Check className="size-4" aria-hidden /> : <Link2 className="size-4" aria-hidden />}
            {copied === "link" ? "Link copied" : "Copy link"}
          </button>
          <button type="button" className="btn btn-cobalt-ghost" onClick={() => void copy(code, "code")}>
            {copied === "code" ? <Check className="size-4" aria-hidden /> : null}
            {copied === "code" ? "Code copied" : "Copy code"}
          </button>
          {canShare && (
            <button
              type="button"
              className="btn btn-cobalt-ghost"
              onClick={() => void navigator.share({ title: "Join my Hop room", text: `Room code ${code}`, url: link }).catch(() => {})}
            >
              <Share2 className="size-4" aria-hidden /> Share
            </button>
          )}
        </div>
      </div>
      <QrCode
        value={link}
        label={`QR code linking to room ${code}`}
        className={cn("w-40 justify-self-start", !compact && "sm:w-48 md:w-52")}
      />
    </div>
  );
}

function shortHost(link: string) {
  try {
    return new URL(link).host;
  } catch {
    return "this site";
  }
}
