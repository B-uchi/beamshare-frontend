import Link from "next/link";
import {
  ArrowRight,
  ArrowLeftRight,
  QrCode,
  MessageSquareText,
  RefreshCw,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { HeroJoin } from "@/components/landing/hero-join";
import { HeroDemo } from "@/components/landing/hero-demo";
import { ResumeBanner } from "@/components/landing/resume-banner";

const STOPS = [
  {
    name: "Open a room",
    body: "One tap gets you a six-character code and a QR code. No sign-up.",
  },
  {
    name: "Bring them aboard",
    body: "They type the code, open your link, or scan the QR from your screen. Any modern browser works, so there's nothing to install.",
  },
  {
    name: "Send anything",
    body: "Files or text, to everyone in the room or to one person. It goes straight from your browser to theirs.",
  },
];

const SERVICES = [
  {
    icon: ArrowLeftRight,
    name: "Any direction",
    body: "Everyone in a room can send. Pick everyone, or one person.",
  },
  {
    icon: QrCode,
    name: "Phone to laptop",
    body: "Scan the room's QR code to bring a phone aboard in seconds.",
  },
  {
    icon: MessageSquareText,
    name: "Text drops",
    body: "Send a link, an address or a note, then copy it on the other side.",
  },
  {
    icon: RefreshCw,
    name: "Holds through drops",
    body: "If someone refreshes, their phone sleeps or the Wi-Fi switches, Hop reconnects and carries on.",
  },
  {
    icon: ShieldCheck,
    name: "Ask first",
    body: "Turn off auto-accept to approve each incoming file before it arrives.",
  },
  {
    icon: Lock,
    name: "Host controls",
    body: "Lock the room once everyone's in, remove someone, or end it for all.",
  },
];

const FAQ = [
  {
    q: "Is there a file size limit?",
    a: "There's no fixed limit. Received files are held in your browser's memory until you save them, so a phone may struggle with files over a couple of gigabytes. Laptops handle far more.",
  },
  {
    q: "Do both people need the room open?",
    a: "Yes. Transfers are live, browser to browser, so the sender and receiver both need the room open while a file is moving. Nothing waits on a server for later.",
  },
  {
    q: "Is it encrypted?",
    a: "Yes. WebRTC encrypts every data channel with DTLS, so files and text are encrypted between the two browsers. The signaling server only passes along connection setup messages.",
  },
  {
    q: "Why won't two devices connect?",
    a: "Some office and mobile networks block direct connections between devices. Hop keeps retrying, and if a relay (TURN) server is configured it falls back to that. The relay still only sees encrypted traffic.",
  },
];

export default function LandingPage() {
  return (
    <>
      <ResumeBanner />
      <div className="relative bg-cobalt text-cobalt-ink">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2 rounded-[14px] border-2 border-white/90 sm:inset-4"
        />
        <SiteHeader tone="cobalt" />

        <section className="mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-8 sm:px-8 sm:pb-24 sm:pt-12 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-16 lg:pb-28">
          <div className="space-y-8">
            <h1 className="font-display text-[clamp(3rem,7.4vw,5.75rem)] font-bold leading-[0.92] tracking-[-0.02em]">
              Direct service.
              <br />
              No stops in between.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-cobalt-ink-2 sm:text-xl">
              Hop sends files and text straight from your browser to theirs. Nothing is uploaded,
              nothing is stored, and nobody needs an account.
            </p>
            <HeroJoin />
          </div>
          <HeroDemo />
        </section>
      </div>

      <main>
        <section aria-labelledby="stops-title" className="bg-ground">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28">
            <h2 id="stops-title" className="max-w-2xl text-4xl font-bold leading-[1.02] sm:text-5xl">
              Three stops from open to arrived
            </h2>

            <div className="relative mt-14">
            <div
              aria-hidden
              className="absolute bottom-3 left-[13px] top-3 w-[6px] rounded-full bg-cobalt md:bottom-auto md:left-[13px] md:right-[calc(33.333%-13px)] md:top-[13px] md:h-[6px] md:w-auto"
            />
            <ol className="relative grid gap-10 md:grid-cols-3 md:gap-8">
              {STOPS.map((stop, i) => (
                <li key={stop.name} className="relative pl-12 md:pl-0 md:pt-12">
                  <span
                    aria-hidden
                    className="absolute left-0 top-0 grid size-8 place-items-center rounded-full border-[5px] border-cobalt bg-panel md:left-0"
                  >
                    {i === STOPS.length - 1 && <span className="size-2.5 rounded-full bg-signal" />}
                  </span>
                  <h3 className="text-2xl font-bold">{stop.name}</h3>
                  <p className="mt-2 max-w-sm text-ink-2">{stop.body}</p>
                </li>
              ))}
            </ol>
            </div>
          </div>
        </section>

        <section aria-labelledby="server-title" className="border-y border-rule bg-panel">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-8 sm:py-28">
            <h2 id="server-title" className="max-w-3xl text-4xl font-bold leading-[1.02] sm:text-5xl">
              What the server sees, and what it never does
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-ink-2">
              Browsers can&rsquo;t find each other on their own, so a small signaling server introduces
              them. After that, it stays out of the way.
            </p>

            <div className="mt-12 grid overflow-hidden rounded-[var(--radius-sign)] border border-rule md:grid-cols-2">
              <div className="bg-panel-2 p-6 sm:p-8">
                <h3 className="text-xl font-bold">The signaling server knows</h3>
                <ul className="mt-5 space-y-4 text-ink-2">
                  <li className="flex gap-3">
                    <Dot />
                    That a room with your code exists, until it ends
                  </li>
                  <li className="flex gap-3">
                    <Dot />
                    The display names people choose
                  </li>
                  <li className="flex gap-3">
                    <Dot />
                    Connection setup messages, including network addresses so browsers can reach each other
                  </li>
                </ul>
              </div>
              <div className="bg-board p-6 text-board-ink sm:p-8">
                <h3 className="text-xl font-bold">It never sees</h3>
                <ul className="mt-5 space-y-4 text-board-ink-2">
                  <li className="flex gap-3">
                    <Dot filled />
                    Your files, their names or their sizes
                  </li>
                  <li className="flex gap-3">
                    <Dot filled />
                    Any text you send
                  </li>
                  <li className="flex gap-3">
                    <Dot filled />
                    Anything after the room ends. Rooms live only in memory and nothing is written to disk.
                  </li>
                </ul>
              </div>
            </div>
            <p className="mt-5 text-sm text-ink-3">
              Read the details in{" "}
              <Link href="/how-it-works" className="font-semibold text-cobalt underline underline-offset-4">
                How it works
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-semibold text-cobalt underline underline-offset-4">
                Privacy
              </Link>
              .
            </p>
          </div>
        </section>

        <section aria-labelledby="services-title" className="bg-ground">
          <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
              <h2 id="services-title" className="text-4xl font-bold leading-[1.02] sm:text-5xl">
                On this service
              </h2>
              <p className="mt-4 max-w-sm text-lg text-ink-2">
                What a room can do, from a quick phone-to-laptop hop to a table of people swapping files.
              </p>
            </div>
            <dl className="divide-y divide-rule border-y border-rule">
              {SERVICES.map(({ icon: Icon, name, body }) => (
                <div key={name} className="grid grid-cols-[2.5rem_1fr] items-start gap-x-5 gap-y-1 py-5 sm:grid-cols-[2.5rem_12rem_1fr]">
                  <span className="picto row-span-2 sm:row-span-1">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <dt className="pt-1 text-lg font-bold leading-tight sm:pt-2">{name}</dt>
                  <dd className="text-ink-2 sm:pt-2">{body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section aria-labelledby="faq-title" className="border-t border-rule bg-panel">
          <div className="mx-auto max-w-3xl px-4 py-20 sm:px-8 sm:py-28">
            <h2 id="faq-title" className="text-4xl font-bold leading-[1.02] sm:text-5xl">
              Before you board
            </h2>
            <div className="mt-10 divide-y divide-rule border-y border-rule">
              {FAQ.map(({ q, a }) => (
                <details key={q} className="group py-1">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                    {q}
                    <span
                      aria-hidden
                      className="grid size-7 flex-none place-items-center rounded-full border-2 border-cobalt text-cobalt transition-transform duration-200 group-open:rotate-45"
                    >
                      <svg viewBox="0 0 12 12" className="size-3">
                        <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </span>
                  </summary>
                  <p className="pb-5 pr-12 leading-relaxed text-ink-2">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-ground px-4 py-16 sm:px-8 sm:py-24">
          <div className="sign mx-auto flex max-w-7xl flex-col items-start gap-8 p-10 sm:p-14 md:flex-row md:items-center md:justify-between">
            <h2 className="text-4xl font-bold leading-none sm:text-6xl">Open a line. Nothing stored.</h2>
            <Link href="/new" className="btn btn-signal btn-lg text-lg">
              Start a room <ArrowRight className="size-5" aria-hidden />
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

function Dot({ filled }: { filled?: boolean }) {
  return (
    <span
      aria-hidden
      className={
        filled
          ? "mt-[0.35rem] size-3 flex-none rounded-full bg-signal"
          : "mt-[0.35rem] size-3 flex-none rounded-full border-[3px] border-cobalt"
      }
    />
  );
}
