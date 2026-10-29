// Wire types shared between the browser and the signaling server (backend/server.js).

export type Role = "host" | "guest";

export interface Member {
  id: string;
  name: string;
  role: Role;
  online: boolean;
  joinedAt: string;
}

export interface RoomSnapshot {
  code: string;
  hostId: string;
  locked: boolean;
  createdAt: string;
  members: Member[];
}

export type RoomEventKind =
  | "joined"
  | "left"
  | "removed"
  | "offline"
  | "online"
  | "renamed"
  | "locked"
  | "unlocked";

export interface RoomEvent {
  kind: RoomEventKind;
  id?: string;
  name?: string;
}

export type EndReason = "host-ended" | "host-timeout" | "kicked" | "left" | "replaced" | "expired";

export type ErrorCode =
  | "not_found"
  | "locked"
  | "full"
  | "resume_failed"
  | "not_host"
  | "not_in_room"
  | "invalid"
  | "internal"
  | "unreachable";

/** Peer-to-peer signaling payloads, relayed opaquely by the server. */
export type SignalData =
  | { kind: "offer"; cid: string; sdp: RTCSessionDescriptionInit }
  | { kind: "answer"; cid: string; sdp: RTCSessionDescriptionInit }
  | { kind: "ice"; cid: string; candidate: RTCIceCandidateInit };

export type ServerMessage =
  | { t: "hello"; graceMs: number; maxMembers: number }
  | { t: "pong" }
  | { t: "joined"; resumed: boolean; self: { id: string; key: string }; room: RoomSnapshot }
  | { t: "room"; room: RoomSnapshot; event?: RoomEvent }
  | { t: "signal"; from: string; data: SignalData }
  | { t: "signal-failed"; to: string }
  | { t: "ended"; reason: EndReason }
  | { t: "error"; code: ErrorCode; message: string };

export type ClientMessage =
  | { t: "ping" }
  | { t: "create"; name: string }
  | { t: "join"; code: string; name: string }
  | { t: "resume"; code: string; id: string; key: string }
  | { t: "leave" }
  | { t: "end" }
  | { t: "lock"; locked: boolean }
  | { t: "kick"; id: string }
  | { t: "rename"; name: string }
  | { t: "signal"; to: string; data: SignalData };

/** Messages exchanged directly between browsers over the data channel (JSON text frames). */
export type PeerMessage =
  | { t: "offer"; id: string; name: string; size: number; type: string }
  | { t: "accept"; id: string }
  | { t: "decline"; id: string }
  | { t: "end"; id: string }
  | { t: "done"; id: string }
  | { t: "cancel"; id: string }
  | { t: "text"; id: string; body: string };

export const CODE_LENGTH = 6;
export const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function normalizeCode(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, CODE_LENGTH);
}
