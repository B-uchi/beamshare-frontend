# Hop

**Direct service. No stops in between.** Hop sends files and text straight from one browser to another over WebRTC. No uploads, no accounts, nothing stored on a server.

## Features

- Rooms with a 6-character code, shareable link and QR code; join from any modern browser
- Everyone can send — to everyone in the room or to one person
- Files (pick, drag anywhere, or paste) and text snippets with one-tap copy
- Live progress, speed and ETA on a departures-and-arrivals board; cancel from either side; delivery confirmation
- Optional "ask first" mode to accept or decline each incoming file
- Host controls: lock the room, remove people, end it
- Survives refreshes, sleeping phones and network switches: seats are resumed and peer links redialled automatically
- Light and dark themes, keyboard and screen-reader friendly

## How it's built

- `lib/hop/signaling.ts` — WebSocket client: jittered back-off reconnect, app-level heartbeat to catch half-open sockets, reconnects on `online` / tab visibility
- `lib/hop/mesh.ts` — one `RTCPeerConnection` per peer (full mesh), glare-safe negotiation (polite/impolite by id), per-connection ids so stale ICE is ignored, watchdog redial, relay detection
- `lib/hop/client.ts` — room lifecycle, transfer engine (64 KB binary chunks, buffered-amount back-pressure, per-peer serial queue, accept/decline/cancel/ack) and a `useSyncExternalStore` store
- `lib/hop/protocol.ts` — wire types shared with the signaling server
- `app/api/token` — issues short-lived JWTs for the signaling server and hands out ICE servers (TURN credentials stay server-side)

Design system: see `DESIGN.md` · product notes: `PRODUCT.md`.

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

Run the [signaling server](../backend) alongside it with the same `JWT_SECRET`.

| Variable | |
| --- | --- |
| `NEXT_PUBLIC_WS_SERVER_URL` | Signaling server URL, e.g. `ws://localhost:8080` or `wss://signal.example.com` |
| `JWT_SECRET` | Same secret as the signaling server |
| `TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL` | Optional TURN relay for networks that block direct connections |
