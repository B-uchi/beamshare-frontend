"use client";
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";

// ----------------------------
// TYPES
// ----------------------------
export interface Peer {
  clientId: string;
  name: string;
}

export interface SessionState {
  sessionId: string | null;
  clientId: string | null;
  connectedPeers: Peer[];
  isHost: boolean;
  startedAt: string;
}

interface BeamShareContextType {
  state: SessionState;
  isLoading: boolean;
  setSession: (
    sessionId: string,
    clientId: string,
    isHost: boolean,
    startedAt: string
  ) => void;
  addPeer: (peer: Peer) => void;
  removePeer: (clientId: string) => void;
  resetSession: () => void;
  resetPeers: () => void;
  getPeer: (clientId: string) => Peer | null;
}

const BeamShareContext = createContext<BeamShareContextType | undefined>(
  undefined
);

export const BeamShareProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [state, setState] = useState<SessionState>({
    sessionId: null,
    clientId: null,
    connectedPeers: [],
    startedAt: "",
    isHost: false,
  });

  // Track if initial load is complete
  const isInitialized = useRef(false);

  // Initialize from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("sessionData");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SessionState;
        setState({
          ...parsed,
          isHost: parsed?.isHost || false,
        });
        setIsLoading(false)
      } catch (err) {
        console.warn("Failed to parse sessionData from localStorage", err);
      }
    }
    // Mark as initialized after attempting to restore
    isInitialized.current = true;
  }, []);

  // Persist to localStorage whenever state changes (but only after initialization)
  useEffect(() => {
    if (!isInitialized.current) {
      // Skip persistence on initial render
      return;
    }
    localStorage.setItem("sessionData", JSON.stringify(state));
  }, [state]);

  const setSession = (
    sessionId: string,
    clientId: string,
    isHost: boolean,
    startedAt: string
  ) => {
    setState((prev) => ({ ...prev, sessionId, clientId, isHost, startedAt }));
  };

  const addPeer = (peer: Peer) => {
    setState((prev) => {
      // prevent duplicates
      if (prev.connectedPeers.find((p) => p.clientId === peer.clientId)) {
        return prev;
      }
      return { ...prev, connectedPeers: [...prev.connectedPeers, peer] };
    });
  };

  const removePeer = (clientId: string) => {
    setState((prev) => ({
      ...prev,
      connectedPeers: prev.connectedPeers.filter(
        (p) => p.clientId !== clientId
      ),
    }));
  };

  const getPeer = (clientId: string): Peer | null => {
    return (
      state.connectedPeers.find((peer) => peer.clientId == clientId) || null
    );
  };

  const resetPeers = () => {
    setState((prev) => ({
      ...prev,
      connectedPeers: [],
    }));
  };

  const resetSession = () => {
    setState({
      sessionId: null,
      clientId: null,
      connectedPeers: [],
      startedAt: "",
      isHost: false,
    });
    localStorage.removeItem("sessionData");
  };

  return (
    <BeamShareContext.Provider
      value={{
        state,
        isLoading,
        setSession,
        addPeer,
        removePeer,
        resetSession,
        resetPeers,
        getPeer,
      }}
    >
      {children}
    </BeamShareContext.Provider>
  );
};

export const useBeamShareSession = (): BeamShareContextType => {
  const context = useContext(BeamShareContext);
  if (!context) {
    throw new Error(
      "useBeamShareSession must be used within a BeamShareProvider"
    );
  }
  return context;
};
