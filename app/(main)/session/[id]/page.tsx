"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { SessionHeader } from "@/components/session-header";
import { FileTransferCard } from "@/components/file-transfer-card";
import { UserPanel } from "@/components/user-panel";
import { GlowButton } from "@/components/glow-button";
import { Upload, Send, Users } from "lucide-react";
import { Peer, useBeamShareSession } from "@/context/BeamShareSessionContext";
import { BeamShareClient } from "@/lib/beamshare-client";
import { DurationSince } from "@/components/duration-since";
import { toast } from "sonner";

interface FileTransfer {
  id: string;
  filename: string;
  size: number;
  sizeFormatted: string;
  progress: number;
  status: "pending" | "transferring" | "completed" | "failed" | "cancelled";
  recipient?: string;
  sender?: string;
  direction: "sent" | "received";
  file?: File;
  receivedChunks?: Uint8Array[];
  totalChunks?: number;
  receivedChunkCount?: number;
}

interface SessionStats {
  totalTransferred: number;
  completedFiles: number;
  activeTransfers: number;
}

const CHUNK_SIZE = 65536; // 64KB chunks (increased from 16KB for better performance)
const MAX_CONCURRENT_CHUNKS = 4; // Send multiple chunks in parallel

export default function SessionRoomPage() {
  const { state, resetPeers, setSession, isLoading, addPeer } = useBeamShareSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const sessionCode = params.id as string;
  const userName = searchParams.get("user") || "Guest";
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [transfers, setTransfers] = useState<FileTransfer[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    totalTransferred: 0,
    completedFiles: 0,
    activeTransfers: 0,
  });
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState<string>("all");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Format bytes to human readable
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Handle reconnection on mount (only for actual page refreshes)
  useEffect(() => {
    const handleReconnect = async () => {
      // Only attempt reconnect if:
      // 1. We have session data in state (from localStorage)
      // 2. The WebSocket is NOT already connected
      // 3. The session matches the current URL
      if (state.sessionId && state.clientId && state.sessionId === sessionCode) {
        // Check if WebSocket is already connected
        // if (BeamShareClient.isWSOpen()) {
        //   console.log("[Reconnect] WebSocket already connected, skipping reconnect");
        //   return;
        // }

        // Check if we just navigated here (not a refresh)
        const navigationEntry = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigationEntry && navigationEntry.type === 'navigate') {
          console.log("[Reconnect] Fresh navigation detected, skipping reconnect");
          return;
        }

        console.log("[Reconnect] Page refresh detected, attempting reconnection");
        setIsReconnecting(true);
        
        try {
                    
          BeamShareClient.attemptReconnect(
            state.sessionId,
            state.clientId,
            state.isHost,
            userName,
          );
        } catch (error) {
          console.error("Reconnection failed:", error);
          router.push("/terminated");
        }
      }
    };

    // Small delay to allow WebSocket from join flow to establish
    const timeout = setTimeout(handleReconnect, 100);
    return () => clearTimeout(timeout);
  }, []);

  // Listen for reconnection result
  useEffect(() => {
    const hostReconnectedHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      console.log("[Host Reconnect] Host has reconnected, updating peer list");
      resetPeers();
      for (const peer of data.connectedPeers as Peer[]) {
        addPeer({ clientId: peer.clientId, name: peer.name });
      }
      setIsReconnecting(false);
    };

    const reconnectedHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      
      // We successfully reconnected as a peer
      console.log("[Peer Reconnect] Successfully reconnected");
      resetPeers();
      if (data.connectedPeers) {
        for (const peer of data.connectedPeers as Peer[]) {
          addPeer({ clientId: peer.clientId, name: peer.name });
        }
      }
      setIsReconnecting(false);
    };

    const peerReconnectedHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      
      // Another peer has reconnected
      console.log("[Peer Reconnect] Peer reconnected:", data.clientId, data.name);
      addPeer({ clientId: data.clientId, name: data.name });
    };

    const newPeerHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const data = customEvent.detail;
      console.log("[New Peer] Peer joined:", data.clientId, data.name);
      addPeer({ clientId: data.clientId, name: data.name });
    };

    const peerLeftHandler = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { clientId } = customEvent.detail;
      console.log("[Peer Left]:", clientId);
      
      // Update peer list
      setTransfers(prev => prev.filter(transfer => 
        transfer.direction === "sent" ? transfer.recipient !== clientId : true
      ));
      
      resetPeers();
      // Remove the peer by rebuilding the list without them
      const currentPeers = state.connectedPeers.filter(p => p.clientId !== clientId);
      for (const peer of currentPeers) {
        addPeer(peer);
      }
    };

    const sessionEndedHandler = () => {
      console.log("[Session] Session ended");
      toast.error("Session has ended");
      router.push("/terminated");
    };

    const handleSessionNotFound = () => {
      console.log("[Reconnect] Session not found");
      setIsReconnecting(false);
      toast.error("Session not found");
      router.push("/terminated");
    };

    window.addEventListener("beamshare:host-reconnected", hostReconnectedHandler);
    window.addEventListener("beamshare:reconnected", reconnectedHandler);
    window.addEventListener("beamshare:peer-reconnected", peerReconnectedHandler);
    window.addEventListener("beamshare:new-peer", newPeerHandler);
    window.addEventListener("beamshare:peer-left", peerLeftHandler);
    window.addEventListener("beamshare:session-ended", sessionEndedHandler);
    window.addEventListener("beamshare:session-not-found", handleSessionNotFound);

    return () => {
      window.removeEventListener("beamshare:host-reconnected", hostReconnectedHandler);
      window.removeEventListener("beamshare:reconnected", reconnectedHandler);
      window.removeEventListener("beamshare:peer-reconnected", peerReconnectedHandler);
      window.removeEventListener("beamshare:new-peer", newPeerHandler);
      window.removeEventListener("beamshare:peer-left", peerLeftHandler);
      window.removeEventListener("beamshare:session-ended", sessionEndedHandler);
      window.removeEventListener("beamshare:session-not-found", handleSessionNotFound);
    };
  }, [router, state.connectedPeers]);

  // Update session stats when transfers change
  useEffect(() => {
    const stats = transfers.reduce(
      (acc, transfer) => {
        if (transfer.status === "completed") {
          acc.completedFiles++;
          acc.totalTransferred += transfer.size;
        }
        if (transfer.status === "transferring") {
          acc.activeTransfers++;
          acc.totalTransferred += (transfer.size * transfer.progress) / 100;
        }
        return acc;
      },
      { totalTransferred: 0, completedFiles: 0, activeTransfers: 0 }
    );
    setSessionStats(stats);
  }, [transfers]);

  // Listen for incoming chunks
  useEffect(() => {
    const handleChunkReceived = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { peerId, data } = customEvent.detail;

      try {
        const message = JSON.parse(data);
        
        if (message.type === "file-start") {
          const newTransfer: FileTransfer = {
            id: message.fileId,
            filename: message.filename,
            size: message.size,
            sizeFormatted: formatBytes(message.size),
            progress: 0,
            status: "pending",
            sender: state.connectedPeers.find(p => p.clientId === peerId)?.name || "Unknown",
            direction: "received",
            receivedChunks: [],
            totalChunks: message.totalChunks,
            receivedChunkCount: 0,
          };
          
          setTransfers(prev => [...prev, newTransfer]);
          toast.info(`Receiving ${message.filename} from ${newTransfer.sender}`);
        } else if (message.type === "file-chunk") {
          const chunk = Uint8Array.from(atob(message.data), c => c.charCodeAt(0));
          
          setTransfers(prev => prev.map(transfer => {
            if (transfer.id === message.fileId && transfer.status !== "cancelled") {
              const newChunks = [...(transfer.receivedChunks || []), chunk];
              const receivedCount = (transfer.receivedChunkCount || 0) + 1;
              const progress = (receivedCount / (transfer.totalChunks || 1)) * 100;
              
              return {
                ...transfer,
                receivedChunks: newChunks,
                receivedChunkCount: receivedCount,
                progress: Math.min(progress, 100),
                status: receivedCount >= (transfer.totalChunks || 0) ? "completed" : "transferring",
              };
            }
            return transfer;
          }));
        } else if (message.type === "file-end") {
          setTransfers(prev => prev.map(transfer => {
            if (transfer.id === message.fileId && transfer.receivedChunks) {
              const blob = new Blob(transfer.receivedChunks);
              const url = URL.createObjectURL(blob);
              
              const a = document.createElement("a");
              a.href = url;
              a.download = transfer.filename;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              
              toast.success(`Downloaded ${transfer.filename}`);
              
              return {
                ...transfer,
                status: "completed",
                progress: 100,
              };
            }
            return transfer;
          }));
        } else if (message.type === "file-cancel") {
          setTransfers(prev => prev.map(transfer => {
            if (transfer.id === message.fileId) {
              toast.warning(`Transfer cancelled: ${transfer.filename}`);
              return {
                ...transfer,
                status: "cancelled",
              };
            }
            return transfer;
          }));
        }
      } catch (error) {
        console.error("Error processing chunk:", error);
      }
    };

    window.addEventListener("beamshare:chunk-received", handleChunkReceived);
    return () => {
      window.removeEventListener("beamshare:chunk-received", handleChunkReceived);
    };
  }, [state.connectedPeers]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const channels = BeamShareClient.getChannels();
    if (channels.length === 0) {
      toast.error("No peers connected. Please wait for peers to join.");
      return;
    }

    // If multiple peers, show recipient selection
    if (state.connectedPeers.length > 1) {
      setPendingFiles(Array.from(files));
      setShowRecipientModal(true);
    } else {
      // Send to all (only one peer anyway)
      for (const file of Array.from(files)) {
        await sendFile(file, "all");
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRecipientSelected = async () => {
    setShowRecipientModal(false);
    
    for (const file of pendingFiles) {
      await sendFile(file, selectedRecipient);
    }
    
    setPendingFiles([]);
  };

  const sendFile = async (file: File, recipient: string) => {
    const fileId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    const recipientName = recipient === "all" 
      ? "All" 
      : state.connectedPeers.find(p => p.clientId === recipient)?.name || "Unknown";

    const newTransfer: FileTransfer = {
      id: fileId,
      filename: file.name,
      size: file.size,
      sizeFormatted: formatBytes(file.size),
      progress: 0,
      status: "pending",
      recipient: recipientName,
      direction: "sent",
      file,
    };

    setTransfers(prev => [...prev, newTransfer]);
    BeamShareClient.setTransferActive(fileId, true);

    try {
      const metadataMessage = JSON.stringify({
        type: "file-start",
        fileId,
        filename: file.name,
        size: file.size,
        totalChunks,
      });

      const sent = recipient === "all" 
        ? BeamShareClient.broadcastChunk(metadataMessage)
        : BeamShareClient.sendChunkToPeer(recipient, metadataMessage);
      
      if ((recipient === "all" && sent === 0) || (recipient !== "all" && !sent)) {
        throw new Error("Failed to send file metadata");
      }

      toast.info(`Sending ${file.name} to ${recipientName}`);

      setTransfers(prev => prev.map(t => 
        t.id === fileId ? { ...t, status: "transferring" as const } : t
      ));

      // Use FileReader with parallel chunk sending
      const sendChunkBatch = async (startOffset: number, batchSize: number) => {
        const promises: Promise<void>[] = [];
        
        for (let i = 0; i < batchSize && startOffset + i * CHUNK_SIZE < file.size; i++) {
          const offset = startOffset + i * CHUNK_SIZE;
          const chunkIndex = Math.floor(offset / CHUNK_SIZE);
          
          promises.push(
            new Promise((resolve, reject) => {
              if (!BeamShareClient.isTransferActive(fileId)) {
                reject(new Error("Transfer cancelled"));
                return;
              }

              const slice = file.slice(offset, offset + CHUNK_SIZE);
              const reader = new FileReader();

              reader.onload = (e) => {
                if (!e.target?.result) {
                  reject(new Error("Failed to read chunk"));
                  return;
                }

                const chunk = new Uint8Array(e.target.result as ArrayBuffer);
                const base64Chunk = btoa(String.fromCharCode(...chunk));

                const chunkMessage = JSON.stringify({
                  type: "file-chunk",
                  fileId,
                  chunkIndex,
                  data: base64Chunk,
                });

                if (recipient === "all") {
                  BeamShareClient.broadcastChunk(chunkMessage);
                } else {
                  BeamShareClient.sendChunkToPeer(recipient, chunkMessage);
                }

                resolve();
              };

              reader.onerror = () => reject(new Error("Failed to read file"));
              reader.readAsArrayBuffer(slice);
            })
          );
        }

        await Promise.all(promises);
      };

      // Send chunks in batches
      let offset = 0;
      while (offset < file.size && BeamShareClient.isTransferActive(fileId)) {
        await sendChunkBatch(offset, MAX_CONCURRENT_CHUNKS);
        
        offset += CHUNK_SIZE * MAX_CONCURRENT_CHUNKS;
        const progress = Math.min((offset / file.size) * 100, 100);
        
        setTransfers(prev => prev.map(t => 
          t.id === fileId ? { ...t, progress } : t
        ));
      }

      if (!BeamShareClient.isTransferActive(fileId)) {
        // Transfer was cancelled
        setTransfers(prev => prev.map(t => 
          t.id === fileId ? { ...t, status: "cancelled" as const } : t
        ));
        return;
      }

      // Send completion message
      const endMessage = JSON.stringify({
        type: "file-end",
        fileId,
      });
      
      if (recipient === "all") {
        BeamShareClient.broadcastChunk(endMessage);
      } else {
        BeamShareClient.sendChunkToPeer(recipient, endMessage);
      }

      setTransfers(prev => prev.map(t => 
        t.id === fileId ? { ...t, status: "completed" as const, progress: 100 } : t
      ));

      toast.success(`Sent ${file.name}`);
    } catch (error) {
      console.error("Error sending file:", error);
      setTransfers(prev => prev.map(t => 
        t.id === fileId ? { ...t, status: "failed" as const } : t
      ));
      toast.error(`Failed to send ${file.name}`);
    }
  };

  const handleTerminate = () => {
    if (confirm("Are you sure you want to terminate this session?")) {
      BeamShareClient.destroySession(state.sessionId!, state.clientId!);
      resetPeers();
      setSession("", state.clientId!, false, "");
      router.push("/");
    }
  };

  const handleRemoveTransfer = (id: string) => {
    const transfer = transfers.find(t => t.id === id);
    if (transfer && transfer.status === "transferring") {
      if (confirm("This transfer is in progress. Do you want to cancel it?")) {
        BeamShareClient.cancelTransfer(id);
        setTransfers(prev => prev.map(t => 
          t.id === id ? { ...t, status: "cancelled" as const } : t
        ));
      }
      return;
    }
    setTransfers(prev => prev.filter(t => t.id !== id));
  };

  if (isReconnecting) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-gray-400">Reconnecting to session...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="h-screen flex flex-col overflow-hidden bg-background">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFilesSelected}
      />

      {/* Recipient Selection Modal */}
      {showRecipientModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass p-6 rounded-2xl max-w-md w-full space-y-4">
            <h3 className="text-xl font-semibold text-white">Select Recipient</h3>
            
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer">
                <input
                  type="radio"
                  name="recipient"
                  value="all"
                  checked={selectedRecipient === "all"}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  className="text-primary"
                />
                <Users className="w-5 h-5 text-gray-400" />
                <span className="text-white">Send to All</span>
              </label>
              
              {state.connectedPeers.map(peer => (
                <label key={peer.clientId} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer">
                  <input
                    type="radio"
                    name="recipient"
                    value={peer.clientId}
                    checked={selectedRecipient === peer.clientId}
                    onChange={(e) => setSelectedRecipient(e.target.value)}
                    className="text-primary"
                  />
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white">
                    {peer.name[0]?.toUpperCase()}
                  </div>
                  <span className="text-white">{peer.name}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowRecipientModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-white hover:bg-white/5"
              >
                Cancel
              </button>
              <GlowButton
                variant="primary"
                className="flex-1"
                onClick={handleRecipientSelected}
              >
                Send
              </GlowButton>
            </div>
          </div>
        </div>
      )}

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <SessionHeader
        sessionCode={sessionCode}
        isHost={state.isHost}
        onTerminate={handleTerminate}
      />

      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-4 gap-4 p-6">
        <div className="hidden lg:block lg:col-span-1">
          <UserPanel users={state.connectedPeers.map(peer => ({
            id: peer.clientId,
            name: peer.name,
            status: "connected" as const,
          }))} />
        </div>

        <div className="lg:col-span-2 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Transfers</h2>
            <span className="text-xs bg-white/10 px-2 py-1 rounded-full text-gray-400">
              {transfers.length} file{transfers.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {transfers.length > 0 ? (
              transfers.map((transfer) => (
                <FileTransferCard
                  key={transfer.id}
                  transfer={{
                    ...transfer,
                    size: transfer.sizeFormatted,
                  }}
                  onRemove={handleRemoveTransfer}
                />
              ))
            ) : (
              <div className="glass p-8 text-center space-y-3 flex flex-col items-center justify-center h-full">
                <Upload className="w-8 h-8 text-gray-500" />
                <p className="text-gray-400">No transfers yet</p>
                {state.isHost && (
                  <p className="text-xs text-gray-500">
                    Click "Add Files" to start sharing
                  </p>
                )}
              </div>
            )}
          </div>

          {state.isHost && (
            <div className="space-y-2">
              <GlowButton 
                variant="primary" 
                className="w-full"
                onClick={handleFileSelect}
                disabled={state.connectedPeers.length === 0}
              >
                <Upload className="w-4 h-4" />
                Add Files
              </GlowButton>
              {state.connectedPeers.length === 0 && (
                <p className="text-xs text-center text-gray-500">
                  Waiting for peers to connect...
                </p>
              )}
            </div>
          )}
        </div>

        <div className="lg:col-span-1 glass p-6 space-y-6 flex flex-col">
          <div>
            <h3 className="font-semibold text-white mb-3">Quick Stats</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Total Transferred</span>
                <span className="text-[#1DE9B6]">
                  {formatBytes(sessionStats.totalTransferred)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Completed</span>
                <span className="text-[#1DE9B6]">
                  {sessionStats.completedFiles} file{sessionStats.completedFiles !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Active</span>
                <span className={sessionStats.activeTransfers > 0 ? "text-[#00E5FF] animate-pulse" : "text-gray-400"}>
                  {sessionStats.activeTransfers} transfer{sessionStats.activeTransfers !== 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="font-semibold text-white mb-3">Session Info</h3>
            <div className="space-y-2 text-xs text-gray-400">
              <p>
                Duration: <DurationSince start={state.startedAt} />
              </p>
              <p>Participants: {state.connectedPeers.length + 1}</p>
              <p>Connection: Peer-to-Peer</p>
              <p>Status: {BeamShareClient.isWSOpen() ? "Connected" : "Disconnected"}</p>
            </div>
          </div>

          {state.isHost && (
            <div className="mt-auto space-y-2">
              <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                <p className="text-xs text-indigo-300 mb-1">💡 Tip</p>
                <p className="text-xs text-gray-400">
                  Files are sent directly peer-to-peer. {state.connectedPeers.length > 1 && "Choose specific recipients or send to all!"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="lg:hidden glass border-t border-white/10 p-4 max-h-32 overflow-y-auto">
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-white/5 text-center">
            <div className="w-6 h-6 mx-auto rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white mb-1">
              H
            </div>
            <p className="text-xs text-gray-300 truncate">
              Host {state.isHost && "(You)"}
            </p>
          </div>
          {state.connectedPeers.map((user) => (
            <div
              key={user.clientId}
              className="p-2 rounded-lg bg-white/5 text-center"
            >
              <div className="w-6 h-6 mx-auto rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white mb-1">
                {user.name[0]?.toUpperCase()}
              </div>
              <p className="text-xs text-gray-300 truncate">
                {user.name} {state.clientId == user.clientId && "(You)"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}