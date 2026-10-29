---
name: Hop
description: Direct service between browsers, signed like a metro line.
colors:
  cobalt: "#1a3bc7"
  cobalt-deep: "#1430a6"
  cobalt-ink: "#ffffff"
  cobalt-ink-2: "#cdd5f5"
  cobalt-tint: "#e7ebfa"
  signal: "#ffc400"
  signal-hover: "#ffd23f"
  signal-ink: "#1a1400"
  ground: "#eceef1"
  panel: "#ffffff"
  panel-2: "#f6f7f9"
  ink: "#0f1420"
  ink-2: "#4a5263"
  ink-3: "#6b7385"
  rule: "#d3d7de"
  rule-strong: "#b8bec9"
  board: "#10151f"
  board-2: "#19202d"
  board-ink: "#f2f4f8"
  board-ink-2: "#9aa3b5"
  board-rule: "#262e3d"
  board-stop: "#ff7a6b"
  stop: "#d3261c"
  stop-tint: "#fbe9e7"
typography:
  display:
    fontFamily: "Barlow Semi Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "clamp(3rem, 7.4vw, 5.75rem)"
    fontWeight: 700
    lineHeight: 0.92
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Barlow Semi Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Barlow Semi Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Barlow, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.3
  code:
    fontFamily: "Barlow Semi Condensed, Barlow, ui-sans-serif, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    letterSpacing: "0.08em"
    fontFeature: "\"tnum\" 1"
rounded:
  tag: "3px"
  tile: "5px"
  control: "6px"
  sign: "10px"
  stop: "9999px"
spacing:
  gutter: "16px"
  gutter-wide: "32px"
  panel: "20px"
  section: "112px"
  container: "80rem"
  container-app: "90rem"
components:
  button-signal:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.signal-ink}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "44px"
  button-signal-lg:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.signal-ink}"
    rounded: "{rounded.control}"
    padding: "0 24px"
    height: "56px"
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.cobalt-ink}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-deep}"
  button-outline:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.panel-2}"
  button-on-cobalt:
    backgroundColor: "{colors.cobalt-ink}"
    textColor: "{colors.cobalt}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  button-on-cobalt-hover:
    backgroundColor: "{colors.cobalt-tint}"
  button-board:
    backgroundColor: "{colors.board}"
    textColor: "{colors.board-ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  button-board-hover:
    backgroundColor: "{colors.board-2}"
  button-danger:
    backgroundColor: "{colors.stop}"
    textColor: "{colors.cobalt-ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "36px"
  field:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "44px"
  sign:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.cobalt-ink}"
    rounded: "{rounded.sign}"
    padding: "56px"
  panel:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sign}"
    padding: "{spacing.panel}"
  departures-board:
    backgroundColor: "{colors.board}"
    textColor: "{colors.board-ink}"
    rounded: "{rounded.sign}"
    padding: "14px 20px"
  picto:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.cobalt-ink}"
    rounded: "{rounded.tile}"
    size: "40px"
  code-cell:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.code}"
    rounded: "{rounded.tile}"
    width: "40px"
    height: "48px"
  tag-host:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.cobalt-ink}"
    rounded: "{rounded.tag}"
    padding: "2px 6px"
  tag-you:
    backgroundColor: "{colors.signal}"
    textColor: "{colors.signal-ink}"
    rounded: "{rounded.tag}"
    padding: "2px 6px"
---

# Design System: Hop

## Overview

**Creative North Star: "Direct Service"**

Hop is a direct line between two browsers, and every surface is that line's station signage. The landing page opens on a full-bleed cobalt sign field; the room is a platform with a line diagram of the people aboard and a dark departures board where transfers tick over. Enamel-white panels sit on cool platform-concrete ground, cobalt is the single line colour, and signal yellow marks only what is live or what you should press next.

Density is calm and civic: big condensed headlines, generous section rhythm (about 112px between bands on desktop), and controls at a firm 44px touch height. Information is drawn as transit infrastructure rather than as cards: steps are stops on a line, people are stops on a line, transfers are departures. Depth is mostly tonal, with a single soft lift reserved for things that float over the sign (the hero demo, dialogs, toasts).

