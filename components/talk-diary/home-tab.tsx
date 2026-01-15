"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Gift } from "lucide-react"
import { fetchReports } from "@/lib/supabase"
import type { EmotionIcon } from "@/types/database"
import { isValidReportContent } from "@/types/database"

interface HomeTabProps {
  userId: string
}

// 감정 아이콘 이미지 경로
const getEmotionIconPath = (emotion: string): string => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
  return `${basePath}/mind/${emotion}.png`
}

// 티키타카 랭킹 타입
interface TikitakaRanking {
  name: string
  count: number
}

// 프로필 색상 팔레트
const profileColors = [
  { bg: "bg-pink-100", text: "text-pink-600" },
  { bg: "bg-blue-100", text: "text-blue-600" },
  { bg: "bg-green-100", text: "text-green-600" },
  { bg: "bg-purple-100", text: "text-purple-600" },
  { bg: "bg-orange-100", text: "text-orange-600" },
]

// 키워드 색상 팔레트
const keywordColors = [
  "text-black",
  "text-orange-500",
  "text-pink-500",
  "text-blue-500",
  "text-green-600",
  "text-purple-500",
  "text-red-500",
  "text-amber-600",
]

// 키워드 이모지 팔레트
const keywordEmojis = [
  "😊", "🎉", "💬", "☕", "🍪", "🎵", "💡", "🔥",
  "✨", "💪", "🎯", "📍", "💖", "🌟", "🍀", "🎈",
  "🌈", "⭐", "🏆", "💎", "🎁", "🌸", "🍕", "🎮",
]


// 문자열 해시 함수 (일관된 랜덤값 생성용)
const hashString = (str: string): number => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

const getProfileColor = (name: string) => {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return profileColors[Math.abs(hash) % profileColors.length]
}

