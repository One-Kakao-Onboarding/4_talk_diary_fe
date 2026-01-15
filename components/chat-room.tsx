"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, Send } from "lucide-react"
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
  const inputRef = useRef<HTMLInputElement>(null)

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
            <span className="font-medium text-foreground text-lg">{chat.name}</span>
            <span className="text-muted-foreground text-sm">{memberCount}</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-foreground/50">로딩 중...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-foreground/50">첫 메시지를 보내보세요!</p>
          </div>
        ) : (
          groupedMessages.map((message) => {
            const isMe = message.sender_id === userId

            return (
              <div key={message.id} className={cn("flex gap-2", isMe ? "justify-end" : "justify-start")}>
                {/* Avatar for others */}
                {!isMe && message.showAvatar && (
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center shrink-0">
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
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex items-center gap-2 px-3 py-2 bg-white border-t border-border">
        <div className="flex-1 flex items-center bg-muted rounded-full px-4 py-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
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
