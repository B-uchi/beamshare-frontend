"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GlowButton } from "@/components/glow-button";
import { Home, Clock } from "lucide-react";

export default function TerminatedSessionPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      router.push("/");
    }
  }, [countdown, router]);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-background flex items-center justify-center px-4">
      {/* Blurred background effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 backdrop-blur-sm bg-background/80" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-md w-full text-center space-y-8 animate-fade-in">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-white/5 border border-white/10">
            <Clock className="w-8 h-8 text-[#FF1744]" />
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-white">Session Terminated</h1>
          <p className="text-gray-400">
            The host has ended this session. All transfers have been stopped.
          </p>
        </div>

        {/* Countdown */}
        <div className="glass p-6 space-y-3 glow-soft">
          <p className="text-sm text-gray-400">Redirecting to home in</p>
          <div className="text-5xl font-bold text-primary font-mono">
            {countdown}s
          </div>
          <p className="text-xs text-gray-500">
            You will be redirected automatically
          </p>
        </div>

        {/* Action button */}
        <GlowButton href="/" variant="primary" className="w-full">
          <Home className="w-4 h-4" />
          Return to Home
        </GlowButton>

        {/* Countdown ring */}
        <div className="relative w-32 h-32 mx-auto">
          <svg
            className="absolute inset-0 transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              strokeDasharray={`${(countdown / 10) * 283} 283`}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#5B2EFF" />
                <stop offset="100%" stopColor="#00E5FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </main>
  );
}
