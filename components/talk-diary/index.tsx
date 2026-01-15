"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { HomeTab } from "./home-tab"
import { ReportTab } from "./report-tab"

type TabType = "home" | "report"

interface TalkDiaryProps {
  userId: string
  onClose: () => void
  onNavigateToChat?: (chatId: string, messageId?: string) => void
}

export function TalkDiary({ userId, onClose, onNavigateToChat }: TalkDiaryProps) {
  const [activeTab, setActiveTab] = useState<TabType>("home")

  const tabs: { key: TabType; label: string }[] = [
    { key: "home", label: "홈" },
    { key: "report", label: "리포트" },
  ]

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      {/* Header - 고정 */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3">
        <div className="w-6" /> {/* Spacer */}
        <h1 className="text-lg font-semibold text-foreground">톡다이어리</h1>
        <button
          onClick={onClose}
          className="text-foreground/70 hover:text-foreground"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* Tab Bar - 고정 */}
      <div className="flex-shrink-0 flex w-full border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 py-3 text-sm transition-colors relative",
              activeTab === tab.key
                ? "text-black font-semibold"
                : "text-gray-400 font-normal"
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black" />
            )}
          </button>
        ))}
      </div>

      {/* Content - 스크롤 영역 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-safe scrollbar-thin bg-white">
        {activeTab === "home" && <HomeTab userId={userId} />}
        {activeTab === "report" && <ReportTab userId={userId} onNavigateToChat={onNavigateToChat} />}
      </div>
    </div>
  )
}
