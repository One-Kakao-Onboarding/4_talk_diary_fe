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
