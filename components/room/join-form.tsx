"use client";

import { useRef, useState } from "react";
import { useHydrated } from "@/hooks/use-hydrated";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { CodeInput } from "@/components/ui/code-input";
import { getHopClient } from "@/hooks/use-hop";
import { HopError } from "@/lib/hop/client";
import { CODE_LENGTH, normalizeCode } from "@/lib/hop/protocol";

const MESSAGES: Record<string, string> = {
  not_found: "No room with that code. Check it with the host, or it may have ended.",
  locked: "The host has locked this room. Ask them to unlock it.",
  full: "This room is full.",
};

/** Code + name in one step. With `fixedCode`, it's the gate for a shared /r/CODE link. */
export function JoinForm({ fixedCode, notice }: { fixedCode?: string; notice?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const [code, setCode] = useState(fixedCode ?? normalizeCode(params.get("code") ?? ""));
  const [nameDraft, setName] = useState<string | null>(null);
  const hydrated = useHydrated();
  const name = nameDraft ?? (hydrated ? getHopClient().name : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (code.length !== CODE_LENGTH || busy) return;
    setBusy(true);
    setError(null);
    const client = getHopClient();
    const clean = name.trim() || client.name;
    client.setName(clean);
    try {
      const joined = await client.join(code, clean);
      if (!fixedCode) router.push(`/r/${joined}`);
    } catch (err) {
      const e = err instanceof HopError ? err : new HopError("internal", "Couldn't join. Try again.");
      setError({ code: e.code, message: MESSAGES[e.code] ?? e.message });
      setBusy(false);
    }
  };

  return (
    <form
      className="w-full max-w-md"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="sign sign-tight px-7 pb-7 pt-6">
        {fixedCode ? (
          <h1 className="pt-1">
            <span className="block font-display text-6xl font-bold tracking-[0.08em] tnum">{fixedCode}</span>
            <span className="mt-2 block text-lg font-semibold text-cobalt-ink-2">You&rsquo;re invited to board this room</span>
          </h1>
        ) : (
          <div className="pt-1">
            <h1 className="mb-4 text-3xl font-bold">Join a room</h1>
            <CodeInput
              id="join-code"
              tone="cobalt"
              size="lg"
              value={code}
              autoFocus
              invalid={error?.code === "not_found"}
              onChange={(v) => {
                setCode(v);
                setError(null);
              }}
              onComplete={() => nameRef.current?.focus()}
            />
          </div>
        )}
      </div>

      <div className="panel mt-3 space-y-5 p-7">
        {notice && <p className="rounded-md bg-cobalt-tint px-3 py-2 text-sm text-ink">{notice}</p>}
        <div>
          <label htmlFor="join-name" className="label">Your name</label>
          <input
            ref={nameRef}
            id="join-name"
            className="field"
            value={name}
            maxLength={32}
            autoComplete="nickname"
            onChange={(e) => setName(e.target.value)}
          />
          <p className="mt-1.5 text-sm text-ink-3">This is how others in the room see you.</p>
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-stop-tint px-3 py-2 text-sm font-medium text-stop">
            {error.message}
          </p>
        )}

        <button type="submit" className="btn btn-signal btn-lg w-full" disabled={busy || code.length !== CODE_LENGTH}>
          {busy ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
          {busy ? "Boarding…" : "Join room"}
          {!busy && <ArrowRight className="size-5" aria-hidden />}
        </button>
      </div>
    </form>
  );
}
