"use client"

import { User, MessageCircle, MessageSquareMore, Lock, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

export type BottomTabType = "chat" | "archive"

interface BottomNavProps {
  activeTab: BottomTabType
  onTabChange: (tab: BottomTabType) => void
  unreadCount?: number
}

export function BottomNav({ activeTab, onTabChange, unreadCount = 0 }: BottomNavProps) {
  // 채팅 탭만 활성화 상태로 표시 (archive는 내부적으로만 사용)
  const isChatActive = activeTab === "chat"

  return (
    <nav className="flex-shrink-0 flex items-center justify-evenly pt-3 pb-safe border-t border-border bg-background">
      {/* 친구 */}
      <button className="flex flex-col items-center text-gray-300">
        <User className="w-6 h-6 fill-current" />
      </button>

      {/* 채팅 - 항상 활성화 표시, 안읽은 채팅 수 배지 */}
      <button
        className={cn(
          "flex flex-col items-center relative",
          isChatActive ? "text-foreground" : "text-gray-300"
        )}
      >
        <MessageCircle className="w-6 h-6 fill-current" />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-2 bg-kakao-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* 오픈채팅 */}
      <button className="flex flex-col items-center relative text-gray-300">
        <MessageSquareMore className="w-6 h-6 fill-current" />
        <span className="absolute -top-1.5 -right-2 bg-kakao-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          76
        </span>
      </button>

      {/* 쇼핑 */}
      <button className="flex flex-col items-center text-gray-300">
        <Lock className="w-6 h-6 fill-current" />
      </button>

      {/* 더보기 */}
      <button className="flex flex-col items-center text-gray-300">
        <MoreHorizontal className="w-6 h-6" />
      </button>
    </nav>
  )
}
