export interface Profile {
  id: string
  name: string      // 첫글자 대문자 (예: "Liam")
  tag: string       // 전체 소문자 (예: "gg")
  created_at: string
}

export interface Chat {
  id: string
  name: string
  created_at: string
}

export interface ChatMember {
  chat_id: string
  user_id: string
  joined_at: string
  last_read_at: string
}

export interface Message {
  id: string
  chat_id: string
  sender_id: string
  content: string
  created_at: string
}

// 데일리 리포트 content 구조
export interface DailyReportContent {
  // 1. 데일리 요약
  dailySummary: {
    title: string                    // 타이틀
    summaryText: string              // 하루를 감성적으로 요약하는 3문장 이내의 문구
    keywords: string[]               // 오늘의 키워드 (3가지)
    emotionWeather: string           // 오늘의 감정 날씨
    bestTikitaka: {                  // 최고의 티키타카 (1인)
      name: string
      chatId?: string
    }
  }
  // 2. 오늘의 특별한 대화들
  specialConversations: {
    keyword: string                  // 키워드 태그
    title: string                    // 대화 제목
    preview: string                  // 대화 미리보기
    senderName: string               // 발신자 이름
    chatId: string
    messageId?: string
  }[]
  // 3. AI 이미지 요약
  aiImageSummary: {
    imageUrl: string | null          // AI 이미지 URL
  }
}

export interface DailyReport {
  id: string
  user_id: string
  report_date: string
  content: DailyReportContent
  created_at: string
}

// Supabase Database 타입
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Profile>
      }
      chats: {
        Row: Chat
        Insert: Omit<Chat, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Chat>
      }
      chat_members: {
        Row: ChatMember
        Insert: Omit<ChatMember, 'joined_at' | 'last_read_at'> & { joined_at?: string; last_read_at?: string }
        Update: Partial<ChatMember>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Message>
      }
      daily_reports: {
        Row: DailyReport
        Insert: Omit<DailyReport, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<DailyReport>
      }
    }
  }
}

// 확장 타입 (조인된 데이터용)
export interface MessageWithSender extends Message {
  sender: Profile | null
}

export interface ChatWithLastMessage extends Chat {
  lastMessage?: MessageWithSender
  unreadCount: number
  memberCount: number
}

export interface ChatMemberWithChat extends ChatMember {
  chat: Chat
}
