import { Mesh, type LinkInfo } from "./mesh";
import { Signaling, type SignalingStatus } from "./signaling";
import type {
  EndReason,
  ErrorCode,
  Member,
  PeerMessage,
  RoomEvent,
  RoomSnapshot,
  ServerMessage,
} from "./protocol";
import { randomName } from "./names";

/* -----------------------------------------------------------
   Public state
------------------------------------------------------------ */

export type FileStatus =
  | "queued" // waiting behind another file to the same person
  | "offered" // sent the offer, waiting for them to accept
  | "incoming" // they offered, waiting for us to accept
  | "sending"
  | "receiving"
  | "done"
  | "declined"
  | "cancelled"
  | "failed";

export interface FileItem {
  kind: "file";
  id: string;
  dir: "out" | "in";
  peerId: string;
  peerName: string;
  name: string;
  size: number;
  type: string;
  status: FileStatus;
  bytes: number;
  /** bytes per second, smoothed */
  speed: number;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  url?: string;
  saved?: boolean;
  note?: string;
}

export interface TextItem {
  kind: "text";
  id: string;
  dir: "out" | "in";
  /** null when sent to everyone */
  peerId: string | null;
  peerName: string;
  body: string;
  createdAt: number;
}

export type FeedItem = FileItem | TextItem;

export interface Settings {
  autoAccept: boolean;
}

export type Phase = "idle" | "connecting" | "in-room" | "ended";

export interface HopState {
  connection: SignalingStatus;
  phase: Phase;
  room: RoomSnapshot | null;
  selfId: string | null;
  links: Record<string, LinkInfo>;
  feed: FeedItem[];
  ended: EndReason | null;
  settings: Settings;
}

export interface Notice {
  tone: "info" | "success" | "warning" | "error";
  title: string;
  description?: string;
  id?: string;
}

export class HopError extends Error {
  constructor(
    public code: ErrorCode,
    message: string
  ) {
    super(message);
  }
}

/* -----------------------------------------------------------
   Internals
------------------------------------------------------------ */

interface StoredSession {
  code: string;
  id: string;
  key: string;
}

type Decision = "accept" | "decline" | "cancel" | "closed";

interface OutJob {
  item: FileItem;
  file: File;
  cancelled: boolean;
  decide?: (d: Decision) => void;
}

interface InFlight {
  item: FileItem;
  chunks: ArrayBuffer[];
}

interface Intent {
  msg: { t: "create"; name: string } | { t: "join"; code: string; name: string };
  resolve: (code: string) => void;
  reject: (err: HopError) => void;
}

const SESSION_KEY = "hop:session";
const NAME_KEY = "hop:name";
const SETTINGS_KEY = "hop:settings";
const CHUNK_SIZE = 64 * 1024;
const HIGH_WATER = 8 * 1024 * 1024;
const MAX_TEXT = 10_000;
const INTENT_TIMEOUT = 15_000;

const WS_URL = process.env.NEXT_PUBLIC_WS_SERVER_URL || "ws://localhost:8080";

/* -----------------------------------------------------------
   Client
------------------------------------------------------------ */

export class HopClient {
  private state: HopState;
  private snapshot: HopState;
  private listeners = new Set<() => void>();
  private noticeListeners = new Set<(n: Notice) => void>();
  private emitTimer: ReturnType<typeof setTimeout> | null = null;

  private signaling = new Signaling(WS_URL);
  private mesh: Mesh;
  private intent: Intent | null = null;
  private intentTimer: ReturnType<typeof setTimeout> | null = null;
  private wasDisconnected = false;

  private outQueues = new Map<string, OutJob[]>();
  private pumping = new Set<string>();
  private inFlight = new Map<string, InFlight>();
  private speedSamples = new Map<string, { at: number; bytes: number }>();

