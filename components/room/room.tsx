"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Download } from "lucide-react";
import { toast } from "sonner";
import type { HopState } from "@/lib/hop/client";
import type { EndReason, Member } from "@/lib/hop/protocol";
import { getHopClient } from "@/hooks/use-hop";
import { Dialog } from "@/components/ui/dialog";
import { RoomHeader } from "./room-header";
import { InviteSign } from "./invite";
import { LineMap } from "./line-map";
import { Composer } from "./composer";
import { Board } from "./board";

const ENDED_COPY: Record<EndReason, { title: string; body: string }> = {
  "host-ended": { title: "The host ended this room", body: "No one can send or join any more." },
  "host-timeout": {
    title: "This room closed",
    body: "The host was disconnected for too long, so the room shut down.",
  },
  kicked: { title: "You were removed from this room", body: "The host removed you." },
  left: { title: "You left this room", body: "You're no longer connected to anyone in it." },
  replaced: {
    title: "This room is open in another tab",
    body: "You rejoined from somewhere else, so this tab was disconnected.",
  },
  expired: { title: "This room has ended", body: "It closed while you were away." },
};

export function Room({ state }: { state: HopState }) {
  const client = getHopClient();
  const router = useRouter();
  const room = state.room!;
  const selfId = state.selfId!;
  const ended = state.phase === "ended";
  const isHost = room.hostId === selfId;

  const others = useMemo(() => room.members.filter((m) => m.id !== selfId), [room.members, selfId]);
  const ready = useMemo(
    () => new Set(others.filter((m) => state.links[m.id]?.state === "connected").map((m) => m.id)),
    [others, state.links]
  );

  const [chosenTo, setTo] = useState("all");
  // A recipient who left falls back to everyone.
  const to = chosenTo === "all" || others.some((m) => m.id === chosenTo) ? chosenTo : "all";
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragDepth = useRef(0);

  // Close the invite dialog when someone boards.
  const [seenCount, setSeenCount] = useState(others.length);
  if (others.length !== seenCount) {
    setSeenCount(others.length);
    if (others.length > seenCount) setInviteOpen(false);
  }

  const sendFiles = (files: File[]) => {
    if (ended || !files.length) return;
    if (!others.length) {
      toast("Invite someone first", { description: "Files need somewhere to go." });
      return;
    }
    const recipients = client.sendFiles(files, to);
    if (recipients) {
      const target = to === "all" ? (recipients > 1 ? `${recipients} people` : others[0].name) : others.find((m) => m.id === to)?.name;
      toast(`${files.length === 1 ? files[0].name : `${files.length} files`} queued for ${target}`);
    }
  };

  // Drop files anywhere, paste files from the clipboard.
  useEffect(() => {
    if (ended) return;
    const hasFiles = (e: DragEvent) => Array.from(e.dataTransfer?.types ?? []).includes("Files");
    const onEnter = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current++;
      setDragging(true);
    };
    const onOver = (e: DragEvent) => {
      if (hasFiles(e)) e.preventDefault();
    };
    const onLeave = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragging(false);
    };
    const onDrop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      sendFiles(Array.from(e.dataTransfer?.files ?? []));
    };
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (!files.length) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("textarea, input")) return;
      e.preventDefault();
      sendFiles(files);
    };
    window.addEventListener("dragenter", onEnter);
    window.addEventListener("dragover", onOver);
    window.addEventListener("dragleave", onLeave);
    window.addEventListener("drop", onDrop);
    window.addEventListener("paste", onPaste);
    return () => {
      window.removeEventListener("dragenter", onEnter);
      window.removeEventListener("dragover", onOver);
      window.removeEventListener("dragleave", onLeave);
      window.removeEventListener("drop", onDrop);
      window.removeEventListener("paste", onPaste);
    };
  });

  const recipientLabel = to === "all" ? "everyone" : others.find((m) => m.id === to)?.name ?? "everyone";
  const unsaved = state.feed.filter((i) => i.kind === "file" && i.dir === "in" && i.status === "done" && !i.saved).length;
  const endedCopy = state.ended ? ENDED_COPY[state.ended] : null;

  const leaveConfirmed = () => {
    setConfirmLeave(false);
    if (isHost) client.end();
    else client.leave();
  };

  return (
    <div className="min-h-dvh bg-ground">
      <RoomHeader
        code={room.code}
        isHost={isHost}
        locked={room.locked}
        ended={ended}
        connection={state.connection}
        onInvite={() => setInviteOpen(true)}
        onLock={(locked) => client.lock(locked)}
        onLeave={() => setConfirmLeave(true)}
      />

      {endedCopy && (
        <div className="border-b border-rule bg-board text-board-ink" role="status">
          <div className="mx-auto flex max-w-[90rem] flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <p className="font-display text-2xl font-bold">{endedCopy.title}</p>
              <p className="mt-1 text-board-ink-2">
                {endedCopy.body}
                {unsaved > 0 && (
                  <>
                    {" "}
                    <span className="font-semibold text-signal">
                      {unsaved} received file{unsaved === 1 ? " is" : "s are"} still here. Save before you leave this page.
                    </span>
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn btn-signal"
                onClick={() => {
                  client.reset();
                  router.push("/new");
                }}
              >
                Start a new room <ArrowRight className="size-4" aria-hidden />
              </button>
              <Link href="/" className="btn btn-board" onClick={() => client.reset()}>
                Back home
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto grid max-w-[90rem] gap-5 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-6">
        <aside className="order-2 space-y-5 lg:order-none lg:sticky lg:top-[5.5rem] lg:self-start">
          <section aria-labelledby="people-title" className="panel p-4 sm:p-5">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 id="people-title" className="text-lg font-bold">On this line</h2>
              {!ended && (
                <span className="text-sm text-ink-3 tnum">
                  {room.members.filter((m) => m.online).length}/{room.members.length} online
                </span>
              )}
            </div>
            <LineMap
              members={room.members}
              selfId={selfId}
              hostId={room.hostId}
              links={state.links}
              isHost={isHost && !ended}
              ended={ended}
              onRemove={setRemoving}
              onRename={(name) => client.setName(name)}
            />
          </section>

          <section aria-labelledby="prefs-title" className="panel p-4 sm:p-5">
            <h2 id="prefs-title" className="sr-only">Preferences</h2>
            <label className="flex cursor-pointer items-start justify-between gap-4">
              <span>
                <span className="block font-semibold">Accept files automatically</span>
                <span className="mt-0.5 block text-sm text-ink-2">
                  {state.settings.autoAccept ? "Incoming files start right away." : "You'll approve each file first."}
                </span>
              </span>
              <Switch
                checked={state.settings.autoAccept}
                onChange={(autoAccept) => client.setSettings({ autoAccept })}
              />
            </label>
          </section>
        </aside>

        <main className="order-1 min-w-0 space-y-5 lg:order-none">
          {!ended && others.length === 0 && (
            <section aria-label="Invite people" className="space-y-3">
              <InviteSign code={room.code} />
              <p className="flex items-center gap-2 px-1 text-ink-2">
                <span aria-hidden className="live-dot size-2 rounded-full bg-signal" />
                Waiting for someone to board. Keep this tab open.
              </p>
            </section>
          )}

          {!ended && others.length > 0 && (
            <Composer
              others={others}
              ready={ready}
              to={to}
              onToChange={setTo}
              onFiles={sendFiles}
              onText={(text) => client.sendText(text, to)}
            />
          )}

          <Board
            feed={state.feed}
            onAccept={(id) => client.accept(id)}
            onDecline={(id) => client.decline(id)}
            onCancel={(id) => client.cancel(id)}
            onDismiss={(id) => client.dismiss(id)}
            onSaved={(id) => client.markSaved(id)}
            onClearFinished={() => client.clearFinished()}
          />
        </main>
      </div>

      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center bg-[rgb(10_13_20/0.45)] p-6">
          <div className="sign flex flex-col items-center gap-3 px-12 py-10 text-center">
            <Download className="size-10" aria-hidden />
            <p className="font-display text-4xl font-bold">Drop to send</p>
            <p className="text-cobalt-ink-2">to {recipientLabel}</p>
          </div>
        </div>
      )}

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite people" className="w-[min(100vw-2rem,34rem)]">
        <InviteSign code={room.code} compact />
      </Dialog>

      <Dialog
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title={isHost ? "End this room for everyone?" : "Leave this room?"}
      >
        <p className="text-ink-2">
          {isHost
            ? "Everyone is disconnected and transfers in progress stop. The code stops working."
            : "Transfers in progress stop. You can rejoin with the code while the room is open."}
        </p>
        {unsaved > 0 && (
          <p className="mt-3 rounded-md bg-cobalt-tint px-3 py-2 text-sm text-ink">
            You&rsquo;ll still be able to save the {unsaved} file{unsaved === 1 ? "" : "s"} you received.
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-outline" onClick={() => setConfirmLeave(false)}>
            Stay
          </button>
          <button type="button" className="btn btn-danger" onClick={leaveConfirmed}>
            {isHost ? "End room" : "Leave room"}
          </button>
        </div>
      </Dialog>

      <Dialog open={!!removing} onClose={() => setRemoving(null)} title={`Remove ${removing?.name ?? ""}?`}>
        <p className="text-ink-2">
          They&rsquo;ll be disconnected right away. They can rejoin with the code unless you lock the room.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" className="btn btn-outline" onClick={() => setRemoving(null)}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (removing) client.kick(removing.id);
              setRemoving(null);
            }}
          >
            Remove
          </button>
        </div>
      </Dialog>
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <span className="relative mt-0.5 inline-flex flex-none">
      <input
        type="checkbox"
        role="switch"
        className="peer absolute inset-0 z-10 cursor-pointer opacity-0"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className="h-6 w-11 rounded-full border-2 border-rule-strong bg-panel-2 transition-colors duration-150 peer-checked:border-cobalt peer-checked:bg-cobalt peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-signal"
      />
      <span
        aria-hidden
        className="absolute left-1 top-1 size-4 rounded-full bg-ink-3 transition-transform duration-150 ease-out peer-checked:translate-x-5 peer-checked:bg-white"
      />
    </span>
  );
}
