import { Peer } from "@/context/BeamShareSessionContext";
import { toast } from "sonner";

export type SignalMessage =
  | {
      type: "session-created";
      sessionId: string;
      clientId: string;
      startedAt: string;
    }
  | {
      type: "joined-session";
      clientId: string;
      hostId?: string;
      name: string;
      startedAt: string;
      connectedPeers: Peer[];
    }
  | { type: "peer-joined"; clientId: string; name: string; sessionId: string }
  | { type: "signal-offer"; from: string; offer: RTCSessionDescriptionInit }
  | { type: "signal-answer"; from: string; answer: RTCSessionDescriptionInit }
  | { type: "signal-ice"; from: string; candidate: RTCIceCandidateInit }
  | { type: "reconnected"; success: boolean; sessionId?: string }
  | { type: "error"; message: string }
  | { type: string; [key: string]: any };

export interface PeerInfo {
  pc: RTCPeerConnection;
  channel?: RTCDataChannel;
}

type ChannelMap = Record<string, RTCDataChannel>;
type PeerMap = Record<string, RTCPeerConnection>;
type CandidateQueueMap = Record<string, RTCIceCandidateInit[]>;

let ws: WebSocket | null = null;
let sessionId: string | null = null;
let clientId: string | null = null;

const peers: PeerMap = {};
const channels: ChannelMap = {};
const pendingCandidates: CandidateQueueMap = {};
const chunkQueue: Record<string, (string | ArrayBuffer | Blob)[]> = {};
const MAX_BUFFERED_AMOUNT = 64 * 1024; // 64KB limit before buffering

// Track active transfers for cancellation
const activeTransfers = new Map<string, boolean>();

// Use Google STUN by default
const rtcConfig: RTCConfiguration = {
  iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
};

// ----------------------------
// 1. CONNECT TO WEBSOCKET
// ----------------------------
export function connectWS(token: string) {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    console.log("[WS] Already connected or connecting");
    return;
  }

  ws = new WebSocket(
    `${process.env.NEXT_PUBLIC_WS_SERVER_URL}?token=${token}`
  );

  ws.onopen = () => {
    console.log("%c[WS] Connected", "color: #03A9F4");
    // If we have a pending reconnect, we could trigger it here, 
    // but the UI handles it via attemptReconnect
  };
  ws.onmessage = handleWSMessage;
  ws.onclose = () => {
    console.warn("[WS] Connection closed");
  };
  ws.onerror = (e) => console.error("[WS] Error", e);
}

// ----------------------------
// 2. HANDLE WS MESSAGES
// ----------------------------
function handleWSMessage(ev: MessageEvent) {
  const data: SignalMessage = JSON.parse(ev.data);

  switch (data.type) {
    case "welcome":
      broadcastClientId(data.clientId);
      break;

    case "session-created":
      sessionId = data.sessionId;
      clientId = data.clientId;
      handleSessionCreated(sessionId!, clientId!, data.startedAt);
      break;

    case "joined-session":
      clientId = data.clientId;
      const name = data.name;
      const joinedSessionId = (window as any).sessionIdToJoin;
      sessionId = joinedSessionId;
      broadcastSessionJoined(clientId!, name, joinedSessionId, data.startedAt, data.connectedPeers!);
      break;

    case "session-ended":
      broadcastSessionEnded();
      break;

    case "peer-joined":
      onPeerJoined(data.clientId, data.name, data.sessionId!);
      break;

    case "peer-left":
      cleanupPeer(data.clientId);
      broadcastPeerLeft(data.clientId);
      break;

    case "signal-offer":
      onOffer(data.from, data.offer);
      break;

    case "signal-answer":
      onAnswer(data.from, data.answer);
      break;

    case "signal-ice":
      onRemoteCandidate(data.from, data.candidate);
      break;

    case "reconnected":
      handleReconnected(data);
      break;

    case "reconnected-host":
      handleReconnectedHost(data);
      break;

    case "host-reconnected":
      // Peers receive this when host comes back
      onPeerJoined(data.hostId, "Host", data.sessionId!);
      broadcastHostReconnected(data.hostId, data.sessionId!);
      break;

    case "peer-reconnected":
      onPeerJoined(data.clientId, data.name, data.sessionId!);
      broadcastPeerReconnected(data.clientId, data.name);
      break;

    case "peer-disconnected":
      cleanupPeer(data.clientId);
      broadcastPeerDisconnected(data.clientId);
      break;

    case "host-disconnected":
      // Host is gone temporarily
      cleanupPeer(data.hostId);
      broadcastHostDisconnected(data.hostId);
      break;

    case "error":
      console.error("[WS ERROR]:", data.message);
      if ((data.message || "").toLowerCase().includes("session not found")) {
        broadcastSessionNotFound();
      }
      break;
  }
}

