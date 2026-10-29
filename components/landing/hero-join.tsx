"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { CodeInput } from "@/components/ui/code-input";
import { CODE_LENGTH } from "@/lib/hop/protocol";

export function HeroJoin() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const ready = code.length === CODE_LENGTH;

  const board = (value = code) => {
    if (value.length === CODE_LENGTH) router.push(`/r/${value}`);
  };

  return (
    <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:gap-10">
      <Link href="/new" className="btn btn-signal btn-lg w-full text-lg sm:w-auto">
        Start a room <ArrowRight className="size-5" aria-hidden />
      </Link>
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          board();
        }}
      >
        <label htmlFor="hero-code" className="block text-sm font-semibold text-cobalt-ink-2">
          Have a code? Board here
        </label>
        <div className="flex items-center gap-2">
          <CodeInput id="hero-code" tone="cobalt" value={code} onChange={setCode} onComplete={board} />
          <button type="submit" disabled={!ready} className="btn btn-cobalt-ghost btn-icon h-12 w-12" aria-label="Join room">
            <ArrowRight className="size-5" aria-hidden />
          </button>
        </div>
      </form>
    </div>
  );
}
