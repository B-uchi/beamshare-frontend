"use client";

import { Download, Upload, CheckCircle, Clock, Trash2, X } from "lucide-react";

interface FileTransfer {
  id: string;
  filename: string;
  size: string;
  progress: number;
  status: "pending" | "transferring" | "completed" | "failed" | "cancelled";
  recipient?: string;
  sender?: string;
  direction: "sent" | "received";
}

interface FileTransferCardProps {
  transfer: FileTransfer;
  onRemove?: (id: string) => void;
}

export function FileTransferCard({
  transfer,
  onRemove,
}: FileTransferCardProps) {
  const statusIcons = {
    pending: <Clock className="w-4 h-4 text-[#FFC107]" />,
    transferring: <Upload className="w-4 h-4 text-[#00E5FF] animate-pulse" />,
    completed: <CheckCircle className="w-4 h-4 text-[#1DE9B6]" />,
    failed: <X className="w-4 h-4 text-red-500" />,
    cancelled: <X className="w-4 h-4 text-red-500" />,
  };

  const statusLabels = {
    pending: "Pending",
    transferring: "Transferring",
    completed: "Completed",
    failed: "Failed",
    cancelled: "Cancelled",
  };

  return (
    <div className="glass p-4 space-y-3 glow-primary hover:glow-cyan transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className={`mt-1 ${
              transfer.direction === "sent"
                ? "text-[#5B2EFF]"
                : "text-[#00E5FF]"
            }`}
          >
            {transfer.direction === "sent" ? (
              <Upload className="w-4 h-4" />
            ) : (
              <Download className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {transfer.filename}
            </p>
            <p className="text-xs text-gray-400">
              {transfer.size} • {transfer.recipient || transfer.sender}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusIcons[transfer.status]}
          {onRemove && (
            <button
              onClick={() => onRemove(transfer.id)}
              className="p-1 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-400">
            {statusLabels[transfer.status]}
          </span>
          <span className="text-xs font-mono text-gray-400">
            {transfer.progress.toFixed(2)}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${transfer.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
