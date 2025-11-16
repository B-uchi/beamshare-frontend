"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BeamShareClient } from "@/lib/beamshare-client";
import { useBeamShareSession } from "@/context/BeamShareSessionContext";

export default function LandingPage() {
  const { state } = useBeamShareSession();
  useEffect(() => {
    BeamShareClient.destroySession(state.sessionId!, state.clientId!);
  });
  const [joinCode, setJoinCode] = useState("");

  return (
    <main className="min-h-screen w-full overflow-hidden bg-background">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="max-w-2xl w-full space-y-12 text-center">
          {/* Header */}
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
              Beam files <span className="gradient-text">instantly</span>
            </h1>
            <p className="text-lg text-muted max-w-xl mx-auto">
              Peer-to-peer file sharing. No cloud. No trace. Just direct
              transfers.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors font-medium"
            >
              Create Session <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/join"
              className="inline-flex items-center justify-center px-6 py-3 bg-surface border border-border text-foreground rounded-lg hover:bg-surface-hover transition-colors font-medium"
            >
              Join Session
            </Link>
          </div>

          {/* Quick Join */}
          <div className="glass p-6 sm:p-8 max-w-sm mx-auto glow-soft space-y-4">
            <label
              htmlFor="quick-code"
              className="block text-sm font-medium text-muted"
            >
              Or join with code
            </label>
            <div className="flex gap-2">
              <input
                id="quick-code"
                type="text"
                placeholder="Session code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="flex-1 px-3 py-2 bg-surface border border-border text-foreground rounded-lg placeholder-muted/50 focus:outline-none focus:border-primary transition-colors text-sm"
              />
              <Link
                href={joinCode ? `/join?code=${joinCode}` : "/join"}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors font-medium text-sm"
              >
                Join
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
