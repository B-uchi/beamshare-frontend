import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { BeamShareProvider } from "@/context/BeamShareSessionContext";
import { Toaster } from "sonner";

const spaceGrotesk = Geist({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});
const satoshi = Geist_Mono({ subsets: ["latin"], variable: "--font-satoshi" });

export const metadata: Metadata = {
  title: "BeamShare - Instant P2P File Sharing",
  description: "Beam files instantly. No cloud. No trace.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Satoshi:wght@400;500;700&display=swap"
          rel="preload"
          as="font"
          crossOrigin="anonymous"
        />
      </head>
      <BeamShareProvider>
        <body
          className={`${spaceGrotesk.className} ${satoshi.variable} font-sans antialiased bg-background text-foreground`}
        >
          <Toaster />
          {children}
          <Analytics />
        </body>
      </BeamShareProvider>
    </html>
  );
}
