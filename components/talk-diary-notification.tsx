"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

interface TalkDiaryNotificationProps {
  userName: string
  isVisible: boolean
  onClose: () => void
  onClick?: () => void
}

export function TalkDiaryNotification({
  userName,
  isVisible,
  onClose,
  onClick,
}: TalkDiaryNotificationProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isVisible) {
      // 약간의 딜레이 후 애니메이션 시작
      const showTimer = setTimeout(() => setShow(true), 50)
      // 1.5초 후 자동으로 닫힘
      const closeTimer = setTimeout(() => {
        setShow(false)
        setTimeout(onClose, 300) // 애니메이션 완료 후 닫기
      }, 1500)

      return () => {
        clearTimeout(showTimer)
        clearTimeout(closeTimer)
      }
    } else {
      setShow(false)
    }
  }, [isVisible, onClose])

  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-3 pointer-events-none">
      <button
        onClick={() => {
          setShow(false)
          setTimeout(() => {
            onClose()
            onClick?.()
          }, 300)
        }}
        className={cn(
          "w-full max-w-md bg-white rounded-2xl shadow-lg p-3 flex items-center gap-3 pointer-events-auto transition-all duration-300",
          show
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-full"
        )}
      >
        {/* 프로필 이미지 */}
        <img
          src="/dairy_profile.png"
          alt="톡다이어리"
          className="w-10 h-10 rounded-xl shrink-0 object-cover"
        />

        {/* 텍스트 */}
        <div className="flex-1 text-left min-w-0">
          <p className="font-semibold text-sm text-foreground">톡다이어리</p>
          <p className="text-sm text-foreground/70 truncate">
            {userName}님, 오늘의 톡다이어리가 도착했어요.
          </p>
        </div>
      </button>
    </div>
  )
}
