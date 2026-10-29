import type { SignalData } from "./protocol";

export type LinkState = "connecting" | "connected" | "failed";
export type LinkRoute = "direct" | "relay";

export interface LinkInfo {
  state: LinkState;
  route: LinkRoute | null;
}

interface Link {
  peerId: string;
  cid: string;
  pc: RTCPeerConnection;
  channel: RTCDataChannel | null;
  initiator: boolean;
  createdAt: number;
  remoteSet: boolean;
  offerSent: boolean;
  pendingRemote: RTCIceCandidateInit[];
  pendingLocal: RTCIceCandidateInit[];
  info: LinkInfo;
}

interface MeshHooks {
  signal: (to: string, data: SignalData) => void;
  onLinkChange: (peerId: string, info: LinkInfo | null) => void;
  onChannelOpen: (peerId: string, channel: RTCDataChannel) => void;
  onChannelClose: (peerId: string) => void;
  onMessage: (peerId: string, data: string | ArrayBuffer) => void;
}

const DEFAULT_ICE: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
  { urls: "stun:stun.cloudflare.com:3478" },
];

const WATCHDOG_EVERY = 3_000;
const RETRY_AFTER = 12_000;
const POLITE_RETRY_AFTER = 25_000;

/**
 * Full mesh of RTCPeerConnections, one per remote member.
 *
 * Who dials whom: a member that (re)enters a room dials everyone already there. If two
 * sides dial at once (glare), the "polite" side (lower id) yields. A watchdog re-dials
 * links that never came up or broke, so the mesh converges even after signaling blips.
 */
export class Mesh {
  selfId: string | null = null;
  iceServers: RTCIceServer[] = DEFAULT_ICE;
  private links = new Map<string, Link>();
  /** peer id -> when we started wanting a link to it */
  private wanted = new Map<string, number>();
  private watchdog: ReturnType<typeof setInterval> | null = null;

  constructor(private hooks: MeshHooks) {}

  /**
   * Sync with the room roster. Online members are dialed when `dial` is set and watched by
   * the watchdog; offline members keep any link that is still alive (their signaling may have
   * blipped while the data channel survived); members no longer in the room are closed.
   */
  setPeers(members: { id: string; online: boolean }[], { dial }: { dial: boolean }) {
    const present = new Set(members.map((m) => m.id));
    const now = Date.now();
    const next = new Map<string, number>();
    for (const m of members) {
      if (m.id === this.selfId || !m.online) continue;
      next.set(m.id, this.wanted.get(m.id) ?? now);
    }
    this.wanted = next;
    for (const id of [...this.links.keys()]) {
      if (!present.has(id)) this.close(id);
    }
    if (dial) {
      for (const id of this.wanted.keys()) {
        if (!this.isHealthy(id)) void this.dial(id);
      }
    }
    this.ensureWatchdog();
  }

  channel(peerId: string): RTCDataChannel | null {
    const ch = this.links.get(peerId)?.channel;
    return ch?.readyState === "open" ? ch : null;
  }

  isHealthy(peerId: string) {
    return this.channel(peerId) !== null;
  }

  async dial(peerId: string) {
    this.close(peerId, true);
    const link = this.createLink(peerId, crypto.randomUUID(), true);
    const channel = link.pc.createDataChannel("hop", { ordered: true });
    this.attachChannel(link, channel);

    try {
      await link.pc.setLocalDescription();
      if (this.links.get(peerId) !== link) return;
      this.hooks.signal(peerId, {
        kind: "offer",
        cid: link.cid,
        sdp: link.pc.localDescription!.toJSON(),
      });
      link.offerSent = true;
      for (const candidate of link.pendingLocal.splice(0)) {
        this.hooks.signal(peerId, { kind: "ice", cid: link.cid, candidate });
      }
    } catch (err) {
      console.warn("[hop] offer failed", peerId, err);
      this.markFailed(link);
    }
  }

  async handleSignal(from: string, data: SignalData) {
    if (data.kind === "offer") return this.handleOffer(from, data.cid, data.sdp);

    const link = this.links.get(from);
    if (!link || link.cid !== data.cid) return; // stale: belongs to a connection we already replaced

    if (data.kind === "answer") {
      if (link.pc.signalingState !== "have-local-offer") return;
      try {
        await link.pc.setRemoteDescription(data.sdp);
        link.remoteSet = true;
        await this.flushRemoteCandidates(link);
      } catch (err) {
        console.warn("[hop] answer failed", from, err);
        this.markFailed(link);
      }
      return;
    }

    if (!link.remoteSet) {
      link.pendingRemote.push(data.candidate);
      return;
    }
    await link.pc.addIceCandidate(data.candidate).catch(() => {});
  }

  close(peerId: string, replacing = false) {
    const link = this.links.get(peerId);
    if (!link) return;
    this.links.delete(peerId);
    link.channel?.close();
    link.pc.close();
    if (!replacing) this.hooks.onLinkChange(peerId, null);
  }

