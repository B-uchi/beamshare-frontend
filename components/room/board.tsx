"use client";

import { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Copy,
  Download,
  MessageSquareText,
  X,
} from "lucide-react";
import type { FeedItem, FileItem, TextItem } from "@/lib/hop/client";
import { fileExtension, formatBytes, formatClock, formatEta, formatSpeed } from "@/lib/hop/format";
import { useCopy } from "./invite";
import { cn } from "@/lib/utils";

interface BoardProps {
  feed: FeedItem[];
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel: (id: string) => void;
  onDismiss: (id: string) => void;
  onSaved: (id: string) => void;
  onClearFinished: () => void;
}

const ACTIVE = new Set(["queued", "offered", "incoming", "sending", "receiving"]);

/** Departures (what you send) and arrivals (what you receive) on one board, newest on top. */
export function Board({ feed, onAccept, onDecline, onCancel, onDismiss, onSaved, onClearFinished }: BoardProps) {
  const items = [...feed].reverse();
  const unsaved = feed.filter(
    (i): i is FileItem => i.kind === "file" && i.dir === "in" && i.status === "done" && !!i.url && !i.saved
  );
  const finished = feed.some((i) => i.kind === "text" || !ACTIVE.has(i.status));

  const saveAll = async () => {
    for (const item of unsaved) {
      save(item);
      onSaved(item.id);
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  return (
    <section aria-labelledby="board-title" className="overflow-hidden rounded-[var(--radius-sign)] border border-board-rule bg-board text-board-ink">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-board-rule px-4 py-3 sm:px-5">
        <h2 id="board-title" className="font-display text-xl font-bold tracking-wide">
          Departures &amp; arrivals
        </h2>
        <div className="flex gap-2">
          {unsaved.length > 1 && (
            <button type="button" onClick={() => void saveAll()} className="btn btn-signal btn-sm">
              <Download className="size-4" aria-hidden /> Save all {unsaved.length}
            </button>
          )}
          {finished && (
            <button type="button" onClick={onClearFinished} className="btn btn-board btn-sm">
              Clear finished
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="px-5 py-14 text-center">
          <p className="font-display text-2xl font-bold">No departures yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-board-ink-2">
            Files and text you send or receive show up here with live progress.
          </p>
        </div>
      ) : (
        <>
        <div aria-hidden className="hidden grid-cols-[3.25rem_2.5rem_minmax(0,1fr)_minmax(7rem,10rem)_minmax(8.5rem,auto)] gap-x-4 border-b border-board-rule px-5 py-2 text-xs font-semibold uppercase tracking-widest text-board-ink-2 sm:grid">
          <span>Time</span>
          <span className="col-span-2">Item</span>
          <span>From / To</span>
          <span className="text-right">Status</span>
        </div>
        <ul aria-live="polite" aria-relevant="additions" className="divide-y divide-board-rule">
          {items.map((item) =>
            item.kind === "file" ? (
              <FileRow
                key={item.id}
                item={item}
                onAccept={onAccept}
                onDecline={onDecline}
                onCancel={onCancel}
                onDismiss={onDismiss}
                onSaved={onSaved}
              />
            ) : (
              <TextRow key={item.id} item={item} onDismiss={onDismiss} />
            )
          )}
        </ul>
        </>
      )}
    </section>
  );
}

function save(item: FileItem) {
  if (!item.url) return;
  const a = document.createElement("a");
  a.href = item.url;
  a.download = item.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function FileRow({
  item,
  onAccept,
  onDecline,
  onCancel,
  onDismiss,
  onSaved,
}: {
  item: FileItem;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel: (id: string) => void;
  onDismiss: (id: string) => void;
  onSaved: (id: string) => void;
}) {
  const out = item.dir === "out";
  const moving = item.status === "sending" || item.status === "receiving";
  const pct = item.size ? Math.min(100, Math.floor((item.bytes / item.size) * 100)) : 100;
  const isImage = item.type.startsWith("image/") && item.url;
  const finishing = out && item.status === "sending" && item.bytes >= item.size;

  return (
    <li className="flap-in relative grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 px-4 py-3.5 sm:grid-cols-[3.25rem_2.5rem_minmax(0,1fr)_minmax(7rem,10rem)_minmax(8.5rem,auto)] sm:items-center sm:gap-x-4 sm:px-5">
      <span className="hidden text-sm text-board-ink-2 tnum sm:block">{formatClock(item.createdAt)}</span>

      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.url} alt="" className="row-span-2 size-10 rounded object-cover sm:row-span-1" />
      ) : (
        <span
          aria-hidden
          className="row-span-2 grid size-10 place-items-center rounded bg-board-2 text-[0.625rem] font-bold tracking-wider text-board-ink-2 sm:row-span-1"
        >
          {fileExtension(item.name)}
        </span>
      )}

      <div className="min-w-0">
        <p className="flex items-center gap-1.5 font-semibold">
          {out ? (
            <ArrowUpRight className="size-4 flex-none text-board-ink-2" aria-label="Sending" />
          ) : (
            <ArrowDownLeft className="size-4 flex-none text-signal" aria-label="Receiving" />
          )}
          <span className="truncate" title={item.name}>{item.name}</span>
        </p>
        <p className="mt-0.5 text-sm text-board-ink-2 tnum">
          <span className="sm:hidden">{formatClock(item.createdAt)} · </span>
          {moving && !finishing ? `${formatBytes(item.bytes)} of ${formatBytes(item.size)}` : formatBytes(item.size)}
          <span className="sm:hidden"> · {out ? "to" : "from"} {item.peerName}</span>
        </p>
      </div>

      <p className="hidden min-w-0 truncate text-sm sm:block">
        <span className="text-board-ink-2">{out ? "To " : "From "}</span>
        <span className="font-medium">{item.peerName}</span>
      </p>

      <div className="col-start-2 flex flex-wrap items-center justify-between gap-2 sm:col-start-auto sm:justify-end">
        <Status item={item} pct={pct} finishing={finishing} />
        <Actions item={item} onAccept={onAccept} onDecline={onDecline} onCancel={onCancel} onDismiss={onDismiss} onSaved={onSaved} />
      </div>

      {moving && (
        <div
          role="progressbar"
          aria-label={`${item.name} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="absolute inset-x-0 bottom-0 h-[3px] bg-board-2"
        >
          <div className="h-full bg-signal transition-[width] duration-150 ease-linear" style={{ width: `${pct}%` }} />
        </div>
      )}
    </li>
  );
}

function Status({ item, pct, finishing }: { item: FileItem; pct: number; finishing: boolean }) {
  const out = item.dir === "out";
  switch (item.status) {
    case "queued":
      return <StatusText className="text-board-ink-2">Queued</StatusText>;
    case "offered":
      return <StatusText className="text-board-ink-2">Waiting for {item.peerName}</StatusText>;
    case "incoming":
      return <StatusText className="text-signal">Wants to send</StatusText>;
    case "sending":
    case "receiving": {
      if (finishing) return <StatusText className="text-signal">Confirming…</StatusText>;
      const eta = formatEta(item.size - item.bytes, item.speed);
      return (
        <span className="text-right leading-tight">
          <span className="block text-sm font-bold text-signal tnum">
            {out ? "Sending" : "Receiving"} {pct}%
          </span>
          {item.speed > 0 && (
            <span className="block text-xs text-board-ink-2 tnum">
              {formatSpeed(item.speed)}
              {eta ? ` · ${eta}` : ""}
            </span>
          )}
        </span>
      );
    }
    case "done":
      return <StatusText className="text-board-ink">{out ? "Delivered" : item.saved ? "Saved" : "Arrived"}</StatusText>;
    case "declined":
      return <StatusText className="text-board-ink-2">Declined</StatusText>;
    case "cancelled":
      return <StatusText className="text-board-ink-2" title={item.note}>Cancelled</StatusText>;
    case "failed":
      return (
        <StatusText className="text-board-stop" title={item.note}>
          Failed{item.note ? ` · ${item.note}` : ""}
        </StatusText>
      );
  }
}

function StatusText({ children, className, title }: { children: React.ReactNode; className?: string; title?: string }) {
  return (
    <span title={title} className={cn("max-w-56 truncate text-sm font-bold", className)}>
      {children}
    </span>
  );
}

function Actions({
  item,
  onAccept,
  onDecline,
  onCancel,
  onDismiss,
  onSaved,
}: {
  item: FileItem;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  onCancel: (id: string) => void;
  onDismiss: (id: string) => void;
  onSaved: (id: string) => void;
}) {
  if (item.status === "incoming") {
    return (
      <span className="flex gap-1.5">
        <button type="button" className="btn btn-signal btn-sm" onClick={() => onAccept(item.id)}>
          <Check className="size-4" aria-hidden /> Accept
        </button>
        <button type="button" className="btn btn-board btn-sm" onClick={() => onDecline(item.id)}>
          Decline
        </button>
      </span>
    );
  }
  if (ACTIVE.has(item.status)) {
    return (
      <button type="button" className="btn btn-board btn-icon size-8" onClick={() => onCancel(item.id)} aria-label={`Cancel ${item.name}`}>
        <X className="size-4" aria-hidden />
      </button>
    );
  }
  return (
    <span className="flex gap-1.5">
      {item.dir === "in" && item.status === "done" && item.url && (
        <a
          href={item.url}
          download={item.name}
          onClick={() => onSaved(item.id)}
          className={cn("btn btn-sm", item.saved ? "btn-board" : "btn-signal")}
        >
          <Download className="size-4" aria-hidden /> {item.saved ? "Again" : "Save"}
        </a>
      )}
      <button type="button" className="btn btn-board btn-icon size-8 opacity-70 hover:opacity-100" onClick={() => onDismiss(item.id)} aria-label={`Remove ${item.name} from the board`}>
        <X className="size-4" aria-hidden />
      </button>
    </span>
  );
}

function TextRow({ item, onDismiss }: { item: TextItem; onDismiss: (id: string) => void }) {
  const { copied, copy } = useCopy();
  const [expanded, setExpanded] = useState(false);
  const out = item.dir === "out";
  const long = item.body.length > 280 || item.body.split("\n").length > 4;
  const link = /^https?:\/\/\S+$/.test(item.body.trim()) ? item.body.trim() : null;

  return (
    <li className="flap-in grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 px-4 py-3.5 sm:grid-cols-[3.25rem_2.5rem_minmax(0,1fr)_minmax(7rem,10rem)_minmax(8.5rem,auto)] sm:items-start sm:gap-x-4 sm:px-5">
      <span className="hidden pt-0.5 text-sm text-board-ink-2 tnum sm:block">{formatClock(item.createdAt)}</span>
      <span aria-hidden className="row-span-2 grid size-10 place-items-center rounded bg-board-2 text-board-ink-2 sm:row-span-1">
        <MessageSquareText className="size-4" />
      </span>
      <div className="min-w-0">
        {link ? (
          <a href={link} target="_blank" rel="noreferrer noopener" className="break-all font-medium text-signal underline underline-offset-4">
            {link}
          </a>
        ) : (
          <p className={cn("whitespace-pre-wrap break-words font-medium", !expanded && long && "line-clamp-4")}>{item.body}</p>
        )}
        {long && !link && (
          <button type="button" className="mt-1 text-sm font-semibold text-board-ink-2 underline underline-offset-4 hover:text-board-ink" onClick={() => setExpanded((v) => !v)}>
            {expanded ? "Show less" : "Show all"}
          </button>
        )}
        <p className="mt-0.5 text-sm text-board-ink-2 tnum sm:hidden">
          {formatClock(item.createdAt)} · {out ? "To" : "From"} {item.peerName}
        </p>
      </div>
      <p className="hidden min-w-0 truncate pt-0.5 text-sm sm:block">
        <span className="text-board-ink-2">{out ? "To " : "From "}</span>
        <span className="font-medium">{item.peerName}</span>
      </p>
      <div className="col-start-2 flex items-center justify-end gap-1.5 sm:col-start-auto">
        <button type="button" className={cn("btn btn-sm", out ? "btn-board" : "btn-signal")} onClick={() => void copy(item.body)}>
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
        <button type="button" className="btn btn-board btn-icon size-8 opacity-70 hover:opacity-100" onClick={() => onDismiss(item.id)} aria-label="Remove text from the board">
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}
