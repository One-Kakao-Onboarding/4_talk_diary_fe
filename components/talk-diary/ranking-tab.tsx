"use client"

interface RankingTabProps {
  userId: string
}

export function RankingTab({ userId }: RankingTabProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground text-sm">랭킹 탭 준비중...</p>
    </div>
  )
}
