"use client"

import { Users } from "lucide-react"

interface User {
  id: string
  name: string
  status: "connected" | "idle" | "transferring"
}

interface UserPanelProps {
  users: User[]
  title?: string
}

export function UserPanel({ users, title = "Connected Users" }: UserPanelProps) {
  return (
    <div className="glass p-6 h-full flex flex-col space-y-4">
      <div className="flex items-center gap-2 text-gray-300">
        <Users className="w-4 h-4" />
        <h3 className="font-semibold">{title}</h3>
        <span className="ml-auto text-xs bg-white/10 px-2 py-1 rounded-full">{users.length}</span>
      </div>

      <div className="space-y-2 flex-1 overflow-y-auto">
        {users.map((user) => (
          <div
            key={user.id}
            className="p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                  {user.name[0]?.toUpperCase()}
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-white/20 ${
                    user.status === "connected"
                      ? "bg-[#1DE9B6]"
                      : user.status === "transferring"
                        ? "bg-[#00E5FF] animate-pulse"
                        : "bg-gray-500"
                  }`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500">
                  {user.status === "connected" && "Ready"}
                  {user.status === "idle" && "Idle"}
                  {user.status === "transferring" && "Transferring"}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
