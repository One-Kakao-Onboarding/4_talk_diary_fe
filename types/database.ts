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

// 감정 아이콘 타입 (public/mind 폴더의 이미지 파일명과 매핑)
export type EmotionIcon = "기쁨" | "슬픔" | "신남" | "분노" | "놀라움" | "그저그럼" | "설렘"

// ===== 새로운 리포트 구조 (reports 테이블) =====

// 키워드 타입
export interface DailyKeyword {
  text: string
  bg_hex: string
  text_hex: string
}

// 감정 날씨 타입
export interface EmotionWeather {
  dominant: EmotionIcon
  score: number
  description: string
  color_hex: string
}

// 베스트 케미스트리 타입
export interface BestChemistry {
  partner_profile_id: string
  partner_name: string
  interaction_score: number
  profile_image_url: string | null
}

// 특별한 순간 타입
export interface SpecialMoment {
  moment_id: string
  analysis: {
    tag: string
    tag_bg_hex: string
    tag_text_hex: string
    title: string
    summary_content: string
    sentiment: "positive" | "negative" | "neutral"
  }
  source_context: {
    chat_id: string
    original_message_id: string
    sender_id: string
    sender_name: string
    timestamp: string
  }
}

// 리포트 content JSON 구조
export interface ReportContent {
  report_meta: {
    report_id: string
    target_date: string
    created_at: string
    summary_title: string
    summary_text: string
  }
  dashboard: {
    daily_keywords: DailyKeyword[]
    emotion_weather: EmotionWeather
    best_chemistry: BestChemistry
  }
  special_moments: SpecialMoment[]
  summary_image_url: string | null
}

// reports 테이블 Row 타입
export interface Report {
  id: string
  created_at: string
  profile_id: string
  content: ReportContent
}

// ===== 레거시 타입 (하위 호환용) =====

// 데일리 리포트 content 구조 (레거시)
export interface DailyReportContent {
  dailySummary: {
    title: string
    summaryText: string
    keywords: string[]
    emotionWeather: string
    emotionIcon?: EmotionIcon
    bestTikitaka: {
      name: string
      chatId?: string
    }
  }
  specialConversations: {
    keyword: string
    title: string
    preview: string
    senderName: string
    chatId: string
    messageId?: string
  }[]
  aiImageSummary: {
    imageUrl: string | null
  }
}

export interface DailyReport {
  id: string
  user_id: string
  report_date: string
  content: DailyReportContent
  created_at: string
}

// ReportContent 구조 검증
export function isValidReportContent(content: unknown): content is ReportContent {
  if (!content || typeof content !== 'object') return false
  const c = content as Record<string, unknown>
  return !!(
    c.report_meta &&
    typeof c.report_meta === 'object' &&
    (c.report_meta as Record<string, unknown>).target_date
  )
}

// 새 구조 → 레거시 구조 변환 헬퍼
export function convertReportToLegacy(report: Report): DailyReport | null {
  const { content } = report

  // content 구조 검증
  if (!isValidReportContent(content)) {
    console.warn('Invalid report content structure:', report.id, content)
    return null
  }

  return {
    id: report.id,
    user_id: report.profile_id,
    report_date: content.report_meta.target_date,
    content: {
      dailySummary: {
        title: content.report_meta.summary_title || '',
        summaryText: content.report_meta.summary_text || '',
        keywords: content.dashboard?.daily_keywords?.map(k => k.text) || [],
        emotionWeather: content.dashboard?.emotion_weather?.description || '',
        emotionIcon: content.dashboard?.emotion_weather?.dominant,
        bestTikitaka: {
          name: content.dashboard?.best_chemistry?.partner_name || '',
          chatId: undefined,
        },
      },
      specialConversations: (content.special_moments || []).map(m => ({
        keyword: m.analysis?.tag || '',
        title: m.analysis?.title || '',
        preview: m.analysis?.summary_content || '',
        senderName: m.source_context?.sender_name || '',
        chatId: m.source_context?.chat_id || '',
        messageId: m.source_context?.original_message_id,
      })),
      aiImageSummary: {
        imageUrl: content.summary_image_url || null,
      },
    },
    created_at: report.created_at,
  }
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
      reports: {
        Row: Report
        Insert: Omit<Report, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Report>
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
