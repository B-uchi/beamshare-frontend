"use client";

import { useId, useRef, useState } from "react";
import { ArrowUp, Paperclip } from "lucide-react";
import type { Member } from "@/lib/hop/protocol";
import { cn } from "@/lib/utils";

interface ComposerProps {
  others: Member[];
  ready: Set<string>;
  to: string;
  onToChange: (to: string) => void;
  onFiles: (files: File[]) => void;
  onText: (text: string) => boolean;
}

export function Composer({ others, ready, to, onToChange, onFiles, onText }: ComposerProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const toId = useId();
  const textId = useId();

  const targets = to === "all" ? others : others.filter((m) => m.id === to);
  const anyReady = targets.some((m) => ready.has(m.id));
  const waitingOn = targets.filter((m) => !ready.has(m.id)).map((m) => m.name);

  const sendText = () => {
    if (onText(text)) setText("");
  };

  return (
    <section aria-label="Send" className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-rule px-4 py-3 sm:px-5">
        <label htmlFor={toId} className="text-sm font-semibold text-ink-2">Send to</label>
        <select
          id={toId}
          value={to}
          onChange={(e) => onToChange(e.target.value)}
          className="field h-9 w-auto min-w-40 py-0 pr-8 text-sm font-semibold"
        >
          <option value="all">Everyone ({others.length})</option>
          {others.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
              {m.online ? "" : " (offline)"}
            </option>
          ))}
        </select>
        {waitingOn.length > 0 && (
          <p className="flex items-center gap-2 text-sm text-ink-2">
            <span aria-hidden className="live-dot size-2 rounded-full bg-signal" />
            Linking with {listNames(waitingOn)}… files will queue until then.
          </p>
        )}
      </div>

      <div className="p-4 sm:p-5">
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) onFiles(files);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={targets.length === 0}
          className="group flex w-full items-center gap-4 rounded-md border-2 border-dashed border-rule-strong bg-panel-2 px-5 py-6 text-left transition-colors hover:border-cobalt hover:bg-cobalt-tint disabled:cursor-not-allowed disabled:opacity-50 sm:py-8"
        >
          <span className="picto size-12 transition-transform duration-200 group-hover:-translate-y-0.5">
            <Paperclip className="size-6" aria-hidden />
          </span>
          <span>
            <span className="block text-lg font-bold leading-tight">Choose files</span>
            <span className="mt-0.5 block text-sm text-ink-2">
              or drop them anywhere on this page, or paste with{" "}
              <kbd className="rounded border border-rule bg-panel px-1 font-sans text-xs">Ctrl/⌘ V</kbd>
            </span>
          </span>
        </button>

        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            sendText();
          }}
        >
          <label htmlFor={textId} className="sr-only">Text to send</label>
          <div
            className={cn(
              "flex items-end gap-2 rounded-md border border-rule-strong bg-panel p-1.5 pl-3 transition-colors focus-within:border-cobalt focus-within:shadow-[0_0_0_3px_color-mix(in_oklab,var(--cobalt)_25%,transparent)]"
            )}
          >
            <textarea
              id={textId}
              rows={1}
              value={text}
              placeholder="Send a link, a note, an address…"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  sendText();
                }
              }}
              className="max-h-40 min-h-9 flex-1 resize-none bg-transparent py-1.5 text-base outline-none [field-sizing:content] placeholder:text-ink-3"
            />
            <button
              type="submit"
              className="btn btn-primary btn-icon"
              disabled={!text.trim() || !anyReady}
              aria-label="Send text"
            >
              <ArrowUp className="size-5" aria-hidden />
            </button>
          </div>
          <p className="mt-1.5 text-xs text-ink-3">Enter to send · Shift + Enter for a new line</p>
        </form>
      </div>
    </section>
  );
}

function listNames(names: string[]) {
  if (names.length <= 2) return names.join(" and ");
  return `${names.slice(0, 2).join(", ")} and ${names.length - 2} more`;
}
