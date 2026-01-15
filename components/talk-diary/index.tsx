"use client"

import { useState } from "react"
import { LogOut } from "lucide-react"
import { clearUserSession } from "@/lib/supabase"
import { cn } from "@/lib/utils"
import { HomeTab } from "./home-tab"
import { CalendarTab } from "./calendar-tab"
import { RankingTab } from "./ranking-tab"
import { ReportTab } from "./report-tab"

type TabType = "home" | "calendar" | "ranking" | "report"

interface TalkDiaryProps {
  onLogout: () => void
}

export function TalkDiary({ onLogout }: TalkDiaryProps) {
  const [activeTab, setActiveTab] = useState<TabType>("home")

  const handleLogout = () => {
    clearUserSession()
    onLogout()
  }

  const tabs: { key: TabType; label: string }[] = [
    { key: "home", label: "홈" },
    { key: "calendar", label: "캘린더" },
    { key: "ranking", label: "랭킹" },
    { key: "report", label: "리포트" },
  ]

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-background">
      {/* Header - 고정 */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3">
        <div className="w-5" /> {/* Spacer */}
        <h1 className="text-lg font-semibold text-foreground">톡다이어리</h1>
        <button
          onClick={handleLogout}
          className="text-foreground/70 hover:text-foreground"
          title="로그아웃"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Tab Bar - 고정 */}
      <div className="flex-shrink-0 flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "flex-1 py-3 text-sm font-medium transition-colors relative",
              activeTab === tab.key
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
            )}
          </button>
        ))}
      </div>

      {/* Content - 스크롤 영역 */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-4 pb-safe scrollbar-thin">
        {activeTab === "home" && <HomeTab />}
        {activeTab === "calendar" && <CalendarTab />}
        {activeTab === "ranking" && <RankingTab />}
        {activeTab === "report" && <ReportTab />}
      </div>
    </div>
  )
}
