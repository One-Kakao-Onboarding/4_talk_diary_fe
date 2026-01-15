"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { ReportCard } from "@/components/report-card"
import { fetchReports } from "@/lib/supabase"
import { convertReportToLegacy, type DailyReport } from "@/types/database"

interface TalkDiaryPageProps {
  userId: string
  onBack: () => void
  onNavigateToChat?: (chatId: string, messageId?: string) => void
  onViewAll?: () => void
}

export function TalkDiaryPage({ userId, onBack, onNavigateToChat, onViewAll }: TalkDiaryPageProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [reports, setReports] = useState<DailyReport[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 리포트 데이터 로드
  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true)
      const data = await fetchReports(userId)
      // 새 구조를 레거시 구조로 변환 (null 제외)
      const legacyReports = data
        .map(convertReportToLegacy)
        .filter((r): r is DailyReport => r !== null)
      setReports(legacyReports)
      setIsLoading(false)
    }
    loadReports()
  }, [userId])

  // 입장 시 스크롤을 맨 아래로
  useEffect(() => {
    if (scrollRef.current && !isLoading) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [isLoading])

  // 날짜 포맷팅
  const formatDatePill = (dateString: string) => {
    const date = new Date(dateString)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    const weekday = weekdays[date.getDay()]
    return `${year}년 ${month}월 ${day}일 ${weekday}`
  }

  return (
    <div className="flex flex-col w-full h-full bg-kakao-chat">
      {/* Header */}
      <header className="flex items-center justify-between px-2 py-3 bg-kakao-chat">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 text-foreground/70 hover:text-foreground">
            <ChevronLeft className="w-7 h-7" />
          </button>
          <span className="font-medium text-lg text-foreground">
            톡다이어리
          </span>
        </div>
      </header>

      {/* Reports */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto pt-4 pb-safe scrollbar-thin">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-foreground/50">리포트를 불러오는 중...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-foreground/50">아직 리포트가 없습니다</p>
          </div>
        ) : (
          [...reports].sort((a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          ).map((report) => (
            <div key={report.id} className="space-y-3 mb-4">
              {/* 날짜 pill */}
              <div className="flex justify-center">
                <div className="flex items-center gap-1 px-3 py-1.5 bg-foreground/10 rounded-full text-xs text-foreground/70">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDatePill(report.report_date)}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* 리포트 */}
              <div className="space-y-2">
                {/* 프로필 행 */}
                <div className="flex items-center gap-2 px-3">
                  <img
                    src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/dairy_profile.png`}
                    alt="톡다이어리"
                    className="w-10 h-10 rounded-2xl shrink-0 object-cover"
                  />
                  <span className="text-sm text-foreground/70 font-medium">톡다이어리</span>
                </div>
                {/* 카드 행 */}
                <div>
                  <ReportCard
                    content={report.content}
                    reportDate={report.report_date}
                    onChatClick={(chatId, messageId) => onNavigateToChat?.(chatId, messageId)}
                    onViewAll={onViewAll}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  )
}

