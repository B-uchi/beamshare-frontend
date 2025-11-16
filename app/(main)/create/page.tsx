"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Loader2 } from "lucide-react";
import { BeamShareClient } from "@/lib/beamshare-client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useBeamShareSession } from "@/context/BeamShareSessionContext";

export default function CreateSessionPage() {
  const { state, setSession, resetSession, addPeer, removePeer } = useBeamShareSession();
  const connectedPeers = state.connectedPeers;
  const [isLoading, setIsloading] = useState(true);
  const [sessionCode, setSessionCode] = useState("");
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let interval = setInterval(() => {
      if (BeamShareClient.isWSOpen()) {
        resetSession()
        BeamShareClient.createSession();
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const sessionCreatedHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      setSessionCode(data.sessionId);
      setIsloading(false);
      setSession(data.sessionId, data.clientId, data.isHost, data.startedAt);
    };

    const hostReconnectedHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      
      // Update session with existing peers
      if (data.connectedPeers) {
        // Reset peers first, then add existing ones
        resetSession();
        setSession(data.sessionId, data.clientId, true, state.startedAt);
        data.connectedPeers.forEach((peer: any) => {
          addPeer(peer);
        });
      }
      setIsloading(false);
    };

    const newPeerHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      addPeer({ clientId: data.clientId, name: data.name });
    };

    const peerLeftHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      removePeer(data.clientId);
    };

    const peerReconnectedHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      
      // Add the peer back if they're not already in the list
      if (!state.connectedPeers.find(p => p.clientId === data.clientId)) {
        addPeer({ clientId: data.clientId, name: data.name });
      }
    };

    window.addEventListener("beamshare:session-created", sessionCreatedHandler);
    window.addEventListener("beamshare:host-reconnected", hostReconnectedHandler);
    window.addEventListener("beamshare:new-peer", newPeerHandler);
    window.addEventListener("beamshare:peer-left", peerLeftHandler);
    window.addEventListener("beamshare:peer-reconnected", peerReconnectedHandler);

    return () => {
      window.removeEventListener("beamshare:session-created", sessionCreatedHandler);
      window.removeEventListener("beamshare:host-reconnected", hostReconnectedHandler);
      window.removeEventListener("beamshare:new-peer", newPeerHandler);
      window.removeEventListener("beamshare:peer-left", peerLeftHandler);
      window.removeEventListener("beamshare:peer-reconnected", peerReconnectedHandler);
    };
  }, [state.startedAt, state.connectedPeers]);

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="min-h-screen w-full overflow-hidden bg-background">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <Link
        href="/"
        className="fixed top-6 left-6 z-20 p-2 text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="max-w-sm w-full space-y-8 animate-fade-in">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold">Ready to Share</h1>
            <p className="text-sm text-muted">Your session is live</p>
          </div>

          <div className="glass p-8 space-y-4 glow-soft">
            <p className="text-sm text-muted text-center">Share this code</p>
            <div className="flex items-center gap-2 bg-surface/50 rounded-lg p-4 border border-border">
              {isLoading ? (
                <div className="w-full grid place-items-center">
                  <Loader2 className="size-5 animate-spin" />
                </div>
              ) : (
                <>
                  <code className="flex-1 text-lg font-mono font-bold text-primary">
                    {sessionCode}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="p-2 hover:bg-surface rounded transition-colors text-muted hover:text-foreground"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-secondary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Connected users */}
          <div className="text-center space-y-2">
            <p className="text-sm text-muted">
              Connected: {connectedPeers.length || 0}
            </p>
            <div className="flex justify-center gap-2">
              {connectedPeers.map((peer) => (
                <div
                  key={peer.clientId}
                  className="w-8 h-8 bg-linear-to-br from-primary to-secondary rounded-full opacity-70 text-white grid place-items-center"
                >
                  {peer.name.charAt(0).toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-2">
            <Button
              disabled={isLoading}
              onClick={() => {
                router.push(`/session/${sessionCode}`);
              }}
              className="block w-full px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors font-medium text-center"
            >
              Start Sharing
            </Button>
            <button
              onClick={() => (window.location.href = "/")}
              className="w-full px-6 py-3 bg-surface border border-border text-foreground rounded-lg hover:bg-surface-hover transition-colors font-medium"
            >
              Back Home
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
