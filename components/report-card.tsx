"use client"

import { useState } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { Download, Loader2 } from "lucide-react"
import type { DailyReportContent, EmotionIcon } from "@/types/database"

// 감정 아이콘 이미지 경로 매핑 (7종류)
const emotionIconMap: Record<EmotionIcon, string> = {
  "기쁨": "/mind/기쁨.png",
  "슬픔": "/mind/슬픔.png",
  "신남": "/mind/신남.png",
  "분노": "/mind/분노.png",
  "놀라움": "/mind/놀라움.png",
  "그저그럼": "/mind/그저그럼.png",
  "설렘": "/mind/설렘.png",
}

// 감정 아이콘 이미지 경로 반환
const getEmotionIconPath = (icon?: EmotionIcon): string => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
  if (icon && emotionIconMap[icon]) {
    return `${basePath}${emotionIconMap[icon]}`
  }
  // 기본값: 기쁨
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

interface ReportCardProps {
  content: DailyReportContent
  reportDate: string
  onChatClick?: (chatId: string, messageId?: string) => void
  onViewAll?: () => void
}

export function ReportCard({ content, reportDate, onChatClick, onViewAll }: ReportCardProps) {
  const { dailySummary, specialConversations, aiImageSummary } = content
  const [isDownloading, setIsDownloading] = useState(false)

  const [emblaRef] = useEmblaCarousel({
    align: "center",
    containScroll: "trimSnaps",
    slidesToScroll: 1,
  })

  const date = new Date(reportDate)
  const formattedDateTitle = `${date.getMonth() + 1}월 ${date.getDate()}일, 오늘의 톡다이어리가 도착했어요.`

  const handleDownloadImage = async () => {
    if (!aiImageSummary.imageUrl || isDownloading) return

    setIsDownloading(true)

    try {
      // fetch로 이미지 다운로드 시도
      const response = await fetch(aiImageSummary.imageUrl, { mode: 'cors' })

      if (!response.ok) throw new Error('Fetch failed')

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
      // CORS 에러 등 발생 시 새 탭에서 열기
      console.error('Direct download failed, opening in new tab:', error)
      window.open(aiImageSummary.imageUrl, '_blank')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="w-full">
      {/* 캐러셀 - 좌우 카드가 살짝 보임 */}
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex items-start gap-3 px-3">
          {/* 1. 데일리 요약 카드 */}
          <div className="w-[360px] flex-shrink-0">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              {/* 타이틀 */}
              <h3 className="font-bold text-base text-foreground mb-2">{formattedDateTitle}</h3>

              {/* 요약 문구 */}
              <p className="text-sm text-foreground/80 mb-4 leading-relaxed">
                {dailySummary.summaryText}
              </p>

              {/* 박스로 묶인 섹션들 */}
              <div className="space-y-2">
                {/* 오늘의 키워드 */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-foreground">오늘의 키워드</span>
                  <div className="flex gap-1.5">
                    {dailySummary.keywords.map((keyword, idx) => {
                      const colors = getKeywordColor(keyword)
                      return (
                        <span
                          key={idx}
                          className={`px-3 py-1.5 ${colors.bg} ${colors.text} rounded-full text-xs font-medium`}
                        >
                          {keyword}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* 오늘의 감정 날씨 */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-foreground">오늘의 감정 날씨</span>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-100 rounded-full">
                    <img
                      src={getEmotionIconPath(dailySummary.emotionIcon)}
                      alt={dailySummary.emotionIcon || "감정"}
                      className="w-4 h-4 object-contain"
                    />
                    <span className="text-pink-500 text-xs font-medium">
                      {dailySummary.emotionWeather}
                    </span>
                  </div>
                </div>

                {/* 최고의 티키타카 */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-semibold text-foreground">최고의 티키타카</span>
                  {(() => {
                    const colors = getKeywordColor(dailySummary.bestTikitaka.name || "")
                    return (
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 ${colors.bg} rounded-lg flex items-center justify-center`}>
                          <span className={`text-xs font-medium ${colors.text}`}>
                            {dailySummary.bestTikitaka.name?.charAt(0) || "?"}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-foreground">{dailySummary.bestTikitaka.name}</span>
                      </div>
                    )
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* 2. 오늘의 특별한 대화 카드 */}
          <div className="w-[360px] flex-shrink-0">
            <div className="bg-white rounded-xl p-4 shadow-sm">
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
                      className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {/* 키워드 태그 + 제목 */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 ${colors.bg} ${colors.text} rounded-lg text-xs font-medium`}>
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
            <div className="w-[360px] flex-shrink-0">
              <div className="bg-white rounded-xl overflow-hidden shadow-sm">
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
                    disabled={isDownloading}
                    className="w-full py-3 bg-kakao-yellow rounded-lg text-sm font-medium text-foreground hover:bg-kakao-yellow/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        다운로드 중...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4" />
                        이미지 다운로드
                      </>
                    )}
                  </button>
                  <button
                    onClick={onViewAll}
                    className="w-full py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-foreground hover:bg-gray-50 transition-colors"
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
