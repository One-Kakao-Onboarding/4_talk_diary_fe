"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { ChatList } from "@/components/chat-list"
import { ChatRoom } from "@/components/chat-room"
import { TalkDiaryPage } from "@/components/talk-diary-page"
import { TalkDiaryNotification } from "@/components/talk-diary-notification"
import { ArchivePage } from "@/components/archive-page"
import { BottomNav, BottomTabType } from "@/components/bottom-nav"
import { getUserId, getUserName } from "@/lib/supabase"
import type { Chat } from "@/types/database"

type View = "login" | "main" | "chat-room" | "talk-diary"

// 톡다이어리 식별용 ID
const TALK_DIARY_ID = "talk-diary-system"

export default function Home() {
  const [view, setView] = useState<View>("login")
  const [bottomTab, setBottomTab] = useState<BottomTabType>("chat")
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [chatListKey, setChatListKey] = useState(0) // 채팅 목록 새로고침용
  const [showNotification, setShowNotification] = useState(false)

  // 로컬 스토리지에서 사용자 정보 복원
  useEffect(() => {
    const storedUserId = getUserId()
    const storedUserName = getUserName()

    if (storedUserId && storedUserName) {
      setUserId(storedUserId)
      setUserName(storedUserName)
      setView("main")
      // 임시: 새로고침 시 알림 표시
      setShowNotification(true)
    }

    setIsLoading(false)
  }, [])

  // 로그인 처리
  const handleLogin = (id: string, name: string) => {
    setUserId(id)
    setUserName(name)
    setView("main")
  }

  // 로그아웃 처리
  const handleLogout = () => {
    setUserId(null)
    setUserName(null)
    setSelectedChat(null)
    setBottomTab("chat")
    setView("login")
  }

  // 채팅방 선택
  const handleSelectChat = (chat: Chat) => {
    if (chat.id === TALK_DIARY_ID) {
      setView("talk-diary")
    } else {
      setSelectedChat(chat)
      setView("chat-room")
    }
  }

  // 채팅방에서 나가기
  const handleBackToList = () => {
    setSelectedChat(null)
    setChatListKey(prev => prev + 1) // 목록 새로고침 트리거
    setView("main")
  }

  // 톡다이어리 알림 클릭 시 톡다이어리 페이지로 이동
  const handleNotificationClick = () => {
    setView("talk-diary")
  }

  // TODO: Supabase Realtime 구독으로 새 리포트 감지 시 호출
  // const triggerNotification = () => {
  //   setShowNotification(true)
  //   setChatListKey(prev => prev + 1)
  // }

  // 초기 로딩
  if (isLoading) {
    return (
      <main className="flex h-screen bg-background max-w-md mx-auto border-x border-border items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </main>
    )
  }

  return (
    <main className="flex flex-col h-screen bg-background max-w-md mx-auto border-x border-border relative">
      {/* 톡다이어리 알림 */}
      {userName && (
        <TalkDiaryNotification
          userName={userName}
          isVisible={showNotification}
          onClose={() => setShowNotification(false)}
          onClick={handleNotificationClick}
        />
      )}

      {view === "login" && (
        <LoginForm onLogin={handleLogin} />
      )}

      {view === "main" && userId && userName && (
        <>
          {bottomTab === "chat" ? (
            <ChatList
              key={chatListKey}
              userId={userId}
              userName={userName}
              onSelectChat={handleSelectChat}
              onLogout={handleLogout}
              onUnreadCountChange={setUnreadCount}
            />
          ) : (
            <ArchivePage onLogout={handleLogout} />
          )}
          <BottomNav
            activeTab={bottomTab}
            onTabChange={setBottomTab}
            unreadCount={unreadCount}
          />
        </>
      )}

      {view === "chat-room" && selectedChat && userId && userName && (
        <ChatRoom
          chat={selectedChat}
          userId={userId}
          userName={userName}
          onBack={handleBackToList}
        />
      )}

      {view === "talk-diary" && userId && (
        <TalkDiaryPage
          userId={userId}
          onBack={handleBackToList}
          onNavigateToChat={(chatId, messageId) => {
            // TODO: 해당 채팅방으로 이동
          }}
        />
      )}
    </main>
  )
}