The system explicitly refuses the dark-glass gradient "magic file drop" hero: no gradients, no glow, no frosted panels over blurred colour fields. Dark surfaces exist only as the departures board, a functional object with a job.

**Key Characteristics:**
- One line colour (cobalt) on large sign fields, framed by an inset white keyline.
- Signal yellow is scarce and functional: primary call to action, live state, "you", progress.
- Barlow for reading, Barlow Semi Condensed for lettering on signs and headings.
- Departures board (near-black, tabular numerals) for every list of transfers.
- Metro line diagrams (6px cobalt bar, ringed stops) for sequences and people.
- Full light and dark themes driven by the same token names via `prefers-color-scheme`.

## Colors

A transit-authority palette: one saturated line colour, one warning yellow, cool greys, and a near-black board.

### Primary
- **Line Cobalt** (`cobalt`): the only brand colour. Fills full-bleed sign fields (landing hero, article heroes, closing sign, 404 platform plate), primary buttons, pictogram tiles, the room-code chip, line-diagram bars and stop rings. Deepens to **Cobalt Deep** (`cobalt-deep`) on hover. On cobalt, text uses **Sign White** (`cobalt-ink`) for headlines and **Sign Haze** (`cobalt-ink-2`) for secondary copy. **Cobalt Wash** (`cobalt-tint`) is the hover fill for drop zones and the on-cobalt button.

