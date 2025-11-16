"use client";
import type React from "react";
import { useEffect, useRef } from "react";
import { connectWS } from "@/lib/beamshare-client";
import { useRouter } from "next/navigation";
import { Peer, useBeamShareSession } from "@/context/BeamShareSessionContext";
import { toast } from "sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const {
    resetSession,
    setSession,
    addPeer,
    removePeer,
    state,
    resetPeers,
    getPeer,
    isLoading
  } = useBeamShareSession();

  const router = useRouter();

  // Use refs to always have the latest functions
  const resetSessionRef = useRef(resetSession);
  const setSessionRef = useRef(setSession);
  const addPeerRef = useRef(addPeer);
  const removePeerRef = useRef(removePeer);
  const routerRef = useRef(router);
  const stateRef = useRef(state);
  const resetPeersRef = useRef(resetPeers);
  const getPeerRef = useRef(getPeer);

  // Update refs whenever the functions change
  useEffect(() => {
    resetSessionRef.current = resetSession;
    setSessionRef.current = setSession;
    addPeerRef.current = addPeer;
    removePeerRef.current = removePeer;
    routerRef.current = router;
    stateRef.current = state;
    resetPeersRef.current = resetPeers;
    getPeerRef.current = getPeer;
  }, [
    resetSession,
    setSession,
    addPeer,
    removePeer,
    state,
    resetPeers,
    router,
  ]);

  useEffect(() => {
    async function initSocket() {
      const getToken = async (): Promise<string> => {
        const response = await fetch("/api/generate-token");
        if (!response.ok) {
          throw new Error("Failed to generate token");
        }

        const data = await response.json();
        return data.token;
      };
      const token = await getToken();
      connectWS(token);
    }
    initSocket();
  }, [router, isLoading]);

  useEffect(() => {
    const setClientId = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      // resetSessionRef.current();
      setSessionRef.current(state.sessionId!, data.clientId, state.isHost!, state.startedAt!);
    };

    const sessionJoinedHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      // Update session with full session info for the joining peer
      setSessionRef.current(
        data.sessionId,
        data.clientId,
        false,
        new Date().toISOString()
      );
      // Also add the peer to the connected peers list
      for (const peer of data.connectedPeers as Peer[])
        addPeerRef.current({ clientId: peer.clientId, name: peer.name });
    };

    const newPeerHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      addPeerRef.current({ clientId: data.clientId, name: data.name });
    };


    const peerLeftHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      const peerLeaving = getPeerRef.current(data.clientId);
      removePeerRef.current(data.clientId);

      toast.info(`${peerLeaving?.name || "Peer"} left.`);
    };

    window.addEventListener("beamshare:session-joined", sessionJoinedHandler);
    window.addEventListener("beamshare:new-peer", newPeerHandler);
    window.addEventListener("beamshare:client-id", setClientId);
    window.addEventListener("beamshare:peer-left", peerLeftHandler);

    return () => {
      window.removeEventListener("beamshare:client-id", setClientId);
      window.removeEventListener(
        "beamshare:session-joined",
        sessionJoinedHandler
      );
      window.removeEventListener("beamshare:new-peer", newPeerHandler);
      window.removeEventListener("beamshare:peer-left", peerLeftHandler);
    };
  }, [isLoading]); // Empty deps is fine now because we use refs

  useEffect(() => {
    const sessionEndedHandler = () => {
      resetSessionRef.current();
      toast.error("Session Terminated", {
        description: "The session has closed",
      });
      resetPeersRef.current();
      setSessionRef.current("", stateRef.current.clientId!, false, "");
      routerRef.current.push("/terminated");
    };

    window.addEventListener("beamshare:session-ended", sessionEndedHandler);

    return () => {
      window.removeEventListener(
        "beamshare:session-ended",
        sessionEndedHandler
      );
    };
  }, []); // Empty deps is fine now because we use refs

  return <div>{children}</div>;
}
