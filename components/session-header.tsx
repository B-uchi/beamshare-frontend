"use client"

import Link from "next/link"
import { Copy, LogOut, Check } from "lucide-react"
import { useState } from "react"

interface SessionHeaderProps {
  sessionCode: string
  isHost?: boolean
  onTerminate?: () => void
}

export function SessionHeader({ sessionCode, isHost = false, onTerminate }: SessionHeaderProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <header className="glass border-b border-border px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-primary">
        BeamShare
      </Link>

      <div className="flex items-center gap-3">
        {/* Session Code */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface border border-border hover:bg-surface-hover transition-colors text-sm text-foreground"
        >
          <code className="font-mono font-semibold">{sessionCode}</code>
          {copied ? <Check className="w-4 h-4 text-secondary" /> : <Copy className="w-4 h-4" />}
        </button>

        {/* Terminate button (host only) */}
        {isHost && (
          <button
            onClick={onTerminate}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-colors text-sm text-red-400"
          >
            <LogOut className="w-4 h-4" />
            Terminate
          </button>
        )}
      </div>
    </header>
  )
}
