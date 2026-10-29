"use client";

import { forwardRef, useState } from "react";
import { CODE_LENGTH, normalizeCode } from "@/lib/hop/protocol";
import { cn } from "@/lib/utils";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  id?: string;
  label?: string;
  tone?: "panel" | "cobalt";
  size?: "md" | "lg";
  invalid?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
}

/** Six letter cells over a single real input, so typing, paste and autofill all just work. */
export const CodeInput = forwardRef<HTMLInputElement, CodeInputProps>(function CodeInput(
  { value, onChange, onComplete, id, label = "Room code", tone = "panel", size = "md", invalid, autoFocus, disabled },
  ref
) {
  const [focused, setFocused] = useState(false);
  const chars = value.padEnd(CODE_LENGTH, " ").split("");
  const active = Math.min(value.length, CODE_LENGTH - 1);
  const onCobalt = tone === "cobalt";

  return (
    <div className={cn("relative inline-flex", disabled && "opacity-60")}>
      <input
        ref={ref}
        id={id}
        aria-label={label}
        aria-invalid={invalid || undefined}
        value={value}
        disabled={disabled}
        autoFocus={autoFocus}
        autoComplete="one-time-code"
        autoCapitalize="characters"
        spellCheck={false}
        inputMode="text"
        maxLength={CODE_LENGTH + 4}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const next = normalizeCode(e.target.value);
          onChange(next);
          if (next.length === CODE_LENGTH) onComplete?.(next);
        }}
        className="absolute inset-0 z-10 h-full w-full cursor-text opacity-0"
      />
      <div aria-hidden className="flex gap-1.5 sm:gap-2">
        {chars.map((ch, i) => {
          const isActive = focused && i === active && value.length < CODE_LENGTH + 1;
          return (
            <span
              key={i}
              className={cn(
                "grid place-items-center rounded-[5px] border-2 font-display font-bold uppercase tnum transition-colors duration-150",
                size === "lg" ? "h-16 w-12 text-4xl sm:h-[4.5rem] sm:w-14" : "h-12 w-9 text-2xl sm:w-10",
                onCobalt
                  ? "border-white/35 bg-white/10 text-white"
                  : "border-rule-strong bg-panel text-ink",
                ch.trim() && (onCobalt ? "border-white/80 bg-white/15" : "border-ink-3"),
                isActive && (onCobalt ? "border-signal bg-white/20" : "border-cobalt"),
                invalid && "border-stop"
              )}
            >
              {ch.trim()}
            </span>
          );
        })}
      </div>
    </div>
  );
});
