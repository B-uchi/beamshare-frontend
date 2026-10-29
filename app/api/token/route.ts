import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

/**
 * Short-lived ticket for the signaling server, plus the ICE servers browsers should use.
 * TURN credentials live in server env so they're never baked into the client bundle.
 */
export async function GET() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "JWT_SECRET is not configured" }, { status: 500 });
  }

  const token = jwt.sign({ nonce: crypto.randomUUID() }, secret, { expiresIn: "5m" });

  const iceServers: RTCIceServer[] = [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    { urls: "stun:stun.cloudflare.com:3478" },
  ];
  const turnUrls = process.env.TURN_URLS?.split(",").map((u) => u.trim()).filter(Boolean);
  if (turnUrls?.length) {
    iceServers.push({
      urls: turnUrls,
      username: process.env.TURN_USERNAME,
      credential: process.env.TURN_CREDENTIAL,
    });
  }

  return NextResponse.json({ token, iceServers }, { headers: { "cache-control": "no-store" } });
}
