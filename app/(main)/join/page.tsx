"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BeamShareClient } from "@/lib/beamshare-client";
import { toast } from "sonner";
import { useBeamShareSession } from "@/context/BeamShareSessionContext";

export default function JoinSessionPage() {
  const {resetSession} = useBeamShareSession()
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sessionCode, setSessionCode] = useState("");
  const [userName, setUserName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code) {
      setSessionCode(code.toUpperCase());
    }
  }, [searchParams]);

  const handleJoin = async () => {
    if (!sessionCode.trim()) {
      alert("Please enter a session code");
      return;
    }
    setIsLoading(true);
    BeamShareClient.joinSession(sessionCode, userName || "Guest");
  };

  useEffect(() => {
    const sessionNotFoundHandler = () => {
      setIsLoading(false);
      resetSession()
      toast.error("Session error", {
        description: "Session not found",
      });
    };

    const sessionJoinedHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      setIsLoading(false);
      router.push(`/session/${data.sessionId}?user=${userName || "Guest"}`);
    };

    const reconnectedHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      
      // If we successfully reconnected as a peer
      if (data.success !== false && data.sessionId) {
        setIsLoading(false);
        router.push(`/session/${data.sessionId}?user=${userName || "Guest"}`);
      }
    };

    const hostReconnectedHandler = (e: Event) => {
      // Host has reconnected - we might need to reestablish connections
      console.log("Host reconnected, preparing to reestablish connections");
    };

    window.addEventListener("beamshare:session-joined", sessionJoinedHandler);
    window.addEventListener("beamshare:session-not-found", sessionNotFoundHandler);
    window.addEventListener("beamshare:reconnected", reconnectedHandler);
    window.addEventListener("beamshare:host-reconnected", hostReconnectedHandler);

    return () => {
      window.removeEventListener("beamshare:session-not-found", sessionNotFoundHandler);
      window.removeEventListener("beamshare:session-joined", sessionJoinedHandler);
      window.removeEventListener("beamshare:reconnected", reconnectedHandler);
      window.removeEventListener("beamshare:host-reconnected", hostReconnectedHandler);
    };
  }, [router, userName]);

  return (
    <main className="min-h-screen w-full overflow-hidden bg-background flex items-center justify-center px-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <Link
        href="/"
        className="fixed top-6 left-6 z-20 p-2 text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

      <div className="relative z-10 w-full max-w-sm space-y-8 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Join Session</h1>
          <p className="text-sm text-muted">Enter a session code to connect</p>
        </div>

        <div className="glass p-8 space-y-6">
          <div className="space-y-2">
            <label htmlFor="code" className="block text-sm font-medium">
              Session Code
            </label>
            <input
              id="code"
              type="text"
              placeholder="ABC123"
              value={sessionCode}
              disabled={isLoading}
              onChange={(e) => setSessionCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={6}
              className="w-full px-3 py-2 bg-surface border border-border text-foreground rounded-lg placeholder-muted/50 focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter your name"
              value={userName}
              disabled={isLoading}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-3 py-2 bg-surface border border-border text-foreground rounded-lg placeholder-muted/50 focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={isLoading || !sessionCode}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light disabled:opacity-50 transition-colors font-medium"
        >
          {isLoading ? "Connecting..." : "Join Session"}
          <ArrowRight className="w-4 h-4" />
        </button>

        <p className="text-xs text-muted text-center">
          Don't have a code?{" "}
          <Link href="/create" className="text-secondary hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
