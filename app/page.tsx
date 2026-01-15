"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/login-form"
import { ChatList } from "@/components/chat-list"
import { ChatRoom } from "@/components/chat-room"
import { TalkDiaryPage } from "@/components/talk-diary-page"
import { TalkDiaryNotification } from "@/components/talk-diary-notification"
import { ArchivePage } from "@/components/archive-page"
import { BottomNav, BottomTabType } from "@/components/bottom-nav"
import { getUserId, getUserName, saveTalkDiaryLastRead, supabase } from "@/lib/supabase"
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
  const [targetMessageId, setTargetMessageId] = useState<string | undefined>(undefined)
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
      // 초기 히스토리 상태 설정
      window.history.replaceState({ view: "main" }, "")
    }

    setIsLoading(false)
  }, [])

  // 로그인 처리
  const handleLogin = (id: string, name: string) => {
    setUserId(id)
    setUserName(name)
    setView("main")
    window.history.replaceState({ view: "main" }, "")
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
      // 톡다이어리 진입 시 읽음 시간 저장
      saveTalkDiaryLastRead(new Date().toISOString())
      setView("talk-diary")
      window.history.pushState({ view: "talk-diary" }, "")
    } else {
      setSelectedChat(chat)
      setTargetMessageId(undefined) // 일반 선택 시 타겟 메시지 초기화
      setView("chat-room")
      window.history.pushState({ view: "chat-room", chatId: chat.id }, "")
    }
  }

  // 채팅방에서 나가기 (앱 내 뒤로가기 버튼 - history.back()으로 통일)
  const handleBackToList = () => {
    window.history.back()
  }

  // 톡다이어리 알림 클릭 시 톡다이어리 페이지로 이동
  const handleNotificationClick = () => {
    // 톡다이어리 진입 시 읽음 시간 저장
    saveTalkDiaryLastRead(new Date().toISOString())
    setShowNotification(false)
    setView("talk-diary")
    window.history.pushState({ view: "talk-diary" }, "")
  }

  // 브라우저 뒤로가기 버튼 처리
  useEffect(() => {
    const handlePopState = () => {
      // 채팅방이나 톡다이어리에서 뒤로가기 시 메인으로
      if (view === "chat-room" || view === "talk-diary") {
        setSelectedChat(null)
        setChatListKey(prev => prev + 1)
        setView("main")
      }
    }

    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [view])

  // Supabase Realtime 구독으로 새 리포트 감지
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('new-report-notification')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports',
          filter: `profile_id=eq.${userId}`,
        },
        () => {
          // 새 리포트 도착 시 알림만 표시 (채팅 목록은 자체적으로 업데이트)
          setShowNotification(true)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  // 초기 로딩
  if (isLoading) {
    return (
      <main className="flex h-screen-safe bg-background max-w-md mx-auto border-x border-border items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </main>
    )
  }

  return (
    <main className="flex flex-col h-screen-safe bg-background max-w-md mx-auto border-x border-border relative">
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
            <>
              <ChatList
                key={chatListKey}
                userId={userId}
                userName={userName}
                onSelectChat={handleSelectChat}
                onLogout={handleLogout}
                onUnreadCountChange={setUnreadCount}
              />
              <BottomNav
                activeTab={bottomTab}
                onTabChange={() => {}}
                unreadCount={unreadCount}
              />
            </>
          ) : (
            <ArchivePage
              userId={userId}
              onClose={() => setBottomTab("chat")}
              onNavigateToChat={async (chatId, messageId) => {
                const { data: chatData } = await supabase
                  .from('chats')
                  .select('*')
                  .eq('id', chatId)
                  .single()

                if (chatData) {
                  setSelectedChat(chatData)
                  setTargetMessageId(messageId)
                  setBottomTab("chat")
                  setView("chat-room")
                  window.history.pushState({ view: "chat-room", chatId, messageId }, "")
                }
              }}
            />
          )}
        </>
      )}

      {view === "chat-room" && selectedChat && userId && userName && (
        <ChatRoom
          chat={selectedChat}
          userId={userId}
          userName={userName}
          onBack={handleBackToList}
          targetMessageId={targetMessageId}
        />
      )}

      {view === "talk-diary" && userId && (
        <TalkDiaryPage
          userId={userId}
          onBack={handleBackToList}
          onNavigateToChat={async (chatId, messageId) => {
            // 채팅방 정보 조회
            const { data: chatData } = await supabase
              .from('chats')
              .select('*')
              .eq('id', chatId)
              .single()

            if (chatData) {
              setSelectedChat(chatData)
              setTargetMessageId(messageId)
              setView("chat-room")
              window.history.pushState({ view: "chat-room", chatId, messageId }, "")
            }
          }}
          onViewAll={() => {
            // 톡다이어리 탭으로 이동 (history.back 대신 직접 상태 변경)
            setSelectedChat(null)
            setBottomTab("archive")
            setView("main")
            window.history.replaceState({ view: "main" }, "")
          }}
        />
      )}
    </main>
  )
}
