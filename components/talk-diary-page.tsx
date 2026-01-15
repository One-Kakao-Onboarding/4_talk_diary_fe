"use client"

import { useEffect, useRef } from "react"
import { ChevronLeft, ChevronRight, Send, Calendar } from "lucide-react"
import { ReportCard } from "@/components/report-card"
import { mockReports } from "@/lib/mock-data"

interface TalkDiaryPageProps {
  userId: string
  onBack: () => void
  onNavigateToChat?: (chatId: string, messageId?: string) => void
}

export function TalkDiaryPage({ userId, onBack, onNavigateToChat }: TalkDiaryPageProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  // 입장 시 스크롤을 맨 아래로
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

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
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        {mockReports.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-foreground/50">아직 리포트가 없습니다</p>
          </div>
        ) : (
          [...mockReports].sort((a, b) =>
            new Date(a.report_date).getTime() - new Date(b.report_date).getTime()
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
              <div className="flex items-start">
                {/* 톡다이어리 아바타 */}
                <img
                  src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/dairy_profile.png`}
                  alt="톡다이어리"
                  className="w-10 h-10 rounded-2xl shrink-0 mr-2 object-cover"
                />
                <div className="flex flex-col items-start flex-1 min-w-0">
                  <span className="text-sm text-foreground/70 font-medium mb-1">톡다이어리</span>
                  <ReportCard
                    content={report.content}
                    reportDate={report.report_date}
                    onChatClick={(chatId, messageId) => onNavigateToChat?.(chatId, messageId)}
                    onViewAll={() => {
                      // TODO: Archive 페이지로 이동
                    }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Area - 비활성화 */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-t border-border opacity-50">
        <div className="flex-1 flex items-center bg-muted rounded-full px-4 py-2">
          <input
            type="text"
            placeholder="메시지 보내기"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground cursor-not-allowed"
            disabled
          />
        </div>
        <button
          disabled
          className="p-2 text-muted-foreground cursor-not-allowed"
        >
          <Send className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}

