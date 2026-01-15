"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight, Send, Calendar } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Chat, Message, Profile } from "@/types/database"
import { cn } from "@/lib/utils"

interface MessageWithSender extends Message {
  sender: Profile | null
}

interface ChatRoomProps {
  chat: Chat
  userId: string
  userName: string
  onBack: () => void
}

export function ChatRoom({ chat, userId, userName, onBack }: ChatRoomProps) {
  const [messages, setMessages] = useState<MessageWithSender[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [memberCount, setMemberCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const isAtBottomRef = useRef(true)

  // 스크롤을 맨 아래로
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  // 메시지 목록 조회
  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id (
          id,
          name
        )
      `)
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return
    }

    setMessages(data || [])
  }, [chat.id])

  // 멤버 수 조회
  const fetchMemberCount = useCallback(async () => {
    const { count } = await supabase
      .from('chat_members')
      .select('*', { count: 'exact', head: true })
      .eq('chat_id', chat.id)

    setMemberCount(count || 0)
  }, [chat.id])

  // 읽음 처리
  const updateLastRead = useCallback(async () => {
    await supabase
      .from('chat_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('chat_id', chat.id)
      .eq('user_id', userId)
  }, [chat.id, userId])

  // 초기 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchMessages(), fetchMemberCount()])
      await updateLastRead()
      setIsLoading(false)
    }
    loadData()
  }, [fetchMessages, fetchMemberCount, updateLastRead])

  // 메시지 로드 후 스크롤
  useEffect(() => {
    if (!isLoading) {
      scrollToBottom()
    }
  }, [isLoading, messages.length, scrollToBottom])

  // 스크롤 위치 추적 (하단에 있는지 확인)
  const checkIfAtBottom = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return true

    const threshold = 50 // 하단에서 50px 이내면 하단으로 간주
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < threshold
    isAtBottomRef.current = isAtBottom
    return isAtBottom
  }, [])

  // 스크롤 이벤트 핸들러
  const handleScroll = useCallback(() => {
    checkIfAtBottom()
  }, [checkIfAtBottom])

  // 키보드가 올라올 때 스크롤 하단 유지 (하단에 있을 때만)
  useEffect(() => {
    const viewport = window.visualViewport
    if (!viewport) return

    let prevHeight = viewport.height

    const handleResize = () => {
      const currentHeight = viewport.height
      // 뷰포트 높이가 줄어들면 (키보드가 올라오면) + 하단에 있었다면 스크롤을 맨 아래로
      if (currentHeight < prevHeight && isAtBottomRef.current) {
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
        }, 50)
      }
      prevHeight = currentHeight
    }

    viewport.addEventListener("resize", handleResize)
    return () => viewport.removeEventListener("resize", handleResize)
  }, [])

  // input focus 시에도 스크롤 (하단에 있을 때만)
  const handleInputFocus = () => {
    if (isAtBottomRef.current) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "instant" })
      }, 300)
    }
  }

  // 실시간 메시지 구독
  useEffect(() => {
    const channel = supabase
      .channel(`chat:${chat.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chat.id}`,
        },
        async (payload: { new: Record<string, any> }) => {
          // 발신자 정보 조회
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.sender_id)
            .single()

          const newMessage: MessageWithSender = {
            ...(payload.new as Message),
            sender,
          }

          setMessages((prev) => [...prev, newMessage])

          // 읽음 처리
          await updateLastRead()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chat.id, updateLastRead])

  // 뒤로가기 시 읽음 처리
  const handleBack = async () => {
    await updateLastRead()
    onBack()
  }

  // 메시지 전송
  const handleSendMessage = async () => {
    const content = inputValue.trim()
    if (!content || isSending) return

    setIsSending(true)
    setInputValue("")

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chat.id,
          sender_id: userId,
          content,
        })

      if (error) throw error

      // 입력창에 포커스 유지
      inputRef.current?.focus()
    } catch (err) {
      console.error('Error sending message:', err)
      setInputValue(content) // 실패 시 복구
      alert('메시지 전송 중 오류가 발생했습니다.')
    } finally {
      setIsSending(false)
    }
  }

  // Enter 키로 전송
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 메시지 그룹화 (같은 발신자의 연속 메시지)
  const groupedMessages = messages.map((message, index) => {
    const prevMessage = messages[index - 1]
    const nextMessage = messages[index + 1]

    const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id
    const showTime = !nextMessage ||
      nextMessage.sender_id !== message.sender_id ||
      formatTime(nextMessage.created_at) !== formatTime(message.created_at)

    return { ...message, showAvatar, showTime }
  })

  return (
    <div className="flex flex-col w-full h-full bg-kakao-chat">
      {/* Header */}
      <header className="flex items-center justify-between px-2 py-3 bg-kakao-chat">
        <div className="flex items-center gap-2">
          <button onClick={handleBack} className="p-1 text-foreground/70 hover:text-foreground">
            <ChevronLeft className="w-7 h-7" />
          </button>
          <div className="flex items-center gap-2">
            <span className="font-medium text-lg text-foreground">
              {chat.name}
            </span>
            <span className="text-muted-foreground text-sm">{memberCount}</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-3 py-4 space-y-1 scrollbar-thin"
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-foreground/50">로딩 중...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-foreground/50">첫 메시지를 보내보세요!</p>
          </div>
        ) : (
          groupedMessages.map((message, index) => {
            const isMe = message.sender_id === userId
            const prevMessage = groupedMessages[index - 1]
            const showDatePill = !prevMessage || getDateKey(prevMessage.created_at) !== getDateKey(message.created_at)

            return (
              <div key={message.id}>
                {/* 날짜 pill */}
                {showDatePill && (
                  <div className="flex justify-center my-4">
                    <div className="flex items-center gap-1 px-3 py-1.5 bg-foreground/10 rounded-full text-xs text-foreground/70">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDatePill(message.created_at)}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                )}

                <div className={cn("flex gap-2", isMe ? "justify-end" : "justify-start")}>
                  {/* Avatar for others */}
                  {!isMe && message.showAvatar && (
                    <div className="w-10 h-10 bg-muted rounded-2xl flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-foreground">
                        {message.sender?.name?.charAt(0) || "?"}
                      </span>
                    </div>
                  )}
                  {!isMe && !message.showAvatar && <div className="w-10 shrink-0" />}

                  <div className={cn("flex flex-col max-w-[70%]", isMe ? "items-end" : "items-start")}>
                    {/* Sender name for others */}
                    {!isMe && message.showAvatar && (
                      <span className="text-sm text-foreground/70 mb-1">
                        {message.sender?.name || "알 수 없음"}
                      </span>
                    )}

                    <div className={cn("flex items-end gap-1", isMe ? "flex-row-reverse" : "flex-row")}>
                      {/* Message bubble */}
                      <div
                        className={cn(
                          "px-3 py-2 rounded-xl text-sm leading-relaxed wrap-break-word",
                          isMe
                            ? "bg-kakao-yellow text-foreground rounded-tr-sm"
                            : "bg-white text-foreground rounded-tl-sm",
                        )}
                      >
                        {message.content}
                      </div>

                      {/* Time */}
                      {message.showTime && (
                        <div className={cn("flex flex-col text-xs text-foreground/50", isMe ? "items-end" : "items-start")}>
                          <span>{formatTime(message.created_at)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex items-center gap-2 px-3 pt-2 pb-safe bg-white border-t border-border">
        <div className="flex-1 flex items-center bg-muted rounded-full px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            placeholder="메시지 보내기"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            disabled={isSending}
          />
        </div>
        <button
          onClick={handleSendMessage}
          disabled={isSending || !inputValue.trim()}
          className="p-2 text-kakao-yellow disabled:text-muted-foreground disabled:opacity-50 transition-colors"
        >
          <Send className="w-6 h-6" />
        </button>
      </div>
    </div>
  )
}

// 시간 포맷팅 헬퍼
function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

// 날짜 포맷팅 헬퍼 (날짜 pill용)
function formatDatePill(dateString: string): string {
  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
  const weekday = weekdays[date.getDay()]
  return `${year}년 ${month}월 ${day}일 ${weekday}`
}

// 날짜만 추출 (YYYY-MM-DD)
function getDateKey(dateString: string): string {
  return new Date(dateString).toISOString().split('T')[0]
}
