"use client";

import { useState } from "react";
import { Check, Pencil, X } from "lucide-react";
import type { Member } from "@/lib/hop/protocol";
import type { LinkInfo } from "@/lib/hop/mesh";
import { cn } from "@/lib/utils";

interface LineMapProps {
  members: Member[];
  selfId: string;
  hostId: string;
  links: Record<string, LinkInfo>;
  isHost: boolean;
  ended?: boolean;
  onRemove: (member: Member) => void;
  onRename: (name: string) => void;
}

/** People as stops on a line. You're the yellow stop; the host is the interchange. */
export function LineMap({ members, selfId, hostId, links, isHost, ended, onRemove, onRename }: LineMapProps) {
  const ordered = [...members].sort((a, b) => {
    if (a.id === selfId) return -1;
    if (b.id === selfId) return 1;
    return a.joinedAt.localeCompare(b.joinedAt);
  });

  return (
    <ol className="relative" aria-label="People in this room">
      <span aria-hidden className="absolute bottom-5 left-[13px] top-5 w-1.5 rounded-full bg-cobalt" />
      {ordered.map((m) => (
        <Stop
          key={m.id}
          member={m}
          self={m.id === selfId}
          host={m.id === hostId}
          link={links[m.id]}
          ended={ended}
          canRemove={isHost && m.id !== selfId}
          onRemove={() => onRemove(m)}
          onRename={onRename}
        />
      ))}
      {ordered.length === 1 && (
        <li className="relative flex items-center gap-4 py-3 pl-0">
          <span aria-hidden className="relative z-10 grid size-8 flex-none place-items-center">
            <span className="size-6 rounded-full border-[3px] border-dashed border-rule-strong bg-panel" />
          </span>
          <span className="text-ink-3">Next stop: whoever you invite</span>
        </li>
      )}
    </ol>
  );
}

function Stop({
  member,
  self,
  host,
  link,
  ended,
  canRemove,
  onRemove,
  onRename,
}: {
  member: Member;
  self: boolean;
  host: boolean;
  link?: LinkInfo;
  ended?: boolean;
  canRemove: boolean;
  onRemove: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(member.name);
  const status = ended
    ? { label: self ? "This device" : "Disconnected", tone: "text-ink-3" }
    : statusFor(member, self, link);

  return (
    <li className="group relative flex items-start gap-4 py-3">
      <span aria-hidden className="relative z-10 grid size-8 flex-none place-items-center">
        <span
          className={cn(
            "grid size-7 place-items-center rounded-full border-[5px] bg-panel",
            member.online ? "border-cobalt" : "border-dashed border-rule-strong"
          )}
        >
          {self && <span className="size-2 rounded-full bg-signal" />}
        </span>
        {host && <span className="absolute inset-[-3px] rounded-full border-2 border-cobalt" />}
      </span>

      <div className="min-w-0 flex-1 pt-0.5">
        {editing ? (
          <form
            className="flex items-center gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (draft.trim()) onRename(draft.trim());
              setEditing(false);
            }}
          >
            <input
              autoFocus
              aria-label="Your name"
              className="field h-8 px-2 text-sm"
              value={draft}
              maxLength={32}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
            />
            <button type="submit" className="btn btn-primary btn-icon size-8" aria-label="Save name">
              <Check className="size-4" aria-hidden />
            </button>
          </form>
        ) : (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 leading-tight">
            <span className={cn("break-words font-semibold", !member.online && "text-ink-3")}>{member.name}</span>
            {self && <Tag>You</Tag>}
            {host && <Tag tone="cobalt">Host</Tag>}
          </p>
        )}
        <p className={cn("mt-1 flex items-center gap-1.5 text-sm", status.tone)}>
          {status.lamp && <span aria-hidden className="size-2 rounded-full bg-signal ring-2 ring-signal/30" />}
          {status.label}
        </p>
      </div>

      {self && !editing && !ended && (
        <button
          type="button"
          onClick={() => {
            setDraft(member.name);
            setEditing(true);
          }}
          className="btn btn-ghost btn-icon size-8 opacity-60 hover:opacity-100 focus-visible:opacity-100"
          aria-label="Change your name"
        >
          <Pencil className="size-3.5" aria-hidden />
        </button>
      )}
      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="btn btn-ghost btn-icon size-8 opacity-0 hover:text-stop focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-60"
          aria-label={`Remove ${member.name}`}
        >
          <X className="size-4" aria-hidden />
        </button>
      )}
    </li>
  );
}

function Tag({ children, tone = "plain" }: { children: React.ReactNode; tone?: "plain" | "cobalt" }) {
  return (
    <span
      className={cn(
        "rounded-[3px] px-1.5 py-0.5 text-[0.6875rem] font-bold uppercase leading-none tracking-wider",
        tone === "cobalt" ? "bg-cobalt text-cobalt-ink" : "bg-signal text-signal-ink"
      )}
    >
      {children}
    </span>
  );
}

function statusFor(member: Member, self: boolean, link?: LinkInfo): { label: string; tone: string; lamp?: boolean } {
  if (self) return { label: "This device", tone: "text-ink-3" };
  if (!member.online) return { label: "Offline · holding their seat", tone: "text-ink-3" };
  if (!link || link.state === "connecting") return { label: "Connecting…", tone: "text-ink-2" };
  if (link.state === "failed") return { label: "Link dropped · retrying", tone: "text-stop" };
  return link.route === "relay"
    ? { label: "Connected via relay", tone: "text-ink-2", lamp: true }
    : { label: "Direct link", tone: "text-ink-2", lamp: true };
}
