import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Semi_Condensed } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import { HopProvider } from "@/components/hop-provider";
import "./globals.css";

const barlow = Barlow({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-barlow",
});

const barlowCondensed = Barlow_Semi_Condensed({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-barlow-condensed",
});

export const metadata: Metadata = {
  title: { default: "Hop: send files straight to another browser", template: "%s · Hop" },
  description:
    "Hop sends files and text directly from your browser to theirs. No uploads, no accounts, nothing stored on a server.",
  applicationName: "Hop",
  openGraph: {
    title: "Hop: direct service, no stops in between",
    description: "Send files straight from your browser to theirs. No uploads, no accounts.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eceef1" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0d14" },
  ],
};

const CONTRACT = `<!--
THESIS: Hop is a direct line between browsers; the site is that line's station signage. Refuses the dark-glass gradient "magic file drop" hero.
OWN-WORLD: Enamel-white panels on platform-concrete ground, one cobalt line colour on large sign fields with an inset white keyline, signal yellow only for live/primary, Barlow / Barlow Semi Condensed lettering, a dark departures board for transfers, metro line diagrams for people and steps.
STORY: Visitor learns files go straight across with nothing stored, sees it run, opens a room or boards with a code.
FIRST VIEWPORT: Full-bleed cobalt sign: headline left, yellow "Start a room" + code entry beneath; right, a live line between two stops with a file hopping across over a mini departures board.
FORM: Direct Service (station signage), grounded list #5, seed 8b0ab7e7.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
-->`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body className="min-h-dvh">
        <div hidden dangerouslySetInnerHTML={{ __html: CONTRACT }} />
        <HopProvider>{children}</HopProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast:
                "!bg-panel !text-ink !border !border-rule !rounded-md !shadow-[var(--shadow-2)] !font-sans",
              description: "!text-ink-2",
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
