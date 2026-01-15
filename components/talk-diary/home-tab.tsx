"use client"

import { ChevronRight } from "lucide-react"

// 감정 아이콘 이미지 경로
const getEmotionIconPath = (emotion: string): string => {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ""
  return `${basePath}/mind/${emotion}.png`
}

// Mock 데이터: 이달의 감정 달력
const mockCalendarEmotions: Record<number, string> = {
  1: "기쁨", 2: "그저그럼", 3: "기쁨", 4: "그저그럼", 5: "기쁨", 6: "기쁨", 7: "신남",
  8: "신남", 9: "슬픔", 10: "기쁨", 11: "분노", 12: "분노", 13: "분노", 14: "그저그럼",
  15: "놀라움", 16: "신남", 17: "신남", 18: "설렘",
}

// Mock 데이터: 이달의 티키타카 랭킹
const mockRanking = [
  { name: "춘식이", count: 8 },
  { name: "무지", count: 5 },
  { name: "Sarah", count: 3 },
]

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

export function HomeTab() {
  // 현재 년월
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  // 달력 데이터 생성
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()

  return (
    <div className="space-y-6">
      {/* 감정 달력 미니 */}
      <section className="bg-gray-50 rounded-2xl p-4">
        <h2 className="font-semibold text-foreground mb-3">
          {year}년 {String(month).padStart(2, "0")}월
        </h2>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((day) => (
            <div key={day} className="text-center text-xs text-muted-foreground">
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {/* 첫째 주 빈 칸 */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* 날짜들 */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const emotion = mockCalendarEmotions[day]
            return (
              <div key={day} className="aspect-square flex items-center justify-center">
                {emotion ? (
                  <img
                    src={getEmotionIconPath(emotion)}
                    alt={emotion}
                    className="w-8 h-8 object-contain"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-gray-200" />
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 이달의 티키타카 랭킹 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">이달의 티키타카 랭킹</h2>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          {mockRanking.map((person, idx) => {
            const colors = getProfileColor(person.name)
            return (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${colors.bg} rounded-full flex items-center justify-center`}>
                    <span className={`text-sm font-medium ${colors.text}`}>
                      {person.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{person.name}</p>
                    <p className="text-xs text-muted-foreground">티키타카 {person.count}회</p>
                  </div>
                </div>
                <button className="px-3 py-1.5 text-xs font-medium text-foreground border border-gray-300 rounded-full hover:bg-gray-100 transition-colors">
                  선물하기
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* 추억 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">추억</h2>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>

        <div className="bg-gray-50 rounded-2xl h-48 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">추억이 쌓이는 중...</p>
        </div>
      </section>

      {/* 키워드 컬렉션 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-foreground">키워드 컬렉션</h2>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>

        <div className="bg-gray-50 rounded-2xl h-24 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">키워드를 모으는 중...</p>
        </div>
      </section>
    </div>
  )
}
