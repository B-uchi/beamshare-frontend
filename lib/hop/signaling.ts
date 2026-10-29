import type { ClientMessage, ServerMessage } from "./protocol";

export type SignalingStatus = "idle" | "connecting" | "open" | "reconnecting" | "offline";

interface Credentials {
  token: string;
  iceServers: RTCIceServer[];
}

interface SignalingEvents {
  status: (status: SignalingStatus) => void;
  open: () => void;
  message: (msg: ServerMessage) => void;
  ice: (servers: RTCIceServer[]) => void;
}

const PING_EVERY = 15_000;
const STALE_AFTER = 40_000;
const MAX_BACKOFF = 10_000;

/**
 * A WebSocket that stays connected: reconnects with jittered backoff, watches for silent
 * half-open connections with an app-level ping, and reconnects immediately when the
 * browser comes back online or the tab becomes visible again.
 */
export class Signaling {
  status: SignalingStatus = "idle";
  private ws: WebSocket | null = null;
  private attempts = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private lastMessageAt = 0;
  private wanted = false;
  private opening = false;
  private listeners: { [K in keyof SignalingEvents]: Set<SignalingEvents[K]> } = {
    status: new Set(),
    open: new Set(),
    message: new Set(),
    ice: new Set(),
  };

  constructor(private url: string) {
    if (typeof window === "undefined") return;
    // After a network change the old TCP connection is usually dead even if it looks open.
    window.addEventListener("online", () => this.wanted && this.reopen());
    window.addEventListener("offline", () => this.wanted && this.setStatus("offline"));
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible" && this.wanted) this.checkHealth();
    });
  }

  on<K extends keyof SignalingEvents>(event: K, fn: SignalingEvents[K]) {
    this.listeners[event].add(fn);
    return () => this.listeners[event].delete(fn);
  }

  /** Idempotent: opens the connection if it is not already open or opening. */
  start() {
    this.wanted = true;
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) return;
    if (this.retryTimer || this.opening) return;
    void this.open();
  }

  stop() {
    this.wanted = false;
    this.clearTimers();
    const ws = this.ws;
    this.ws = null;
    ws?.close(1000, "Client stopped");
    this.setStatus("idle");
  }

  send(msg: ClientMessage): boolean {
    if (this.ws?.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(msg));
    return true;
  }

  get isOpen() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private async open() {
    if (this.opening) return;
    this.opening = true;
    this.setStatus(this.attempts === 0 ? "connecting" : "reconnecting");

    let creds: Credentials;
    try {
      const res = await fetch("/api/token", { cache: "no-store" });
      if (!res.ok) throw new Error(`Token request failed (${res.status})`);
      creds = await res.json();
    } catch (err) {
      console.warn("[hop] token fetch failed", err);
      this.opening = false;
      return this.scheduleRetry();
    }
    this.opening = false;
    if (!this.wanted) return;
    this.emit("ice", creds.iceServers);

    const ws = new WebSocket(`${this.url}?token=${encodeURIComponent(creds.token)}`);
    this.ws = ws;

    ws.onopen = () => {
      if (ws !== this.ws) return;
      this.attempts = 0;
      this.lastMessageAt = Date.now();
      this.startPing();
      this.setStatus("open");
      this.emit("open");
    };

    ws.onmessage = (ev) => {
      if (ws !== this.ws) return;
      this.lastMessageAt = Date.now();
      let msg: ServerMessage;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      if (msg.t !== "pong") this.emit("message", msg);
    };

    ws.onclose = () => {
      if (ws !== this.ws) return;
      this.ws = null;
      this.clearTimers();
      if (this.wanted) this.scheduleRetry();
    };

    // onclose always follows onerror; retry logic lives there.
    ws.onerror = () => {};
  }

  private scheduleRetry() {
    if (!this.wanted || this.retryTimer) return;
    this.attempts++;
    const offline = typeof navigator !== "undefined" && navigator.onLine === false;
    this.setStatus(offline ? "offline" : "reconnecting");
    const base = Math.min(MAX_BACKOFF, 400 * 2 ** (this.attempts - 1));
    const delay = base / 2 + Math.random() * (base / 2);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (this.wanted) void this.open();
    }, delay);
  }

  private reconnectNow(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
    if (this.ws?.readyState === WebSocket.OPEN) return this.checkHealth();
    if (this.ws?.readyState === WebSocket.CONNECTING || this.opening) return;
    void this.open();
  }

  private reopen() {
    const ws = this.ws;
    this.ws = null;
    this.clearTimers();
    ws?.close(4003, "Network changed");
    void this.open();
  }

  /** Sleeping laptops and phones often leave a socket that looks open but is dead. */
  private checkHealth(): void {
    if (!this.ws) return this.reconnectNow();
    if (Date.now() - this.lastMessageAt > STALE_AFTER) {
      const ws = this.ws;
      this.ws = null;
      this.clearTimers();
      ws.close(4002, "Stale");
      void this.open();
    } else {
      this.send({ t: "ping" });
    }
  }

  private startPing() {
    this.clearPing();
    this.pingTimer = setInterval(() => {
      if (Date.now() - this.lastMessageAt > STALE_AFTER) return this.checkHealth();
      this.send({ t: "ping" });
    }, PING_EVERY);
  }

  private clearPing() {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  private clearTimers() {
    this.clearPing();
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
  }

  private setStatus(status: SignalingStatus) {
    if (this.status === status) return;
    this.status = status;
    this.emit("status", status);
  }

  private emit<K extends keyof SignalingEvents>(event: K, ...args: Parameters<SignalingEvents[K]>) {
    for (const fn of this.listeners[event]) (fn as (...a: unknown[]) => void)(...args);
  }
}