function createSession() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;

  ws.send(
    JSON.stringify({
      type: "create-session",
    })
  );

  return true;
}

function joinSession(joinSessionId: string, name: string) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;

  (window as any).sessionIdToJoin = joinSessionId;

  ws.send(
    JSON.stringify({
      type: "join-session",
      sessionId: joinSessionId,
      name,
    })
  );
}

function destroySession(destroySessionId: string, destroyClientId: string) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return false;

  ws.send(
    JSON.stringify({
      type: "destroy-session",
      sessionId: destroySessionId,
      clientId: destroyClientId,
    })
  );

  return true;
}

function handleSessionCreated(
  sessionId: string,
  clientId: string,
  startedAt: string
) {
  const customEvent = new CustomEvent("beamshare:session-created", {
    detail: { sessionId, clientId, startedAt, isHost: true },
  } as Record<string, Record<string, string | boolean>>);
  window.dispatchEvent(customEvent);
}

function broadcastSessionEnded() {
  const customEvent = new CustomEvent("beamshare:session-ended");
  window.dispatchEvent(customEvent);
}

function broadcastSessionNotFound() {
  const customEvent = new CustomEvent("beamshare:session-not-found");
  window.dispatchEvent(customEvent);
}

function broadcastSessionJoined(
  clientId: string,
  name: string,
  sessionId: string,
  startedAt: string,
  connectedPeers: Peer[]
) {
  const customEvent = new CustomEvent("beamshare:session-joined", {
    detail: { name, clientId, sessionId, startedAt, connectedPeers },
  } as Record<string, Record<string, string | Peer[]>>);
  window.dispatchEvent(customEvent);
}

function broadcastNewPeerJoined(clientId: string, name: string) {
  const customEvent = new CustomEvent("beamshare:new-peer", {
    detail: { name, clientId },
  } as Record<string, Record<string, string>>);
  window.dispatchEvent(customEvent);
}

function broadcastPeerLeft(clientId: string) {
  const customEvent = new CustomEvent("beamshare:peer-left", {
    detail: { clientId },
  } as Record<string, Record<string, string>>);
  window.dispatchEvent(customEvent);
}

function broadcastClientId(clientId: string) {
  const customEvent = new CustomEvent("beamshare:client-id", {
    detail: { clientId },
  } as Record<string, Record<string, string>>);
  window.dispatchEvent(customEvent);
}

function handleReconnected(data: any) {
  const customEvent = new CustomEvent("beamshare:reconnected", {
    detail: data,
  });
  window.dispatchEvent(customEvent);
}

function handleReconnectedHost(data: any) {
  const customEvent = new CustomEvent("beamshare:host-reconnected-success", {
    detail: data,
  });
  window.dispatchEvent(customEvent);

  // Host needs to re-initiate connections to all peers
  if (data.connectedPeers && Array.isArray(data.connectedPeers)) {
    console.log("[RTC] Host reconnected, initiating connections to peers:", data.connectedPeers);
    data.connectedPeers.forEach((peer: Peer) => {
      onPeerJoined(peer.clientId, peer.name, data.sessionId);
    });
  }
}

function broadcastHostReconnected(hostId: string, sessionId: string) {
  const customEvent = new CustomEvent("beamshare:host-back", {
    detail: { clientId: hostId, sessionId },
  });
  window.dispatchEvent(customEvent);
}

function broadcastPeerReconnected(clientId: string, name: string) {
  const customEvent = new CustomEvent("beamshare:peer-reconnected", {
    detail: { clientId, name },
  });
  window.dispatchEvent(customEvent);
}

function broadcastPeerDisconnected(clientId: string) {
  const customEvent = new CustomEvent("beamshare:peer-disconnected", {
    detail: { clientId },
  });
  window.dispatchEvent(customEvent);
}

function broadcastHostDisconnected(hostId: string) {
  const customEvent = new CustomEvent("beamshare:host-disconnected", {
    detail: { hostId },
  });
  window.dispatchEvent(customEvent);
}

// ----------------------------
// 3. HOST: PEER JOINED → CREATE OFFER
// ----------------------------
async function onPeerJoined(
  peerId: string,
  name: string,
  joinSessionId: string
) {
  console.log("[RTC] New peer joined:", peerId, name);

  // Ensure we clean up any old connection for this peer first!
  cleanupPeer(peerId);

  broadcastNewPeerJoined(peerId!, name!);

  const pc = new RTCPeerConnection(rtcConfig);
  peers[peerId] = pc;

  const channel = pc.createDataChannel("beamshare", {
    ordered: true,
    maxRetransmits: 3,
  });
  channels[peerId] = channel;

  setupChannelEvents(peerId, channel);
  setupPeerConnectionEvents(peerId, pc, joinSessionId);

  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    console.log("[RTC] Sending offer to:", peerId);

    ws?.send(
      JSON.stringify({
        type: "signal",
        targetId: peerId,
        payload: offer,
        sessionId: joinSessionId,
      })
    );
  } catch (error) {
    console.error("[RTC] Error creating offer:", error);
  }
}

