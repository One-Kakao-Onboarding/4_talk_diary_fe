"use client"

import { MessageCircle, Archive } from "lucide-react"
import { cn } from "@/lib/utils"

export type BottomTabType = "chat" | "archive"

interface BottomNavProps {
  activeTab: BottomTabType
  onTabChange: (tab: BottomTabType) => void
  unreadCount?: number
}

export function BottomNav({ activeTab, onTabChange, unreadCount = 0 }: BottomNavProps) {
  return (
    <nav className="flex-shrink-0 flex items-center justify-evenly pt-3 pb-safe border-t border-border bg-background">
      <button 
        onClick={() => onTabChange("chat")}
        className={cn(
          "flex flex-col items-center relative",
          activeTab === "chat" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <MessageCircle className={cn("w-6 h-6", activeTab === "chat" && "fill-current")} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-kakao-orange text-white text-xs font-medium px-1.5 py-0.5 rounded-full min-w-4.5 text-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      <button
        onClick={() => onTabChange("archive")}
        className={cn(
          "flex flex-col items-center",
          activeTab === "archive" ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <Archive className={cn("w-6 h-6", activeTab === "archive" && "fill-current")} />
      </button>
    </nav>
  )
}