  closeAll() {
    for (const id of [...this.links.keys()]) this.close(id);
    this.wanted.clear();
    if (this.watchdog) clearInterval(this.watchdog);
    this.watchdog = null;
  }

  private async handleOffer(from: string, cid: string, sdp: RTCSessionDescriptionInit) {
    const existing = this.links.get(from);
    const glare =
      existing &&
      existing.initiator &&
      existing.info.state !== "connected" &&
      existing.pc.signalingState === "have-local-offer";
    if (glare) {
      const polite = (this.selfId ?? "") < from;
      if (!polite) return; // our offer wins; the other side will answer it
    }

    this.close(from, true);
    const link = this.createLink(from, cid, false);
    link.offerSent = true;
    link.pc.ondatachannel = (ev) => this.attachChannel(link, ev.channel);

    try {
      await link.pc.setRemoteDescription(sdp);
      link.remoteSet = true;
      await this.flushRemoteCandidates(link);
      await link.pc.setLocalDescription();
      if (this.links.get(from) !== link) return;
      this.hooks.signal(from, { kind: "answer", cid, sdp: link.pc.localDescription!.toJSON() });
    } catch (err) {
      console.warn("[hop] answering failed", from, err);
      this.markFailed(link);
    }
  }

  private createLink(peerId: string, cid: string, initiator: boolean): Link {
    const pc = new RTCPeerConnection({ iceServers: this.iceServers });
    const link: Link = {
      peerId,
      cid,
      pc,
      channel: null,
      initiator,
      createdAt: Date.now(),
      remoteSet: false,
      offerSent: false,
      pendingRemote: [],
      pendingLocal: [],
      info: { state: "connecting", route: null },
    };
    this.links.set(peerId, link);
    this.hooks.onLinkChange(peerId, link.info);

    pc.onicecandidate = (ev) => {
      if (!ev.candidate || this.links.get(peerId) !== link) return;
      const candidate = ev.candidate.toJSON();
      if (!link.offerSent) link.pendingLocal.push(candidate);
      else this.hooks.signal(peerId, { kind: "ice", cid, candidate });
    };

    pc.onconnectionstatechange = () => {
      if (this.links.get(peerId) !== link) return;
      if (pc.connectionState === "failed") this.markFailed(link);
      if (pc.connectionState === "connected") void this.detectRoute(link);
    };

    return link;
  }

  private attachChannel(link: Link, channel: RTCDataChannel) {
    link.channel = channel;
    channel.binaryType = "arraybuffer";
    channel.bufferedAmountLowThreshold = 1024 * 1024;

    channel.onopen = () => {
      if (this.links.get(link.peerId) !== link) return;
      this.setInfo(link, { state: "connected" });
      this.hooks.onChannelOpen(link.peerId, channel);
    };
    channel.onclose = () => {
      if (this.links.get(link.peerId) !== link) return;
      this.markFailed(link);
      this.hooks.onChannelClose(link.peerId);
    };
    channel.onmessage = (ev) => this.hooks.onMessage(link.peerId, ev.data);
  }

  private async flushRemoteCandidates(link: Link) {
    for (const candidate of link.pendingRemote.splice(0)) {
      await link.pc.addIceCandidate(candidate).catch(() => {});
    }
  }

  private markFailed(link: Link) {
    if (link.info.state === "failed") return;
    this.setInfo(link, { state: "failed" });
  }

  private setInfo(link: Link, patch: Partial<LinkInfo>) {
    link.info = { ...link.info, ...patch };
    this.hooks.onLinkChange(link.peerId, link.info);
  }

  private async detectRoute(link: Link) {
    try {
      const stats = await link.pc.getStats();
      let pairLocalId: string | undefined;
      stats.forEach((s) => {
        if (s.type === "transport" && s.selectedCandidatePairId) {
          pairLocalId = stats.get(s.selectedCandidatePairId)?.localCandidateId;
        }
      });
      if (!pairLocalId) {
        stats.forEach((s) => {
          if (s.type === "candidate-pair" && s.nominated && s.state === "succeeded") {
            pairLocalId = s.localCandidateId;
          }
        });
      }
      const local = pairLocalId ? stats.get(pairLocalId) : undefined;
      if (this.links.get(link.peerId) !== link) return;
      this.setInfo(link, { route: local?.candidateType === "relay" ? "relay" : "direct" });
    } catch {
      /* stats are informational only */
    }
  }

  private ensureWatchdog() {
    if (this.watchdog) return;
    this.watchdog = setInterval(() => this.tick(), WATCHDOG_EVERY);
  }

  private tick() {
    if (!this.selfId) return;
    const now = Date.now();
    for (const [id, since] of this.wanted) {
      if (this.isHealthy(id)) continue;
      const link = this.links.get(id);
      const impolite = this.selfId > id;
      const age = now - (link ? link.createdAt : since);
      const stuck = link?.info.state === "failed" || age > RETRY_AFTER;
      // The impolite side redials first; the polite side steps in only if that never happens.
      if (stuck && (impolite || age > POLITE_RETRY_AFTER)) void this.dial(id);
    }
  }
}
