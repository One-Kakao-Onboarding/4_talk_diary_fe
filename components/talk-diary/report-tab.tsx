"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { fetchReports } from "@/lib/supabase"
import type { EmotionIcon, Report, DailyReport } from "@/types/database"
import { isValidReportContent, convertReportToLegacy } from "@/types/database"

interface ReportTabProps {
  userId: string
  onNavigateToChat?: (chatId: string, messageId?: string) => void
}

// 감정 아이콘 이미지 경로
const getEmotionIconPath = (emotion?: string): string => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
  if (emotion) {
    return `${basePath}/mind/${emotion}.png`
  }
  return `${basePath}/mind/기쁨.png`
}

// 키워드 색상 팔레트
const colorPalette = [
  { bg: "bg-pink-100", text: "text-pink-500" },
  { bg: "bg-purple-100", text: "text-purple-500" },
  { bg: "bg-blue-100", text: "text-blue-500" },
  { bg: "bg-green-100", text: "text-green-500" },
  { bg: "bg-orange-100", text: "text-orange-500" },
  { bg: "bg-cyan-100", text: "text-cyan-500" },
  { bg: "bg-rose-100", text: "text-rose-500" },
  { bg: "bg-indigo-100", text: "text-indigo-500" },
]

// 키워드 문자열을 해시하여 일관된 색상 반환
const getKeywordColor = (keyword: string) => {
  let hash = 0
  for (let i = 0; i < keyword.length; i++) {
    hash = keyword.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % colorPalette.length
  return colorPalette[index]
}

// 프로필 색상 팔레트
const profileColors = [
  { bg: "bg-pink-100", text: "text-pink-600" },
  { bg: "bg-blue-100", text: "text-blue-600" },
  { bg: "bg-green-100", text: "text-green-600" },
  { bg: "bg-purple-100", text: "text-purple-600" },
  { bg: "bg-orange-100", text: "text-orange-600" },
]

const getProfileColor = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return profileColors[Math.abs(hash) % profileColors.length]
}

