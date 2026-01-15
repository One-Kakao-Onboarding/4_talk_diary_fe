"use client"

interface ReportTabProps {
  userId: string
}

export function ReportTab({ userId }: ReportTabProps) {
  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground text-sm">리포트 탭 준비중...</p>
    </div>
  )
}
