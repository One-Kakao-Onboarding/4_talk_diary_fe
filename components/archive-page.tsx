"use client"

import { LogOut } from "lucide-react"
import { clearUserSession } from "@/lib/supabase"

interface ArchivePageProps {
  onLogout: () => void
}

export function ArchivePage({ onLogout }: ArchivePageProps) {
  const handleLogout = () => {
    clearUserSession()
    onLogout()
  }

  return (
    <div className="flex flex-col flex-1 bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <h1 className="text-2xl font-bold text-foreground">기록</h1>
        <button
          onClick={handleLogout}
          className="text-foreground/70 hover:text-foreground"
          title="로그아웃"
        >
          <LogOut className="w-6 h-6" />
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Coming soon...</p>
      </div>
    </div>
  )
}
