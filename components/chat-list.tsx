"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, X, LogOut, MessageCircle } from "lucide-react"
import { supabase, clearUserSession } from "@/lib/supabase"
import type { Chat, Profile } from "@/types/database"
import { cn } from "@/lib/utils"

type TabType = "내 채팅" | "공개방"

interface ChatWithDetails extends Chat {
  memberCount: number
  lastMessage?: string
  lastMessageTime?: string
  unreadCount: number
  isMember: boolean
}

interface ChatListProps {
  userId: string
  userName: string
  onSelectChat: (chat: Chat) => void
  onLogout: () => void
  onUnreadCountChange?: (count: number) => void
}

export function ChatList({ userId, userName, onSelectChat, onLogout, onUnreadCountChange }: ChatListProps) {
  const [activeTab, setActiveTab] = useState<TabType>("내 채팅")

  // 탭 변경 핸들러 - 탭 변경 시 해당 데이터 새로고침
  const handleTabChange = async (tab: TabType) => {
    setActiveTab(tab)
    if (tab === "공개방") {
      await fetchPublicChats()
    } else {
      await fetchMyChats()
    }
  }
  const [myChats, setMyChats] = useState<ChatWithDetails[]>([])
  const [publicChats, setPublicChats] = useState<ChatWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newChatName, setNewChatName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  // 내 채팅방 목록 조회
  const fetchMyChats = useCallback(async () => {
    const { data: memberships, error } = await supabase
      .from('chat_members')
      .select(`
        chat_id,
        last_read_at,
        chats:chat_id (
          id,
          name,
          created_at
        )
      `)
      .eq('user_id', userId)

    if (error) {
      console.error('Error fetching my chats:', error)
      return
    }

    const chatsWithDetails: ChatWithDetails[] = await Promise.all(
      (memberships || []).map(async (membership: any) => {
        const chat = membership.chats

        // 멤버 수 조회
        const { count: memberCount } = await supabase
          .from('chat_members')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)

        // 마지막 메시지 조회
        const { data: lastMessages } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('chat_id', chat.id)
          .order('created_at', { ascending: false })
          .limit(1)

        const lastMsg = lastMessages?.[0] as { content: string; created_at: string } | undefined

        // 읽지 않은 메시지 수 조회
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .gt('created_at', membership.last_read_at || '1970-01-01')

        return {
          ...chat,
          memberCount: memberCount || 0,
          lastMessage: lastMsg?.content,
          lastMessageTime: lastMsg?.created_at ? formatTime(lastMsg.created_at) : undefined,
          unreadCount: unreadCount || 0,
          isMember: true,
        }
      })
    )

    // 최근 메시지 순 정렬
    chatsWithDetails.sort((a, b) => {
      if (!a.lastMessageTime && !b.lastMessageTime) return 0
      if (!a.lastMessageTime) return 1
      if (!b.lastMessageTime) return -1
      return b.lastMessageTime.localeCompare(a.lastMessageTime)
    })

    setMyChats(chatsWithDetails)
  }, [userId])

  // 공개 채팅방 목록 조회
  const fetchPublicChats = useCallback(async () => {
    const { data: chats, error } = await supabase
      .from('chats')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching public chats:', error)
      return
    }

    const chatsWithDetails: ChatWithDetails[] = await Promise.all(
      (chats || []).map(async (chat: Chat) => {
        // 멤버 수 조회
        const { count: memberCount } = await supabase
          .from('chat_members')
          .select('*', { count: 'exact', head: true })
          .eq('chat_id', chat.id)

        // 참여 여부 확인
        const { data: membership } = await supabase
          .from('chat_members')
          .select('chat_id')
          .eq('chat_id', chat.id)
          .eq('user_id', userId)
          .single()

        return {
          ...chat,
          memberCount: memberCount || 0,
          unreadCount: 0,
          isMember: !!membership,
        }
      })
    )

    setPublicChats(chatsWithDetails)
  }, [userId])

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchMyChats(), fetchPublicChats()])
      setIsLoading(false)
    }
    loadData()
  }, [fetchMyChats, fetchPublicChats])

  // 실시간 메시지 구독
  useEffect(() => {
    const channel = supabase
      .channel('chat-list-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => {
          fetchMyChats()
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chats' },
        () => {
          fetchPublicChats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchMyChats, fetchPublicChats])

  // 채팅방 생성
  const handleCreateChat = async () => {
    const trimmedName = newChatName.trim()
    if (!trimmedName) return

    setIsCreating(true)

    try {
      // 채팅방 생성
      const { data: newChat, error: chatError } = await supabase
        .from('chats')
        .insert({ name: trimmedName })
        .select()
        .single()

      if (chatError) throw chatError

      // 생성자를 멤버로 추가
      const { error: memberError } = await supabase
        .from('chat_members')
        .insert({
          chat_id: newChat.id,
          user_id: userId,
        })

      if (memberError) throw memberError

      // 목록 새로고침
      await Promise.all([fetchMyChats(), fetchPublicChats()])

      setShowCreateModal(false)
      setNewChatName("")

      // 생성된 채팅방으로 이동
      onSelectChat(newChat)
    } catch (err) {
      console.error('Error creating chat:', err)
      alert('채팅방 생성 중 오류가 발생했습니다.')
    } finally {
      setIsCreating(false)
    }
  }

  // 채팅방 참여
  const handleJoinChat = async (chat: ChatWithDetails) => {
    if (chat.isMember) {
      onSelectChat(chat)
      return
    }

    try {
      const { error } = await supabase
        .from('chat_members')
        .insert({
          chat_id: chat.id,
          user_id: userId,
        })

      if (error) throw error

      await Promise.all([fetchMyChats(), fetchPublicChats()])
      onSelectChat(chat)
    } catch (err) {
      console.error('Error joining chat:', err)
      alert('채팅방 참여 중 오류가 발생했습니다.')
    }
  }

  // 로그아웃
  const handleLogout = () => {
    clearUserSession()
    onLogout()
  }

  const totalUnread = myChats.reduce((acc, chat) => acc + chat.unreadCount, 0)

  // totalUnread가 변경될 때 부모에게 알림
  useEffect(() => {
    onUnreadCountChange?.(totalUnread)
  }, [totalUnread, onUnreadCountChange])

  return (
    <div className="flex flex-col flex-1 bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3">
        <h1 className="text-2xl font-bold text-foreground">채팅</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-foreground/70 hover:text-foreground"
            title="채팅방 만들기"
          >
            <Plus className="w-6 h-6" />
          </button>
          <button
            onClick={handleLogout}
            className="text-foreground/70 hover:text-foreground"
            title="로그아웃"
          >
            <LogOut className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-2 px-4 py-2">
        {(["내 채팅", "공개방"] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={cn(
              "flex items-center gap-1 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              activeTab === tab
                ? "bg-foreground text-background"
                : "bg-muted text-foreground hover:bg-muted/80",
            )}
          >
            {tab}
            {tab === "내 채팅" && totalUnread > 0 && (
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-kakao-orange text-white">
                {totalUnread > 99 ? "99+" : totalUnread}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* User Info Banner */}
      <div className="mx-4 my-3 p-4 bg-muted rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground font-medium">{userName}님, 환영합니다!</p>
            <p className="text-muted-foreground text-sm">
              {activeTab === "내 채팅"
                ? `참여 중인 채팅방 ${myChats.length}개`
                : `전체 공개방 ${publicChats.length}개`}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-2xl">💬</span>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        ) : activeTab === "내 채팅" ? (
          myChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <p>참여 중인 채팅방이 없습니다</p>
              <p className="text-sm mt-1">공개방에서 채팅방에 참여하거나 새로 만들어보세요</p>
            </div>
          ) : (
            myChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left"
              >
                {/* Avatar */}
                <div className="w-14 h-14 bg-kakao-yellow rounded-full flex items-center justify-center shrink-0">
                  <MessageCircle className="w-7 h-7 text-foreground" />
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground truncate">{chat.name}</span>
                    <span className="text-muted-foreground text-sm">{chat.memberCount}</span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.lastMessage || "메시지가 없습니다"}
                  </p>
                </div>

                {/* Time & Unread */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                  {chat.lastMessageTime && (
                    <span className="text-xs text-muted-foreground">{chat.lastMessageTime}</span>
                  )}
                  {chat.unreadCount > 0 && (
                    <span className="bg-kakao-orange text-white text-xs font-medium px-2 py-0.5 rounded-full min-w-5 text-center">
                      {chat.unreadCount > 99 ? "99+" : chat.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            ))
          )
        ) : (
          publicChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <p>공개 채팅방이 없습니다</p>
              <p className="text-sm mt-1">첫 번째 채팅방을 만들어보세요!</p>
            </div>
          ) : (
            publicChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleJoinChat(chat)}
                className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left"
              >
                {/* Avatar */}
                <div className="w-14 h-14 bg-kakao-yellow rounded-full flex items-center justify-center shrink-0">
                  <MessageCircle className="w-7 h-7 text-foreground" />
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-medium text-foreground truncate">{chat.name}</span>
                    <span className="text-muted-foreground text-sm">{chat.memberCount}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {chat.isMember ? "참여 중" : "참여하기"}
                  </p>
                </div>

                {/* Status */}
                <div className="shrink-0">
                  {chat.isMember ? (
                    <span className="text-xs text-green-600 font-medium px-2 py-1 bg-green-100 rounded-full">
                      참여중
                    </span>
                  ) : (
                    <span className="text-xs text-kakao-orange font-medium px-2 py-1 bg-orange-100 rounded-full">
                      참여하기
                    </span>
                  )}
                </div>
              </button>
            ))
          )
        )}
      </div>

      {/* Create Chat Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-2xl w-[90%] max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">새 채팅방 만들기</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <input
              type="text"
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              placeholder="채팅방 이름을 입력하세요"
              className="w-full px-4 py-3 rounded-lg bg-muted border-0 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-kakao-yellow"
              autoFocus
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 rounded-lg bg-muted text-foreground font-medium"
              >
                취소
              </button>
              <button
                onClick={handleCreateChat}
                disabled={!newChatName.trim() || isCreating}
                className="flex-1 py-3 rounded-lg bg-kakao-yellow text-foreground font-medium disabled:opacity-50"
              >
                {isCreating ? "생성 중..." : "만들기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// 시간 포맷팅 헬퍼
function formatTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString('ko-KR', { hour: 'numeric', minute: '2-digit', hour12: true })
  } else if (diffDays === 1) {
    return '어제'
  } else if (diffDays < 7) {
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return days[date.getDay()] + '요일'
  } else {
    return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
  }
}