// ----------------------------
// 4. PEER: RECEIVES OFFER → SENDS ANSWER
// ----------------------------
async function onOffer(from: string, offer: RTCSessionDescriptionInit) {
  console.log("[RTC] Received offer from:", from);

  // Ensure we clean up any old connection for this peer first!
  cleanupPeer(from);

  const pc = new RTCPeerConnection(rtcConfig);
  peers[from] = pc;

  setupPeerConnectionEvents(from, pc, sessionId!);

  pc.ondatachannel = (event) => {
    console.log("[RTC] Data channel received from:", from);
    channels[from] = event.channel;
    setupChannelEvents(from, event.channel);
  };

  try {
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    console.log("[RTC] Remote description set for:", from);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    console.log("[RTC] Sending answer to:", from);

    ws?.send(
      JSON.stringify({
        type: "signal-answer",
        target: from,
        answer,
        sessionId,
      })
    );

    if (pendingCandidates[from]) {
      console.log(
        `[RTC] Adding ${pendingCandidates[from].length} pending candidates for ${from}`
      );
      for (const candidate of pendingCandidates[from]) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      delete pendingCandidates[from];
    }
  } catch (error) {
    console.error("[RTC] Error handling offer:", error);
  }
}

// ----------------------------
// 5. HOST RECEIVES ANSWER
// ----------------------------
async function onAnswer(from: string, answer: RTCSessionDescriptionInit) {
  console.log("[RTC] Received answer from:", from);
  const pc = peers[from];
  if (!pc) return console.warn("Unknown peer answer:", from);

  try {
    await pc.setRemoteDescription(new RTCSessionDescription(answer));
    console.log("[RTC] Remote description set for answer from:", from);

    if (pendingCandidates[from]) {
      console.log(
        `[RTC] Adding ${pendingCandidates[from].length} pending candidates for ${from}`
      );
      for (const candidate of pendingCandidates[from]) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      delete pendingCandidates[from];
    }
  } catch (error) {
    console.error("[RTC] Error setting remote description:", error);
  }
}

// ----------------------------
// 6. ICE CANDIDATE EXCHANGE
// ----------------------------
function setupPeerConnectionEvents(
  peerId: string,
  pc: RTCPeerConnection,
  currentSessionId: string
) {
  pc.onicecandidate = (ev) => {
    if (ev.candidate) {
      ws?.send(
        JSON.stringify({
          type: "signal-ice",
          target: peerId,
          candidate: ev.candidate.toJSON(),
          sessionId: currentSessionId,
        })
      );
    }
  };

  pc.oniceconnectionstatechange = () => {
    console.log(
      `[RTC] ICE connection state for ${peerId}:`,
      pc.iceConnectionState
    );
  };

  pc.onconnectionstatechange = () => {
    console.log(`[RTC] Connection state for ${peerId}:`, pc.connectionState);
  };
}

async function onRemoteCandidate(from: string, candidate: RTCIceCandidateInit) {
  const pc = peers[from];

  if (!pc) {
    console.warn("[RTC] No peer connection for candidate from:", from);
    pendingCandidates[from] ||= [];
    pendingCandidates[from].push(candidate);
    return;
  }

  if (!pc.remoteDescription) {
    pendingCandidates[from] ||= [];
    pendingCandidates[from].push(candidate);
    return;
  }

  try {
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
  } catch (error) {
    console.error("[RTC] Error adding ICE candidate:", error);
  }
}

// ----------------------------
// 7. DATA CHANNEL EVENTS
// ----------------------------
function setupChannelEvents(peerId: string, channel: RTCDataChannel) {
  channel.onopen = () => {
    console.log(`[DC] Open → peer=${peerId}`);
    const customEvent = new CustomEvent("beamshare:channel-ready", {
      detail: { peerId },
    });
    window.dispatchEvent(customEvent);
  };

  channel.onclose = () => {
    console.warn(`[DC] Closed → peer=${peerId}`);
  };

  channel.onerror = (error) => {
    console.error(`[DC] Error → peer=${peerId}`, error);
  };

  channel.onmessage = (e) => {
    const customEvent = new CustomEvent("beamshare:chunk-received", {
      detail: { peerId, data: e.data },
    });
    window.dispatchEvent(customEvent);
  };

  channel.onbufferedamountlow = () => {
    flushQueue(peerId);
  };
}