  constructor() {
    this.state = {
      connection: "idle",
      phase: "idle",
      room: null,
      selfId: null,
      links: {},
      feed: [],
      ended: null,
      settings: readJSON<Settings>(SETTINGS_KEY) ?? { autoAccept: true },
    };
    this.snapshot = this.state;

    this.mesh = new Mesh({
      signal: (to, data) => this.signaling.send({ t: "signal", to, data }),
      onLinkChange: (peerId, info) => {
        const links = { ...this.state.links };
        if (info) links[peerId] = info;
        else delete links[peerId];
        this.state.links = links;
        this.commit();
      },
      onChannelOpen: (peerId) => void this.pump(peerId),
      onChannelClose: (peerId) => this.handleChannelClose(peerId),
      onMessage: (peerId, data) => this.handlePeerData(peerId, data),
    });

    this.signaling.on("status", (connection) => {
      if (connection !== "open" && this.state.phase === "in-room") this.wasDisconnected = true;
      this.state.connection = connection;
      this.commit();
    });
    this.signaling.on("ice", (servers) => {
      if (servers?.length) this.mesh.iceServers = servers;
    });
    this.signaling.on("open", () => this.handleOpen());
    this.signaling.on("message", (msg) => this.handleServer(msg));

    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", (e) => {
        if (this.hasActiveTransfers() || this.hasUnsavedFiles()) e.preventDefault();
      });
    }
  }

  /* ---------- store ---------- */

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => void this.listeners.delete(fn);
  };

  getSnapshot = () => this.snapshot;

  onNotice(fn: (n: Notice) => void) {
    this.noticeListeners.add(fn);
    return () => void this.noticeListeners.delete(fn);
  }

  /** Emit now: structural changes. */
  private commit() {
    if (this.emitTimer) clearTimeout(this.emitTimer);
    this.emitTimer = null;
    this.snapshot = { ...this.state, feed: this.state.feed.map((i) => ({ ...i })) };
    for (const fn of this.listeners) fn();
  }

  /** Emit soon: high-frequency progress updates. */
  private touch() {
    if (this.emitTimer) return;
    this.emitTimer = setTimeout(() => this.commit(), 150);
  }

  private notify(n: Notice) {
    for (const fn of this.noticeListeners) fn(n);
  }

  /* ---------- identity & settings ---------- */

  get name(): string {
    if (typeof window === "undefined") return "";
    let name = safeStorage(() => localStorage.getItem(NAME_KEY));
    if (!name) {
      name = randomName();
      safeStorage(() => localStorage.setItem(NAME_KEY, name!));
    }
    return name;
  }

  setName(name: string) {
    const clean = name.replace(/\s+/g, " ").trim().slice(0, 32);
    if (!clean) return;
    safeStorage(() => localStorage.setItem(NAME_KEY, clean));
    if (this.state.phase === "in-room") this.signaling.send({ t: "rename", name: clean });
  }

  setSettings(patch: Partial<Settings>) {
    this.state.settings = { ...this.state.settings, ...patch };
    safeStorage(() => localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.state.settings)));
    this.commit();
  }

  /** The room this tab can rejoin after a refresh, if any. */
  storedRoom(): string | null {
    return readSession(SESSION_KEY)?.code ?? null;
  }

  /* ---------- room lifecycle ---------- */

  /** Called once on app load: resumes a room this tab was in before a refresh. */
  resumeIfStored() {
    if (this.state.phase !== "idle") return;
    if (!readSession(SESSION_KEY)) return;
    this.state.phase = "connecting";
    this.commit();
    this.signaling.start();
  }

  create(name = this.name): Promise<string> {
    return this.runIntent({ t: "create", name });
  }

  join(code: string, name = this.name): Promise<string> {
    return this.runIntent({ t: "join", code, name });
  }

  leave() {
    if (!this.signaling.send({ t: "leave" })) this.finish("left");
  }

  end() {
    if (!this.signaling.send({ t: "end" })) this.finish("host-ended");
  }

  lock(locked: boolean) {
    this.signaling.send({ t: "lock", locked });
  }

  kick(id: string) {
    this.signaling.send({ t: "kick", id });
  }

  /** Clear an ended room so the tab can start fresh. */
  reset() {
    for (const item of this.state.feed) {
      if (item.kind === "file" && item.url) URL.revokeObjectURL(item.url);
    }
    this.state.feed = [];
    this.state.room = null;
    this.state.selfId = null;
    this.state.ended = null;
    this.state.links = {};
    this.state.phase = "idle";
    this.commit();
  }

  private runIntent(msg: Intent["msg"]): Promise<string> {
    this.intent?.reject(new HopError("invalid", "Superseded by a newer request"));
    if (this.state.phase === "ended") this.reset();

    return new Promise((resolve, reject) => {
      this.intent = { msg, resolve, reject };
      if (this.intentTimer) clearTimeout(this.intentTimer);
      this.intentTimer = setTimeout(() => {
        if (!this.intent || this.intent.msg !== msg) return;
        this.intent = null;
        reject(new HopError("unreachable", "Couldn't reach the Hop server. Check your connection and try again."));
      }, INTENT_TIMEOUT);

      this.signaling.start();
      if (this.signaling.isOpen) this.signaling.send(msg);
    });
  }

  private handleOpen() {
    if (this.intent) {
      this.signaling.send(this.intent.msg);
      return;
    }
    const stored = readSession(SESSION_KEY);
    if (stored && this.state.phase !== "ended") {
      this.signaling.send({ t: "resume", ...stored });
    } else if (this.state.phase !== "in-room") {
      // Nothing to do on this connection; don't hold a socket open on the landing page.
      this.signaling.stop();
    }
  }

  /* ---------- server messages ---------- */

  private handleServer(msg: ServerMessage) {
    switch (msg.t) {
      case "joined":
        return this.handleJoined(msg.room, msg.self, msg.resumed);
      case "room":
        return this.handleRoom(msg.room, msg.event);
      case "signal":
        return void this.mesh.handleSignal(msg.from, msg.data);
      case "ended":
        return this.finish(msg.reason);
      case "error":
        return this.handleError(msg.code, msg.message);
    }
  }

  private handleJoined(room: RoomSnapshot, self: { id: string; key: string }, resumed: boolean) {
    writeSession(SESSION_KEY, { code: room.code, id: self.id, key: self.key });

    const intent = this.intent;
    this.intent = null;
    if (this.intentTimer) clearTimeout(this.intentTimer);

    const switchedRooms = this.state.room && this.state.room.code !== room.code;
    if (switchedRooms) this.reset();

    this.state.room = room;
    this.state.selfId = self.id;
    this.state.phase = "in-room";
    this.state.ended = null;
    this.mesh.selfId = self.id;
    this.mesh.setPeers(room.members, { dial: true });
    this.commit();

    if (resumed && this.wasDisconnected) {
      this.notify({ tone: "success", title: "Back online", id: "connection" });
    }
    this.wasDisconnected = false;
    intent?.resolve(room.code);
  }

  private handleRoom(room: RoomSnapshot, event?: RoomEvent) {
    const before = new Map((this.state.room?.members ?? []).map((m) => [m.id, m]));
    this.state.room = room;
    this.mesh.setPeers(room.members, { dial: false });

    const present = new Set(room.members.map((m) => m.id));
    for (const id of before.keys()) {
      if (!present.has(id)) this.dropPeer(id, `${before.get(id)!.name} left the room`);
    }
    this.commit();

    if (!event || event.id === this.state.selfId) return;
    const name = event.name ?? "Someone";
    const isHost = event.id === room.hostId;
    switch (event.kind) {
      case "joined":
        this.notify({ tone: "info", title: `${name} joined` });
        break;
      case "left":
        this.notify({ tone: "info", title: `${name} left` });
        break;
      case "removed":
        this.notify({ tone: "info", title: `${name} was removed` });
        break;
      case "offline":
        if (isHost) {
          this.notify({
            tone: "warning",
            title: "The host lost connection",
            description: "The room stays open while they reconnect.",
            id: "host-offline",
          });
        }
        break;
      case "online":
        if (isHost) this.notify({ tone: "success", title: "The host is back", id: "host-offline" });
        break;
      case "locked":
        this.notify({ tone: "info", title: "Room locked", description: "No one new can join." });
        break;
      case "unlocked":
        this.notify({ tone: "info", title: "Room unlocked" });
        break;
    }
  }

  private handleError(code: ErrorCode, message: string) {
    if (code === "resume_failed") {
      clearSession(SESSION_KEY);
      this.finish("expired");
      return;
    }
    if (this.intent) {
      const { reject } = this.intent;
      this.intent = null;
      if (this.intentTimer) clearTimeout(this.intentTimer);
      if (this.state.phase !== "in-room") this.signaling.stop();
      reject(new HopError(code, message));
      return;
    }
    this.notify({ tone: "error", title: message });
  }

  private finish(reason: EndReason) {
    clearSession(SESSION_KEY);
    this.intent = null;
    this.mesh.closeAll();
    for (const [peerId] of this.outQueues) this.dropPeer(peerId, "The room ended");
    for (const [peerId] of this.inFlight) this.dropPeer(peerId, "The room ended");
    this.state.phase = "ended";
    this.state.ended = reason;
    this.state.links = {};
    this.signaling.stop();
    this.commit();
  }

  /* ---------- sending ---------- */

  /** Queue files for each recipient. `to` is a member id or "all". */
  sendFiles(files: File[], to: string): number {
    const targets = this.recipients(to);
    if (!targets.length || !files.length) return 0;

    for (const member of targets) {
      const queue = this.outQueues.get(member.id) ?? [];
      for (const file of files) {
        const item: FileItem = {
          kind: "file",
          id: crypto.randomUUID(),
          dir: "out",
          peerId: member.id,
          peerName: member.name,
          name: file.name,
          size: file.size,
          type: file.type || "application/octet-stream",
          status: "queued",
          bytes: 0,
          speed: 0,
          createdAt: Date.now(),
        };
        this.state.feed.push(item);
        queue.push({ item, file, cancelled: false });
      }
      this.outQueues.set(member.id, queue);
    }
    this.commit();
    for (const member of targets) void this.pump(member.id);
    return targets.length;
  }

  sendText(body: string, to: string): boolean {
    const text = body.slice(0, MAX_TEXT);
    if (!text.trim()) return false;
    const targets = this.recipients(to).filter((m) => this.mesh.channel(m.id));
    if (!targets.length) {
      this.notify({ tone: "error", title: "No one is connected yet", description: "Text sends once someone's link is up." });
      return false;
    }
    const id = crypto.randomUUID();
    for (const member of targets) this.sendPeer(member.id, { t: "text", id, body: text });
    this.state.feed.push({
      kind: "text",
      id,
      dir: "out",
      peerId: to === "all" ? null : to,
      peerName: to === "all" ? "Everyone" : targets[0].name,
      body: text,
      createdAt: Date.now(),
    });
    this.commit();
    return true;
  }

  private recipients(to: string): Member[] {
    const others = (this.state.room?.members ?? []).filter((m) => m.id !== this.state.selfId);
    return to === "all" ? others : others.filter((m) => m.id === to);
  }

  private async pump(peerId: string) {
    if (this.pumping.has(peerId)) return;
    this.pumping.add(peerId);
    try {
      const queue = this.outQueues.get(peerId);
      while (queue?.length) {
        const channel = this.mesh.channel(peerId);
        if (!channel) break; // resumes when the link comes back
        await this.runJob(peerId, channel, queue[0]);
        queue.shift();
      }
    } finally {
      this.pumping.delete(peerId);
    }
  }

  private async runJob(peerId: string, channel: RTCDataChannel, job: OutJob) {
    const { item, file } = job;
    if (job.cancelled) return this.setStatus(item, "cancelled");

    const decision = new Promise<Decision>((resolve) => (job.decide = resolve));
    this.setStatus(item, "offered");
    if (!this.sendPeer(peerId, { t: "offer", id: item.id, name: item.name, size: item.size, type: item.type })) {
      return this.setStatus(item, "failed", "Connection lost");
    }

    const answer = await decision;
    job.decide = undefined;
    if (answer === "decline") {
      this.notify({ tone: "info", title: `${item.peerName} declined ${item.name}` });
      return this.setStatus(item, "declined");
    }
    if (answer === "cancel") return this.setStatus(item, "cancelled");
    if (answer === "closed") return this.setStatus(item, "failed", "Connection lost");

    item.startedAt = Date.now();
    this.setStatus(item, "sending");

    let offset = 0;
    let next: Promise<ArrayBuffer> | null = file.slice(0, CHUNK_SIZE).arrayBuffer();
    try {
      while (next) {
        const buf: ArrayBuffer = await next;
        offset += buf.byteLength;
        next = offset < file.size ? file.slice(offset, offset + CHUNK_SIZE).arrayBuffer() : null;

        if (job.cancelled) return this.setStatus(item, "cancelled");
        if (channel.readyState !== "open") return this.setStatus(item, "failed", "Connection lost");
        if (channel.bufferedAmount > HIGH_WATER) await drained(channel);
        if (channel.readyState !== "open") return this.setStatus(item, "failed", "Connection lost");

        channel.send(buf);
        item.bytes = offset;
        this.progress(item);
      }
      this.sendPeer(peerId, { t: "end", id: item.id });
    } catch (err) {
      console.warn("[hop] send failed", err);
      if (item.status === "sending") {
        this.sendPeer(peerId, { t: "cancel", id: item.id });
        this.setStatus(item, "failed", "Couldn't read the file");
      }
    }
  }

  /* ---------- receiving ---------- */

  accept(id: string) {
    const item = this.findFile(id);
    if (!item || item.status !== "incoming") return;
    this.inFlight.set(item.peerId, { item, chunks: [] });
    item.startedAt = Date.now();
    this.setStatus(item, "receiving");
    this.sendPeer(item.peerId, { t: "accept", id });
  }

  decline(id: string) {
    const item = this.findFile(id);
    if (!item || item.status !== "incoming") return;
    this.setStatus(item, "declined");
    this.sendPeer(item.peerId, { t: "decline", id });
  }

  cancel(id: string) {
    const item = this.findFile(id);
    if (!item) return;
    if (item.status === "incoming") return this.decline(id);

    if (item.dir === "out") {
      const job = this.outQueues.get(item.peerId)?.find((j) => j.item.id === id);
      if (!job) return;
      job.cancelled = true;
      if (item.status === "offered" || item.status === "sending") {
        this.sendPeer(item.peerId, { t: "cancel", id });
      }
      job.decide?.("cancel");
      if (item.status === "queued") this.setStatus(item, "cancelled");
    } else if (item.status === "receiving") {
      if (this.inFlight.get(item.peerId)?.item.id === id) this.inFlight.delete(item.peerId);
      this.sendPeer(item.peerId, { t: "cancel", id });
      this.setStatus(item, "cancelled");
    }
  }

  /** Remove a finished item from the board and free its memory. */
  dismiss(id: string) {
    const item = this.state.feed.find((i) => i.id === id);
    if (!item) return;
    if (item.kind === "file") {
      if (["queued", "offered", "sending", "receiving", "incoming"].includes(item.status)) return;
      if (item.url) URL.revokeObjectURL(item.url);
    }
    this.state.feed = this.state.feed.filter((i) => i.id !== id);
    this.commit();
  }

  clearFinished() {
    for (const item of this.state.feed) {
      if (item.kind === "file" && item.url && item.saved) URL.revokeObjectURL(item.url);
    }
    this.state.feed = this.state.feed.filter(
      (i) =>
        i.kind === "file" &&
        (["queued", "offered", "sending", "receiving", "incoming"].includes(i.status) ||
          (i.status === "done" && i.dir === "in" && !i.saved))
    );
    this.commit();
  }

  markSaved(id: string) {
    const item = this.findFile(id);
    if (!item) return;
    item.saved = true;
    this.commit();
  }

  private handlePeerData(peerId: string, data: string | ArrayBuffer) {
    if (typeof data !== "string") return this.handleChunk(peerId, data);
    let msg: PeerMessage;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }
    const sender = this.state.room?.members.find((m) => m.id === peerId);
    const senderName = sender?.name ?? "Someone";

    switch (msg.t) {
      case "offer": {
        const item: FileItem = {
          kind: "file",
          id: msg.id,
          dir: "in",
          peerId,
          peerName: senderName,
          name: String(msg.name).slice(0, 255),
          size: Math.max(0, Number(msg.size) || 0),
          type: String(msg.type || "application/octet-stream"),
          status: "incoming",
          bytes: 0,
          speed: 0,
          createdAt: Date.now(),
        };
        this.state.feed.push(item);
        this.commit();
        if (this.state.settings.autoAccept) {
          this.accept(item.id);
        } else {
          this.notify({ tone: "info", title: `${senderName} wants to send ${item.name}`, description: "Accept it on the board." });
        }
        break;
      }
      case "accept":
      case "decline": {
        const job = this.outQueues.get(peerId)?.find((j) => j.item.id === msg.id);
        job?.decide?.(msg.t);
        break;
      }
      case "end": {
        const rx = this.inFlight.get(peerId);
        if (!rx || rx.item.id !== msg.id) return;
        this.inFlight.delete(peerId);
        const { item } = rx;
        if (item.bytes !== item.size) {
          this.setStatus(item, "failed", "Arrived incomplete");
          return;
        }
        item.url = URL.createObjectURL(new Blob(rx.chunks, { type: item.type }));
        item.finishedAt = Date.now();
        this.setStatus(item, "done");
        this.sendPeer(peerId, { t: "done", id: item.id });
        this.notify({ tone: "success", title: `Received ${item.name}`, description: `From ${senderName}` });
        break;
      }
      case "done": {
        const item = this.findFile(msg.id);
        if (item && item.dir === "out") {
          item.bytes = item.size;
          item.finishedAt = Date.now();
          this.setStatus(item, "done");
        }
        break;
      }
      case "cancel": {
        const item = this.findFile(msg.id);
        if (!item || ["done", "cancelled", "declined", "failed"].includes(item.status)) return;
        if (item.dir === "out") {
          const job = this.outQueues.get(peerId)?.find((j) => j.item.id === msg.id);
          if (job) {
            job.cancelled = true;
            job.decide?.("cancel");
          }
        } else if (this.inFlight.get(peerId)?.item.id === msg.id) {
          this.inFlight.delete(peerId);
        }
        this.setStatus(item, "cancelled", `Cancelled by ${senderName}`);
        break;
      }
      case "text": {
        const body = String(msg.body).slice(0, MAX_TEXT);
        this.state.feed.push({
          kind: "text",
          id: msg.id,
          dir: "in",
          peerId,
          peerName: senderName,
          body,
          createdAt: Date.now(),
        });
        this.commit();
        this.notify({ tone: "info", title: `Text from ${senderName}`, description: body.slice(0, 80) });
        break;
      }
    }
  }

  private handleChunk(peerId: string, buf: ArrayBuffer) {
    const rx = this.inFlight.get(peerId);
    if (!rx) return; // late chunks from a cancelled transfer
    rx.chunks.push(buf);
    rx.item.bytes += buf.byteLength;
    if (rx.item.bytes > rx.item.size) {
      this.inFlight.delete(peerId);
      this.sendPeer(peerId, { t: "cancel", id: rx.item.id });
      this.setStatus(rx.item, "failed", "Received more data than announced");
      return;
    }
    this.progress(rx.item);
  }

  private handleChannelClose(peerId: string) {
    const rx = this.inFlight.get(peerId);
    if (rx) {
      this.inFlight.delete(peerId);
      this.setStatus(rx.item, "failed", "Connection lost");
    }
    const head = this.outQueues.get(peerId)?.[0];
    head?.decide?.("closed");
    // Fully sent but never acknowledged: we can't know it arrived.
    for (const item of this.state.feed) {
      if (item.kind === "file" && item.dir === "out" && item.peerId === peerId && item.status === "sending" && item !== head?.item) {
        this.setStatus(item, "failed", "Connection dropped before delivery was confirmed");
      }
    }
  }

  /** A peer left for good: fail everything in flight and drop their queue. */
  private dropPeer(peerId: string, note: string) {
    const rx = this.inFlight.get(peerId);
    if (rx) {
      this.inFlight.delete(peerId);
      this.setStatus(rx.item, "failed", note, false);
    }
    for (const job of this.outQueues.get(peerId) ?? []) {
      job.cancelled = true;
      job.decide?.("closed");
      if (!["done", "declined", "cancelled", "failed"].includes(job.item.status)) {
        this.setStatus(job.item, "failed", note, false);
      }
    }
    this.outQueues.delete(peerId);
    for (const item of this.state.feed) {
      if (item.kind === "file" && item.peerId === peerId && item.status === "incoming") {
        item.status = "failed";
        item.note = note;
      }
    }
  }

  /* ---------- helpers ---------- */

  private sendPeer(peerId: string, msg: PeerMessage): boolean {
    const channel = this.mesh.channel(peerId);
    if (!channel) return false;
    try {
      channel.send(JSON.stringify(msg));
      return true;
    } catch {
      return false;
    }
  }

  private findFile(id: string): FileItem | undefined {
    const item = this.state.feed.find((i) => i.id === id);
    return item?.kind === "file" ? item : undefined;
  }

  private setStatus(item: FileItem, status: FileStatus, note?: string, emit = true) {
    item.status = status;
    if (note) item.note = note;
    if (status !== "sending" && status !== "receiving") this.speedSamples.delete(item.id);
    if (emit) this.commit();
  }

  private progress(item: FileItem) {
    const now = Date.now();
    const sample = this.speedSamples.get(item.id);
    if (!sample) {
      this.speedSamples.set(item.id, { at: now, bytes: item.bytes });
    } else if (now - sample.at >= 500) {
      const instant = ((item.bytes - sample.bytes) * 1000) / (now - sample.at);
      item.speed = item.speed ? item.speed * 0.6 + instant * 0.4 : instant;
      this.speedSamples.set(item.id, { at: now, bytes: item.bytes });
    }
    this.touch();
  }

  hasUnsavedFiles() {
    return this.state.feed.some((i) => i.kind === "file" && i.dir === "in" && i.status === "done" && !i.saved);
  }

  hasActiveTransfers() {
    return this.state.feed.some(
      (i) => i.kind === "file" && (i.status === "sending" || i.status === "receiving")
    );
  }
}

function drained(channel: RTCDataChannel) {
  return new Promise<void>((resolve) => {
    const done = () => {
      channel.removeEventListener("bufferedamountlow", done);
      channel.removeEventListener("close", done);
      resolve();
    };
    channel.addEventListener("bufferedamountlow", done);
    channel.addEventListener("close", done);
  });
}

function safeStorage<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

function readJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const raw = safeStorage(() => localStorage.getItem(key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// Session lives in sessionStorage: it survives a refresh but each tab is its own member.
function readSession(key: string): StoredSession | null {
  if (typeof window === "undefined") return null;
  const raw = safeStorage(() => sessionStorage.getItem(key));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

function writeSession(key: string, value: StoredSession) {
  safeStorage(() => sessionStorage.setItem(key, JSON.stringify(value)));
}

function clearSession(key: string) {
  safeStorage(() => sessionStorage.removeItem(key));
}

let instance: HopClient | null = null;

export function getHopClient(): HopClient {
  if (!instance) instance = new HopClient();
  return instance;
}
