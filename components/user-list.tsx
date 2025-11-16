"use client"

import { Users } from "lucide-react"

interface User {
  id: string
  name: string
  status: "connected" | "idle" | "transferring"
}

interface UserListProps {
  users: User[]
}

export function UserList({ users }: UserListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-400">
        <Users className="w-4 h-4" />
        <span className="text-sm font-medium">{users.length} connected</span>
      </div>

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/8 transition-colors"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white">
                {user.name[0]?.toUpperCase()}
              </div>
              <div
                className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border border-white/20 ${
                  user.status === "connected"
                    ? "bg-[#1DE9B6]"
                    : user.status === "transferring"
                      ? "bg-[#00E5FF] animate-pulse"
                      : "bg-gray-500"
                }`}
              />
            </div>
            <span className="text-sm text-white flex-1">{user.name}</span>
            <span className="text-xs text-gray-500">
              {user.status === "connected" && "Ready"}
              {user.status === "idle" && "Idle"}
              {user.status === "transferring" && "Transferring"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
