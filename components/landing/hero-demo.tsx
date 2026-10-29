"use client";

import { useEffect, useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { MessageSquareText } from "lucide-react";

const DURATION = 7000;

/**
 * Illustrative only: a file hops along the line between two stops while the
 * departures board below ticks through it. No real data.
 */
export function HeroDemo() {
  const [t, setT] = useState(0.3);
  const hydrated = useHydrated();
  const still = !hydrated || window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (still) return;
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT(((now - start) % DURATION) / DURATION);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [still]);

  // 0–0.7: travelling, 0.7–1: arrived and resting. Reduced motion shows the arrived state.
  const travel = still ? 1 : Math.min(1, t / 0.7);
  const eased = 1 - Math.pow(1 - travel, 3);
  const arrived = still || travel > 0.95;
  const x = 70 + eased * 300;
  const y = 112 - Math.sin(eased * Math.PI) * 74;
  const pct = Math.round(eased * 100);
  const size = 18.4;

  return (
    <figure className="relative" aria-label="Illustration: a file travelling directly from a phone to a laptop">
      <div className="overflow-hidden rounded-[var(--radius-sign)] bg-panel text-ink shadow-[var(--shadow-2)]">
        <svg viewBox="0 0 440 170" className="block w-full" aria-hidden>
          <line x1="70" y1="112" x2="370" y2="112" stroke="var(--cobalt)" strokeWidth="10" strokeLinecap="round" />
          <path
            d="M70 112 Q220 -36 370 112"
            fill="none"
            stroke="var(--cobalt)"
            strokeOpacity="0.25"
            strokeWidth="2"
            strokeDasharray="4 6"
          />
          {[70, 370].map((cx) => (
            <g key={cx}>
              <circle cx={cx} cy="112" r="14" fill="var(--panel)" stroke="var(--cobalt)" strokeWidth="5" />
            </g>
          ))}
          <circle cx="370" cy="112" r="6" fill={arrived ? "var(--signal)" : "var(--cobalt)"} />
          <text x="70" y="152" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--ink)">Your phone</text>
          <text x="370" y="152" textAnchor="middle" fontSize="15" fontWeight="600" fill="var(--ink)">Ana&rsquo;s laptop</text>
          {!arrived && (
            <g transform={`translate(${x} ${y})`}>
              <rect x="-58" y="-17" width="116" height="30" rx="5" fill="var(--signal)" />
              <text x="0" y="3" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--signal-ink)">
                trip-photos.zip
              </text>
            </g>
          )}
        </svg>

        <div className="bg-board px-4 pb-4 pt-3 text-board-ink sm:px-5">
          <div className="mb-2 flex items-baseline justify-between border-b border-board-rule pb-2">
            <span className="font-display text-lg font-bold tracking-wide">Departures</span>
            <span className="text-sm text-board-ink-2">Illustration</span>
          </div>
          <ul className="space-y-0 text-sm tnum">
            <DemoRow time="09:41" name="trip-photos.zip" to="Ana’s laptop">
              {arrived || still ? (
                <span className="font-semibold text-board-ink">Arrived</span>
              ) : (
                <span className="font-semibold text-signal">Sending {pct}%</span>
              )}
            </DemoRow>
            <DemoRow time="09:40" name="boarding-pass.pdf" to="Ana’s laptop">
              <span className="font-semibold text-board-ink">Arrived</span>
            </DemoRow>
            <DemoRow time="09:38" name="Wi-Fi password" to="Everyone" text>
              <span className="font-semibold text-board-ink">Delivered</span>
            </DemoRow>
          </ul>
          {!arrived && !still && (
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-board-2">
              <div className="h-full bg-signal" style={{ width: `${pct}%` }} />
            </div>
          )}
          {(arrived || still) && (
            <p className="mt-3 h-1 text-xs leading-none text-board-ink-2">
              {size} MB · nothing stored on the way
            </p>
          )}
        </div>
      </div>
    </figure>
  );
}

function DemoRow({
  time,
  name,
  to,
  text,
  children,
}: {
  time: string;
  name: string;
  to: string;
  text?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-b border-board-rule py-2 last:border-0 sm:grid-cols-[3rem_1fr_7rem_6.5rem]">
      <span className="text-board-ink-2">{time}</span>
      <span className="flex min-w-0 items-center gap-2 font-medium">
        {text && <MessageSquareText className="size-3.5 flex-none text-board-ink-2" aria-hidden />}
        <span className="truncate">{name}</span>
      </span>
      <span className="hidden truncate text-board-ink-2 sm:block">{to}</span>
      <span className="text-right">{children}</span>
    </li>
  );
}