export function ReportTab({ userId, onNavigateToChat }: ReportTabProps) {
  // 오늘 날짜 (고정)
  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()
  const todayDate = today.getDate()

  // 현재 보고 있는 주의 시작일 (일요일 기준)
  const [weekStart, setWeekStart] = useState(() => {
    const start = new Date(today)
    start.setDate(today.getDate() - today.getDay())
    return start
  })

  // 선택된 날짜
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, "0")
    const day = String(today.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  })

  // 전체 리포트 데이터
  const [allReports, setAllReports] = useState<Record<string, DailyReport>>({})
  const [allEmotions, setAllEmotions] = useState<Record<string, EmotionIcon>>({})
  const [isLoading, setIsLoading] = useState(true)

  // 이전 주로 이동
  const goToPrevWeek = () => {
    const newStart = new Date(weekStart)
    newStart.setDate(weekStart.getDate() - 7)
    setWeekStart(newStart)
  }

  // 다음 주로 이동
  const goToNextWeek = () => {
    const newStart = new Date(weekStart)
    newStart.setDate(weekStart.getDate() + 7)
    setWeekStart(newStart)
  }

  // 리포트 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      const reports = await fetchReports(userId)

      const emotions: Record<string, EmotionIcon> = {}
      const reportsByDate: Record<string, DailyReport> = {}

      reports.forEach((report) => {
        if (!isValidReportContent(report.content)) return

        const targetDate = report.content.report_meta.target_date
        const dominant = report.content.dashboard?.emotion_weather?.dominant
        if (dominant) {
          emotions[targetDate] = dominant
        }

        // 레거시 형식으로 변환하여 저장
        const legacyReport = convertReportToLegacy(report)
        if (legacyReport) {
          reportsByDate[targetDate] = legacyReport
        }
      })

      setAllEmotions(emotions)
      setAllReports(reportsByDate)
      setIsLoading(false)
    }

    loadData()
  }, [userId])

  // 날짜 키 생성 함수
  const getDateKey = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // 현재 주의 날짜들 생성
  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart)
    date.setDate(weekStart.getDate() + i)
    return date
  })

  // 헤더에 표시할 년/월
  const displayYear = weekStart.getFullYear()
  const displayMonth = weekStart.getMonth() + 1

  // 선택된 날짜의 리포트
  const selectedReport = allReports[selectedDate]

  return (
    <div className="space-y-6">
      {/* 주별 캘린더 */}
      <section>
        {/* 헤더: 년월 좌측, 화살표 우측 */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-foreground">
            {displayYear}.{String(displayMonth).padStart(2, "0")}
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={goToPrevWeek}
              className="p-1 text-foreground/60 hover:text-foreground"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNextWeek}
              className="p-1 text-foreground/60 hover:text-foreground"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((day, idx) => (
            <div
              key={day}
              className={`text-center text-xs font-medium ${
                idx === 0 ? "text-red-400" : idx === 6 ? "text-blue-400" : "text-muted-foreground"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 주간 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((date, idx) => {
            const dateKey = getDateKey(date)
            const emotion = allEmotions[dateKey]
            const isToday =
              date.getFullYear() === todayYear &&
              date.getMonth() === todayMonth &&
              date.getDate() === todayDate
            const isSunday = idx === 0
            const isSelected = dateKey === selectedDate

            return (
              <button
                key={idx}
                onClick={() => setSelectedDate(dateKey)}
                className="flex flex-col items-center py-1 gap-0.5"
              >
                {/* 날짜 숫자 */}
                <div className={`w-5 h-5 flex items-center justify-center ${isSelected ? "bg-black rounded-full" : ""}`}>
                  <span className={`text-[11px] ${
                    isSelected
                      ? "text-white font-medium"
                      : isSunday
                        ? "text-red-500"
                        : "text-foreground/60"
                  }`}>
                    {date.getDate()}
                  </span>
                </div>
                {/* 감정 아이콘 */}
                {emotion ? (
                  <img
                    src={getEmotionIconPath(emotion)}
                    alt={emotion}
                    className={`w-10 h-10 object-contain ${isSelected ? "ring-2 ring-black ring-offset-1 rounded-full" : ""}`}
                  />
                ) : (
                  <div className={`w-10 h-10 rounded-full border-2 border-dashed ${isSelected ? "border-black" : "border-gray-200"}`} />
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* 구분선 */}
      <hr className="border-t border-gray-200 -mx-4" />

      {/* 선택된 날짜의 리포트 */}
      {selectedReport ? (
        <>
          {/* 데일리 요약 */}
          <section>
            <h3 className="font-semibold text-foreground mb-3">데일리 요약</h3>

            {/* 요약 텍스트 */}
            <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
              {selectedReport.content.dailySummary.summaryText}
            </p>

            {/* 오늘의 키워드 */}
            <div className="flex items-center justify-between p-3 rounded-xl mb-2" style={{ backgroundColor: '#FAFAFA' }}>
              <span className="text-sm font-medium text-foreground">오늘의 키워드</span>
              <div className="flex gap-1.5 flex-wrap justify-end">
                {selectedReport.content.dailySummary.keywords.map((keyword, idx) => {
                  const colors = getKeywordColor(keyword)
                  return (
                    <span
                      key={idx}
                      className={`px-2.5 py-1 ${colors.bg} ${colors.text} rounded-full text-xs font-medium`}
                    >
                      {keyword}
                    </span>
                  )
                })}
              </div>
            </div>

            {/* 오늘의 감정 날씨 */}
            <div className="flex items-center justify-between p-3 rounded-xl mb-2" style={{ backgroundColor: '#FAFAFA' }}>
              <span className="text-sm font-medium text-foreground">오늘의 감정 날씨</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 rounded-full">
                <img
                  src={getEmotionIconPath(selectedReport.content.dailySummary.emotionIcon)}
                  alt={selectedReport.content.dailySummary.emotionIcon || "감정"}
                  className="w-4 h-4 object-contain"
                />
                <span className="text-orange-500 text-xs font-medium">
                  {selectedReport.content.dailySummary.emotionWeather}
                </span>
              </div>
            </div>

            {/* 최고의 티키타카 */}
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: '#FAFAFA' }}>
              <span className="text-sm font-medium text-foreground">최고의 티키타카</span>
              {(() => {
                const name = selectedReport.content.dailySummary.bestTikitaka.name
                const colors = getProfileColor(name || "")
                return (
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 ${colors.bg} rounded-full flex items-center justify-center`}>
                      <span className={`text-xs font-medium ${colors.text}`}>
                        {name?.charAt(0) || "?"}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground">{name}</span>
                  </div>
                )
              })()}
            </div>
          </section>

          {/* 구분선 */}
          <hr className="border-t border-gray-200 -mx-4" />

          {/* 특별한 대화 */}
          {selectedReport.content.specialConversations.length > 0 && (
            <section>
              <h3 className="font-semibold text-foreground mb-3">특별한 대화</h3>
              <div className="space-y-2">
                {selectedReport.content.specialConversations.map((conversation, idx) => {
                  const colors = getKeywordColor(conversation.keyword)
                  return (
                    <button
                      key={idx}
                      onClick={() => onNavigateToChat?.(conversation.chatId, conversation.messageId)}
                      className="w-full text-left p-4 rounded-xl transition-colors"
                      style={{ backgroundColor: '#FAFAFA' }}
                    >
                      {/* 키워드 태그 + 제목 */}
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 ${colors.bg} ${colors.text} rounded-lg text-xs font-medium`}>
                          {conversation.keyword}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {conversation.title}
                        </span>
                      </div>
                      {/* 미리보기 텍스트 */}
                      <p className="text-sm text-foreground/70 leading-relaxed mb-1.5">
                        {conversation.preview}
                      </p>
                      {/* 발신자 이름 */}
                      <span className="text-xs text-foreground/50 block text-right">
                        {conversation.senderName}
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

          )}

          {/* AI 갤러리 */}
          {selectedReport.content.aiImageSummary.imageUrl && (
            <>
              {/* 구분선 */}
              <hr className="border-t border-gray-200 -mx-4" />
              <section>
                <h3 className="font-semibold text-foreground mb-3">AI 갤러리</h3>
                <div className="rounded-3xl overflow-hidden">
                  <img
                    src={selectedReport.content.aiImageSummary.imageUrl}
                    alt="AI 생성 이미지"
                    className="w-full object-cover"
                  />
                </div>
              </section>
            </>
          )}
        </>
      ) : (
        <div className="py-12 text-center">
          <p className="text-sm text-muted-foreground">선택한 날짜의 리포트가 없습니다</p>
        </div>
      )}
    </div>
  )
}