// ----------------------------
// 8. BROADCAST/SEND CHUNKS
// ----------------------------
// ----------------------------
// 8. BROADCAST/SEND CHUNKS (WITH BACKPRESSURE)
// ----------------------------

function flushQueue(peerId: string) {
  const channel = channels[peerId];
  const queue = chunkQueue[peerId];

  if (!channel || !queue || queue.length === 0) return;

  while (queue.length > 0 && channel.bufferedAmount < MAX_BUFFERED_AMOUNT) {
    const chunk = queue.shift();
    if (chunk) {
      try {
        channel.send(chunk as string);
      } catch (e) {
        console.error(`[RTC] Error sending queued chunk to ${peerId}:`, e);
        // Put it back? Or drop? For now, we might lose it if error, but usually it's state error.
        // If closed, we should clear queue.
        if (channel.readyState !== "open") {
          chunkQueue[peerId] = [];
          return;
        }
      }
    }
  }
}

export function broadcastChunk(chunk: ArrayBuffer | Blob | string) {
  let sentCount = 0;
  Object.entries(channels).forEach(([peerId, ch]) => {
    if (ch.readyState === "open") {
      sendChunkToPeer(peerId, chunk);
      sentCount++;
    }
  });
  return sentCount;
}

export function sendChunkToPeer(
  peerId: string,
  chunk: ArrayBuffer | Blob | string
) {
  const channel = channels[peerId];
  if (!channel || channel.readyState !== "open") {
    console.warn(`[RTC] Cannot send to ${peerId}, channel not open`);
    return false;
  }

  if (channel.bufferedAmount > MAX_BUFFERED_AMOUNT) {
    // Buffer full, queue it
    if (!chunkQueue[peerId]) chunkQueue[peerId] = [];
    chunkQueue[peerId].push(chunk);
    return true; // We accepted it for delivery
  }

  try {
    channel.send(chunk as string);
    return true;
  } catch (e) {
    console.error(`[RTC] Error sending chunk to ${peerId}:`, e);
    return false;
  }
}

// ----------------------------
// 9. TRANSFER CANCELLATION
// ----------------------------
export function cancelTransfer(fileId: string) {
  activeTransfers.set(fileId, false);

  // Send cancellation message
  const cancelMessage = JSON.stringify({
    type: "file-cancel",
    fileId,
  });

  broadcastChunk(cancelMessage);
}

export function isTransferActive(fileId: string): boolean {
  return activeTransfers.get(fileId) ?? false;
}

export function setTransferActive(fileId: string, active: boolean) {
  activeTransfers.set(fileId, active);
}

// ----------------------------
// 10. CLEANUP PEER
// ----------------------------
function cleanupPeer(peerId: string) {
  console.log("[RTC] Cleaning up peer:", peerId);

  if (channels[peerId]) {
    channels[peerId].close();
    delete channels[peerId];
    delete chunkQueue[peerId];
  }

  if (peers[peerId]) {
    peers[peerId].close();
    delete peers[peerId];
  }

  if (pendingCandidates[peerId]) {
    delete pendingCandidates[peerId];
  }
}

// ----------------------------
// 11. RECONNECT
// ----------------------------
export async function attemptReconnect(
  previousSessionId: string,
  previousClientId: string,
  isHost: boolean,
  name: string
) {
  try {
    await waitForOpenConnection();
    ws?.send(
      JSON.stringify({
        type: "reconnect",
        sessionId: previousSessionId,
        clientId: previousClientId,
        isHost,
        name,
      })
    );
  } catch (e) {
    console.error("[WS] Failed to reconnect:", e);
  }
}

function waitForOpenConnection(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (ws?.readyState === WebSocket.OPEN) {
      resolve();
      return;
    }
    if (!ws) {
      reject(new Error("WebSocket not initialized"));
      return;
    }
    
    const checkInterval = setInterval(() => {
      if (ws?.readyState === WebSocket.OPEN) {
        clearInterval(checkInterval);
        resolve();
      } else if (ws?.readyState === WebSocket.CLOSED) {
        clearInterval(checkInterval);
        reject(new Error("WebSocket closed"));
      }
    }, 100);
    
    // Timeout after 5s
    setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error("WebSocket connection timeout"));
    }, 5000);
  });
}

function isWSOpen() {
  return ws?.readyState === WebSocket.OPEN;
}

// ----------------------------
// EXPORTS FOR UI
// ----------------------------
export const BeamShareClient = {
  destroySession,
  createSession,
  joinSession,
  isWSOpen,
  connectWS,
  attemptReconnect,
  broadcastChunk,
  sendChunkToPeer,
  cancelTransfer,
  isTransferActive,
  setTransferActive,
  getSessionId: () => sessionId,
  getClientId: () => clientId,
  getPeers: () => Object.keys(peers),
  getChannels: () => Object.keys(channels),
  cleanupPeer,
};