### Secondary
- **Signal Yellow** (`signal`) with **Signal Ink** (`signal-ink`): the primary action ("Start a room", "Save", "Accept"), live indicators (a solid yellow lamp with an ink label when connected, pulsing while reconnecting; the same lamp marks a person's direct or relay link), the "you" stop and "You" tag, the final stop on a step line, progress bars and in-flight status on the board, the focus ring, and text selection.

### Tertiary
- **Board Stop** (`board-stop`): failed status on the departures board, a lighter red that holds contrast on near-black.
- **Stop Red** (`stop`) with **Stop Wash** (`stop-tint`): destructive buttons (End room), invalid code cells, dropped-link status.

### Neutral
- **Platform Concrete** (`ground`): page ground behind everything.
- **Enamel** (`panel`) and **Enamel Shade** (`panel-2`): panels, footer, FAQ band; shade for inset wells and drop zones.
- **Line Ink** (`ink`), **Timetable Grey** (`ink-2`), **Fine Print** (`ink-3`): primary text, body copy, hints and placeholders.
- **Rule** (`rule`) and **Rule Strong** (`rule-strong`): hairline dividers; field and outline-button borders.
- **Departures Black** (`board`), **Board Row** (`board-2`), **Board White** (`board-ink`), **Board Grey** (`board-ink-2`), **Board Rule** (`board-rule`): the departures board and anything styled as it (ended-room banner, "it never sees" column).

Dark theme keeps every name and swaps values (ground `#0a0d14`, panel `#121722`, cobalt lifts to `#2f52e0`); see the sidecar.

### Named Rules
**The One Line Rule.** Cobalt is the only hue that identifies Hop. No second brand colour, no gradient between colours. A surface is either on the sign (cobalt), on the platform (ground/enamel), or on the board (near-black).

**The Signal Rule.** Yellow means "live" or "press this next". At most one yellow button per view region; never use yellow as decoration or as a section background.

## Typography

**Display Font:** Barlow Semi Condensed 600/700 (with Barlow, ui-sans-serif)
**Body Font:** Barlow 400/500/600/700 (with ui-sans-serif, system-ui)
**Label/Mono Font:** none distinct; tabular numerals (`tnum`) on Barlow stand in for mono on clocks, sizes, codes and percentages. Prose `code` falls back to ui-monospace.

**Character:** Engineered wayfinding lettering: condensed, bold, tightly set headings read like enamel signs; plain Barlow carries the reading with an even, civic voice.

### Hierarchy
- **Display** (700, clamp(3rem, 7.4vw, 5.75rem), 0.92, -0.02em): landing hero headline on the cobalt sign only. Article heroes use 3rem to 4.5rem at 0.95.
- **Headline** (700, 2.25rem to 3rem, 1.02): section titles ("Three stops from open to arrived"), closing sign up to 3.75rem.
- **Title** (700, 1.25rem to 1.5rem, ~1.2): stop names, panel and board headings ("Departures", "On this line"), dialog titles.
- **Body** (400, 1rem to 1.25rem; prose 1.0625rem / 1.65): body copy in `ink-2`, ledes up to 1.25rem. Prose capped at 68ch.
- **Label** (600, 0.875rem): field labels, status lines, "Send to".
- **Code** (700 condensed, 0.08em tracking, tabular): room codes in the header chip (1.25rem), rejoin plate (3rem), code cells (1.5rem to 2.25rem).

### Named Rules
**The Sign Lettering Rule.** All h1–h3 are set in Barlow Semi Condensed bold with balanced wrapping and slight negative tracking. Body never uses the condensed face.

**The Timetable Rule.** Any number that changes or aligns (clock, size, %, ETA, count, code) uses tabular numerals.

## Layout

Bands, not cards. Pages stack full-width bands that alternate ground and enamel (landing: cobalt sign, ground, enamel, ground, enamel, ground with closing sign), each with a 80rem max container, 16px side gutter on mobile and 32px from `sm`. Vertical rhythm is 80px per band on mobile, 112px on desktop. The hero is a two-column grid (1.15fr / 1fr) from `lg`, stacking headline-over-demo below.

The room uses a wider 90rem container: a sticky 18rem sidebar (line map, preferences) and a fluid main column (composer over departures board) from `lg`; on mobile the sidebar drops below the main column. Prose pages sit in a 68ch column on enamel under a cobalt hero. Step lines run vertically on mobile and horizontally across three columns from `md`.

## Elevation & Depth

Predominantly flat with tonal layering: ground, enamel and board are separated by colour and 1px rules, not shadows. The sign's depth comes from its inset keyline, not a drop shadow. A single soft lift is used for surfaces that float: the hero demo over the cobalt sign, dialogs, and toasts.

### Shadow Vocabulary
- **Lift** (`box-shadow: 0 2px 4px rgb(15 20 32 / 0.06), 0 12px 32px rgb(15 20 32 / 0.12)`): hero demo, dialog, toast.
- **Rest** (`box-shadow: 0 1px 2px rgb(15 20 32 / 0.06), 0 2px 8px rgb(15 20 32 / 0.06)`): defined, available for small resting elements; use sparingly.
- **Sign keyline** (`box-shadow: inset 0 0 0 6px var(--cobalt), inset 0 0 0 8px rgb(255 255 255 / 0.92)`): the enamel-sign frame; `sign-tight` uses 4px / 5.5px for small plates.

### Named Rules
**The Enamel Rule.** Panels sit flat on the platform with a 1px rule. Shadow is earned only by floating over another surface.

## Shapes

Firm, lightly softened rectangles. Signs, panels, the board and dialogs share a 10px corner; buttons and fields 6px; pictogram tiles and code cells 5px; tags 3px. Circles are reserved for the line vocabulary: stops (ringed with a 5px cobalt border, enamel centre), the yellow "you" / arrival pip, the FAQ plus-disc, and live dots. Line bars are 6px wide with fully rounded ends. Offline or empty stops use a dashed ring. Drop zones are 2px dashed.

## Components

### Buttons
Solid, wayfinding-plain, pressed rather than glowing.
- **Shape:** gently squared (6px), 44px default height, 36px small, 56px large, 36px square icon.
- **Signal (primary action):** yellow fill, signal-ink text, weight 600. Hover lightens to `#ffd23f`.
- **Primary (cobalt):** cobalt fill, white text; hover to cobalt-deep. Used off the sign (404, room actions, send arrow).
- **Outline:** enamel fill, rule-strong border; hover to ink-3 border and enamel shade.
- **Ghost:** ink-2 text, hover to ink with a rule-tinted wash.
- **On-cobalt / cobalt-ghost:** on sign fields, white fill with cobalt text, or transparent with a 40% white border.
- **Board:** transparent on the board with a board-rule border; hover to board-row.
- **Danger:** stop red, white text (End room).
- **States:** 150ms colour transitions on `ease-out`; `:active` nudges down 1px; disabled at 45% opacity. Focus is the global 3px signal-yellow outline at 2px offset.

### Inputs / Fields
- **Style:** enamel fill, 1px rule-strong border, 6px corner, 44px height, 16px text.
- **Focus:** border turns cobalt with a 3px cobalt halo at 25% mix.
- **Code input:** six separate cells over one real input. On panel: rule-strong border, ink-3 when filled, cobalt when active. On cobalt: 35% white border on a 10% white wash, signal-yellow when active. Invalid turns all cells stop red.

### Cards / Containers
- **Sign:** cobalt field, 10px corner, inset white keyline. Used for heroes, the closing call to action, the 404 "Platform" plate and the rejoin plate.
- **Panel:** enamel, 1px rule, 10px corner, 16–20px padding. Holds the composer, line map and preferences.
- **Corner / Shadow:** flat at rest (see Elevation).

### Navigation
Header is 64px (80px from `sm`), logo left, ghost links plus one "Start a room" button right; secondary links hide below `sm`. On the cobalt hero the header shares the sign colour and switches to on-cobalt buttons. The room header is a sticky enamel bar with the room code as a cobalt chip (condensed, tracked, tabular) that copies on click.

### Departures Board (signature)
Near-black board, 10px corner, condensed "Departures" heading over rows divided by board rules. A column header row (Time · Item · From / To · Status) heads the board from `sm`. Each row: 24-hour clock (tabular, board-grey; folded into the meta line on mobile), type tile, file name, to/from, status at right. Live status and progress are signal yellow; a 3px yellow progress bar runs along the row's bottom edge. Finished states drop to board-white or board-grey. Rows enter with `flap-in` (320ms clip-path reveal from the top, like a flap turning over).

### Line Map (signature)
A 6px cobalt bar with ringed stops. Your stop carries a yellow centre pip, the host gets an extra outer ring (interchange), offline people show a dashed grey ring. Tags beside names: "Host" in cobalt, "You" in yellow. The same vocabulary draws the landing's three steps, with the final stop marked yellow.

### Pictogram Tile
40px cobalt square, 5px corner, white 20px line icon. Used for service listings and the file drop zone (48px).

## Do's and Don'ts

### Do:
- **Do** put the most important statement on a full cobalt sign with the inset white keyline (6px cobalt, 2px white).
- **Do** keep signal yellow for the one primary action and for live state, progress and "you".
- **Do** draw sequences and groups of people as a metro line: 6px cobalt bar, 5px-ringed enamel stops.
- **Do** show any list of transfers as the departures board, with tabular numerals and flap-in rows.
- **Do** set h1–h3 in Barlow Semi Condensed bold and body in Barlow; cap prose at 68ch.
- **Do** separate bands by alternating ground and enamel with 1px rules instead of shadows.
- **Do** respect reduced motion: the hero demo freezes on a still frame and animations collapse to near-zero.

### Don't:
- **Don't** use gradients, glows or frosted glass over colour fields; the dark-glass "magic file drop" hero is the explicit anti-reference.
- **Don't** introduce a second brand hue or tint the ground with cobalt.
- **Don't** use yellow as decoration, a section fill, or on more than one button in the same region.
- **Don't** use the departures-board black for generic dark sections; it appears only where it carries transfer or "never sees" content.
- **Don't** drop shadows on resting panels.
- **Don't** add uppercase, letter-spaced labels above headings; the sign lettering carries hierarchy on its own.
