"use client"

import { Check } from "lucide-react"
import { useState } from "react"

interface SessionCodeDisplayProps {
  code: string
}

export function SessionCodeDisplay({ code }: SessionCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <p className="text-sm text-muted">Your Session Code</p>
        <div
          className="glass p-8 glow-soft hover:shadow-lg transition-all duration-300 cursor-pointer"
          onClick={handleCopy}
        >
          <code className="text-4xl sm:text-5xl font-mono font-bold text-primary tracking-widest">{code}</code>
        </div>

        <p className="text-sm text-muted">Click to copy • Share with others</p>
      </div>

      {/* Copy feedback */}
      {copied && (
        <div className="flex items-center justify-center gap-2 text-secondary text-sm animate-fade-in">
          <Check className="w-4 h-4" />
          Code copied!
        </div>
      )}
    </div>
  )
}
