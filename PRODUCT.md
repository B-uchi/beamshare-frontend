# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Anyone, ad hoc, with no account: moving a file from a phone to a laptop, handing a folder to someone across the table, or dropping a file to a friend on a call. They are mid-task, want the file over in seconds, and will not sign up for anything to do it.

## Product Purpose

Hop moves files and text directly between browsers. One person opens a room, others join with a six-character code, a link, or a QR scan, and anyone in the room can send to everyone or to one person. Success is a file arriving on the other device faster than it would take to email it.

## Positioning

Files travel browser-to-browser over WebRTC data channels. The server only introduces devices (signaling) and never sees file contents; nothing is uploaded or stored. Rooms vanish when the host ends them.

## Operating Context

- Usually two devices, sometimes a small group (up to 16 people in a room).
- Commonly phone ↔ laptop, so mobile and desktop are both first-class.
- Joining happens by typing a code, opening a shared link, or scanning a QR code from another screen.
- Connections drop: phones sleep, Wi-Fi switches, tabs refresh. The room must survive this and resync automatically.

## Capabilities and Constraints

- Rooms: create, join by code/link/QR, host can lock the room, remove people, and end it. Participants can leave.
- Sending: any participant sends files (multi-select, drag-and-drop, paste) or text snippets to everyone or to one person.
- Receiving: incoming files can be auto-accepted or require confirmation; received files are saved from the browser.
- Live progress, speed, and ETA per transfer; cancel from either side.
- Received files are held in browser memory until saved, so very large files (multi-GB) are bounded by device memory.
- Peers behind strict NATs need a TURN relay to connect; TURN is configurable but not bundled.
- Terminology: "room" (not session), "code", "host", "people".
- Stack: Next.js (App Router) + Tailwind CSS 4 frontend; Node `ws` signaling server.

## Brand Commitments

- Name: Hop (renamed from BeamShare).
- No accounts, no tracking of file contents, no upsell.

## Evidence on Hand

No testimonials, user counts, benchmarks, or press exist. Do not fabricate any. Speed claims must stay qualitative.

## Product Principles

1. Seconds to first byte: every step between landing and sending is a cost.
2. Honest about the wire: say plainly what the server sees (who is in a room) and what it never sees (files).
3. Survive the flaky network: reconnection is the normal case, not an error.
4. Same tool on phone and desktop.

## Accessibility & Inclusion

WCAG 2.2 AA: keyboard-operable file picking and sending, visible focus, status changes announced to screen readers, reduced-motion respected.