export function HomeTab({ userId }: HomeTabProps) {
  // 오늘 날짜 (고정)
  const today = new Date()
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth()
  const todayDate = today.getDate()

  // 현재 보고 있는 년/월 (변경 가능)
  const [viewYear, setViewYear] = useState(todayYear)
  const [viewMonth, setViewMonth] = useState(todayMonth) // 0-indexed

  // 전체 리포트 데이터 (모든 달의 감정 데이터를 저장)
  const [allEmotions, setAllEmotions] = useState<Record<string, EmotionIcon>>({})
  const [allKeywords, setAllKeywords] = useState<Record<string, string[]>>({}) // 날짜별 키워드
  const [allImages, setAllImages] = useState<Record<string, string>>({}) // 날짜별 이미지 URL
  const [allTikitaka, setAllTikitaka] = useState<Record<string, string>>({}) // 날짜별 티키타카 파트너
  const [isLoading, setIsLoading] = useState(true)

  // 달력 데이터 생성
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

  // 이전 달로 이동
  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1)
      setViewMonth(11)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  // 다음 달로 이동
  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1)
      setViewMonth(0)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  // 리포트 데이터 로드 (전체)
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      const reports = await fetchReports(userId)

      // 모든 감정 데이터 추출 (날짜 키: "YYYY-MM-DD")
      const emotions: Record<string, EmotionIcon> = {}
      const keywords: Record<string, string[]> = {}
      const images: Record<string, string> = {}
      const tikitaka: Record<string, string> = {}

      reports.forEach((report) => {
        if (!isValidReportContent(report.content)) return

        const targetDate = report.content.report_meta.target_date
        const dominant = report.content.dashboard?.emotion_weather?.dominant
        if (dominant) {
          emotions[targetDate] = dominant
        }

        // 키워드 추출 (daily_keywords에서 text 추출)
        const dailyKeywords = report.content.dashboard?.daily_keywords
        if (dailyKeywords && Array.isArray(dailyKeywords) && dailyKeywords.length > 0) {
          const extractedKeywords = dailyKeywords
            .map(k => typeof k === 'string' ? k : k?.text)
            .filter((k): k is string => !!k)
          if (extractedKeywords.length > 0) {
            keywords[targetDate] = extractedKeywords
          }
        }

        // 이미지 URL 추출
        const imageUrl = report.content.summary_image_url
        if (imageUrl) {
          images[targetDate] = imageUrl
        }

        // 티키타카 파트너 추출
        const partnerName = report.content.dashboard?.best_chemistry?.partner_name
        if (partnerName) {
          tikitaka[targetDate] = partnerName
        }
      })

      setAllEmotions(emotions)
      setAllKeywords(keywords)
      setAllImages(images)
      setAllTikitaka(tikitaka)

      setIsLoading(false)
    }

    loadData()
  }, [userId, todayYear, todayMonth])

  // 날짜 키 생성 함수
  const getDateKey = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
  }

  // 현재 보고 있는 달이 오늘이 포함된 달인지
  const isCurrentMonth = viewYear === todayYear && viewMonth === todayMonth

  // 현재 보고 있는 달의 키워드 수집
  const allViewMonthKeywords = Object.entries(allKeywords)
    .filter(([dateKey]) => {
      // dateKey 형식: "YYYY-MM-DD"
      const [year, month] = dateKey.split('-').map(Number)
      return year === viewYear && month === viewMonth + 1
    })
    .flatMap(([, keywords]) => keywords)
    .filter((keyword, index, self) => self.indexOf(keyword) === index) // 중복 제거

  // 랜덤으로 최대 10개 선택
  const [keywordSeed, setKeywordSeed] = useState(() => Math.random())
  useEffect(() => {
    setKeywordSeed(Math.random())
  }, [viewYear, viewMonth])

  const viewMonthKeywords = [...allViewMonthKeywords]
    .map((keyword, i) => ({ keyword, sort: Math.sin(keywordSeed * (i + 1) * 9999) }))
    .sort((a, b) => a.sort - b.sort)
    .slice(0, 10)
    .map(item => item.keyword)

  // 현재 보고 있는 달의 이미지 수집
  const viewMonthImages = Object.entries(allImages)
    .filter(([dateKey]) => {
      const [year, month] = dateKey.split('-').map(Number)
      return year === viewYear && month === viewMonth + 1
    })
    .map(([, imageUrl]) => imageUrl)

  // 현재 보고 있는 달의 티키타카 랭킹 계산
  const viewMonthRanking = (() => {
    const tikitakaCount: Record<string, number> = {}
    Object.entries(allTikitaka)
      .filter(([dateKey]) => {
        const [year, month] = dateKey.split('-').map(Number)
        return year === viewYear && month === viewMonth + 1
      })
      .forEach(([, partnerName]) => {
        tikitakaCount[partnerName] = (tikitakaCount[partnerName] || 0) + 1
      })

    return Object.entries(tikitakaCount)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)
  })()

  // 랜덤 이미지 선택 (조회할 때마다 랜덤)
  const [randomImageIndex, setRandomImageIndex] = useState(0)

  useEffect(() => {
    if (viewMonthImages.length > 0) {
      setRandomImageIndex(Math.floor(Math.random() * viewMonthImages.length))
    }
  }, [viewMonthImages.length, viewYear, viewMonth])

  const randomImage = viewMonthImages.length > 0
    ? viewMonthImages[randomImageIndex % viewMonthImages.length]
    : null

  return (
    <div className="space-y-6">
      {/* 감정 달력 */}
      <section className="bg-white rounded-xl p-5 shadow-[0_0_12px_rgba(0,0,0,0.1)]">
        {/* 헤더: 년월 + 네비게이션 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={goToPrevMonth}
            className="p-1 text-foreground/60 hover:text-foreground"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="font-semibold text-foreground">
            {viewYear}.{String(viewMonth + 1).padStart(2, "0")}
          </h2>
          <button
            onClick={goToNextMonth}
            className="p-1 text-foreground/60 hover:text-foreground"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
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

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {/* 이전 달 날짜들 */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => {
            const prevMonthDay = daysInPrevMonth - firstDayOfMonth + i + 1
            const isSunday = i === 0 // 첫 번째 칸이 일요일
            return (
              <div key={`prev-${i}`} className="flex flex-col items-center py-1 gap-0.5">
                <span className={`text-[11px] ${isSunday ? "text-red-300" : "text-gray-300"}`}>{prevMonthDay}</span>
                <div className="w-10 h-10" />
              </div>
            )
          })}

          {/* 현재 달 날짜들 */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateKey = getDateKey(viewYear, viewMonth, day)
            const emotion = allEmotions[dateKey]
            const isToday = isCurrentMonth && day === todayDate
            const dayOfWeek = (firstDayOfMonth + i) % 7 // 0 = 일요일
            const isSunday = dayOfWeek === 0

            return (
              <div key={day} className="flex flex-col items-center py-1 gap-0.5">
                {/* 날짜 숫자 */}
                <div className={`w-5 h-5 flex items-center justify-center ${isToday ? "bg-black rounded-full" : ""}`}>
                  <span className={`text-[11px] ${
                    isToday
                      ? "text-white font-medium"
                      : isSunday
                        ? "text-red-500"
                        : "text-foreground/60"
                  }`}>
                    {day}
                  </span>
                </div>
                {/* 감정 아이콘 */}
                {emotion ? (
                  <img
                    src={getEmotionIconPath(emotion)}
                    alt={emotion}
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-200" />
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 이달의 티키타카 랭킹 */}
      <section>
        <h2 className="font-semibold text-foreground mb-4">이달의 티키타카 랭킹</h2>

        <div className="space-y-2">
          {viewMonthRanking.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-sm text-muted-foreground">아직 데이터가 없습니다</p>
            </div>
          ) : (
            viewMonthRanking.map((person, idx) => {
              const colors = getProfileColor(person.name)
              const rankNum = idx + 1
              const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: '#F5F5F5' }}
                >
                  <div className="flex items-center gap-2">
                    {/* 메달 아이콘 */}
                    <img
                      src={`${basePath}/rank/${rankNum}.png`}
                      alt={`${rankNum}등`}
                      className="w-6 h-6 object-contain"
                    />
                    {/* 프로필 아바타 */}
                    <div className={`w-11 h-11 ${colors.bg} rounded-full flex items-center justify-center`}>
                      <span className={`text-base font-medium ${colors.text}`}>
                        {person.name.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{person.name}</p>
                      <p className="text-xs text-gray-400">티키타카 {person.count}회</p>
                    </div>
                  </div>
                  <button className="flex items-center gap-1 px-4 py-1.5 text-xs font-medium text-gray-500 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
                    <Gift className="w-3.5 h-3.5" />
                    선물하기
                  </button>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* 키워드 컬렉션 */}
      <section className="bg-white rounded-xl p-5 shadow-[0_0_12px_rgba(0,0,0,0.1)]">
        <h2 className="font-semibold text-foreground mb-4">키워드 컬렉션</h2>

        {viewMonthKeywords.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">아직 키워드가 없습니다</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-3 gap-y-2 items-baseline">
            {viewMonthKeywords.map((keyword, idx) => {
              const hash = hashString(keyword)
              const colorClass = keywordColors[hash % keywordColors.length]
              const emoji = keywordEmojis[hash % keywordEmojis.length]

              return (
                <span
                  key={idx}
                  className={`${colorClass} text-4xl font-bold whitespace-nowrap`}
                >
                  {keyword}{emoji}
                </span>
              )
            })}
          </div>
        )}
      </section>

      {/* AI 갤러리 */}
      <section>
        <h2 className="font-semibold text-foreground mb-4">AI 갤러리</h2>

        {randomImage ? (
          <img
            src={randomImage}
            alt="AI 생성 이미지"
            className="w-full rounded-xl object-cover"
          />
        ) : (
          <div className="w-full h-48 rounded-xl bg-gray-100 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">아직 이미지가 없습니다</p>
          </div>
        )}
      </section>

    </div>
  )
}
