"use client"

import useEmblaCarousel from "embla-carousel-react"
import { Download } from "lucide-react"
import type { DailyReportContent } from "@/types/database"

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

interface ReportCardProps {
  content: DailyReportContent
  reportDate: string
  onChatClick?: (chatId: string, messageId?: string) => void
  onViewAll?: () => void
}

export function ReportCard({ content, reportDate, onChatClick, onViewAll }: ReportCardProps) {
  const { dailySummary, specialConversations, aiImageSummary } = content

  const [emblaRef] = useEmblaCarousel({
    align: "start",
    containScroll: false,
  })

  const date = new Date(reportDate)
  const formattedDateTitle = `${date.getMonth() + 1}월 ${date.getDate()}일, 오늘의 톡다이어리가 도착했어요.`

  const handleDownloadImage = async () => {
    if (!aiImageSummary.imageUrl) return

    try {
      const response = await fetch(aiImageSummary.imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `talkdiary-${reportDate}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Image download failed:', error)
    }
  }

  return (
    <div className="w-full">
      {/* 캐러셀 - 다음 카드가 살짝 보임 */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-2 items-start">
          {/* 1. 데일리 요약 카드 */}
          <div className="flex-[0_0_85%] min-w-0">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              {/* 타이틀 */}
              <h3 className="font-bold text-base text-foreground mb-2">{formattedDateTitle}</h3>

              {/* 요약 문구 */}
              <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
                {dailySummary.summaryText}
              </p>

              {/* 박스로 묶인 섹션들 */}
              <div className="space-y-2">
                {/* 오늘의 키워드 */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-semibold text-foreground">오늘의 키워드</span>
                  <div className="flex gap-1.5">
                    {dailySummary.keywords.map((keyword, idx) => {
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
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-semibold text-foreground">오늘의 감정 날씨</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-pink-100 rounded-full">
                    <span className="text-sm">☀️</span>
                    <span className="text-pink-500 text-xs font-medium">
                      {dailySummary.emotionWeather}
                    </span>
                  </div>
                </div>

                {/* 최고의 티키타카 */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <span className="text-sm font-semibold text-foreground">최고의 티키타카</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">😊</span>
                    <span className="text-sm font-medium text-foreground">{dailySummary.bestTikitaka.name}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 오늘의 특별한 대화 카드 */}
          <div className="flex-[0_0_85%] min-w-0">
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h4 className="font-bold text-base text-foreground mb-3">
                오늘의 특별한 대화를 확인해보세요.
              </h4>

              {/* 대화 목록 */}
              <div className="space-y-2">
                {specialConversations.map((conversation, idx) => {
                  const colors = getKeywordColor(conversation.keyword)
                  return (
                    <button
                      key={idx}
                      onClick={() => onChatClick?.(conversation.chatId, conversation.messageId)}
                      className="w-full text-left p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      {/* 키워드 태그 + 제목 */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 ${colors.bg} ${colors.text} rounded text-xs font-medium`}>
                          {conversation.keyword}
                        </span>
                        <span className="text-sm font-medium text-foreground">
                          {conversation.title}
                        </span>
                      </div>
                      {/* 미리보기 텍스트 */}
                      <p className="text-sm text-foreground/70 leading-relaxed mb-1">
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
            </div>
          </div>

          {/* 3. AI 이미지 요약 카드 */}
          {aiImageSummary.imageUrl && (
            <div className="flex-[0_0_85%] min-w-0">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {/* AI 이미지 */}
                <div className="relative aspect-square bg-gray-100">
                  <img
                    src={aiImageSummary.imageUrl}
                    alt="오늘의 AI 이미지"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* 버튼들 - 세로 배치 */}
                <div className="p-3 space-y-2">
                  <button
                    onClick={handleDownloadImage}
                    className="w-full py-3 bg-kakao-yellow rounded-xl text-sm font-medium text-foreground hover:bg-kakao-yellow/80 transition-colors"
                  >
                    이미지 다운로드
                  </button>
                  <button
                    onClick={onViewAll}
                    className="w-full py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
                  >
                    톡다이어리 전체보기
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
