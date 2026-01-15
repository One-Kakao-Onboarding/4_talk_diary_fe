# Supabase API 사용

## 개요

Supabase JavaScript 클라이언트를 사용하여 데이터베이스 CRUD 및 실시간 구독을 구현합니다.

---

## 클라이언트 설정

### lib/supabase.ts

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (null as any);
```

### 환경 변수 (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

---

## 1. 사용자 관리

### 입력값 파싱

`이름.확장자` 형식을 파싱하여 name과 tag로 분리

```typescript
export function parseUserInput(
  input: string
): { name: string; tag: string } | null {
  const trimmed = input.trim();
  const parts = trimmed.split(".");

  if (parts.length !== 2) return null;

  const [rawName, rawTag] = parts;
  if (!rawName || !rawTag) return null;

  const validPattern = /^[a-zA-Z0-9]{1,10}$/;
  if (!validPattern.test(rawName) || !validPattern.test(rawTag)) return null;

  const name = rawName.charAt(0).toUpperCase() + rawName.slice(1).toLowerCase();
  const tag = rawTag.toLowerCase();

  return { name, tag };
}
```

### 로그인/회원가입

```typescript
async function handleSubmit() {
  const parsed = parseUserInput(input);
  if (!parsed) return;

  const { name, tag } = parsed;

  // 기존 사용자 검색
  const { data: existingUser, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("name", name)
    .eq("tag", tag)
    .single();

  if (existingUser) {
    // 기존 사용자로 로그인
    saveUserId(existingUser.id);
    saveUserName(existingUser.name);
    saveUserTag(existingUser.tag);
  } else if (error?.code === "PGRST116") {
    // 새 사용자 생성
    const { data: newUser } = await supabase
      .from("profiles")
      .insert({ name, tag })
      .select()
      .single();

    if (newUser) {
      saveUserId(newUser.id);
      saveUserName(newUser.name);
      saveUserTag(newUser.tag);
    }
  }
}
```

### 세션 관리

```typescript
// 저장
export function saveUserId(userId: string) {
  localStorage.setItem("userId", userId);
}
export function saveUserName(name: string) {
  localStorage.setItem("userName", name);
}
export function saveUserTag(tag: string) {
  localStorage.setItem("userTag", tag);
}

// 조회
export function getUserId(): string | null {
  return localStorage.getItem("userId");
}

// 삭제 (로그아웃)
export function clearUserSession() {
  localStorage.removeItem("userId");
  localStorage.removeItem("userName");
  localStorage.removeItem("userTag");
}
```

---

## 2. 채팅방 조회

### 내 채팅방 목록

```typescript
const fetchMyChats = async () => {
  const { data: memberships } = await supabase
    .from("chat_members")
    .select(
      `
      chat_id,
      last_read_at,
      chats:chat_id (id, name, created_at)
    `
    )
    .eq("user_id", userId);

  // 각 채팅방별 상세 정보 조회
  const chatsWithDetails = await Promise.all(
    memberships.map(async (membership) => {
      // 멤버 수, 마지막 메시지, 읽지 않은 수 등
    })
  );
};
```

### 공개 채팅방 목록

```typescript
const fetchPublicChats = async () => {
  const { data: chats } = await supabase
    .from("chats")
    .select("*")
    .order("created_at", { ascending: false });
};
```

### 채팅방 생성

```typescript
const handleCreateChat = async () => {
  // 1. 채팅방 생성
  const { data: newChat } = await supabase
    .from("chats")
    .insert({ name: chatName })
    .select()
    .single();

  // 2. 생성자를 멤버로 추가
  await supabase
    .from("chat_members")
    .insert({ chat_id: newChat.id, user_id: userId });
};
```

---

## 3. 메시지

### 메시지 목록 조회

```typescript
const fetchMessages = async () => {
  const { data } = await supabase
    .from("messages")
    .select(
      `
      *,
      sender:profiles!sender_id (id, name)
    `
    )
    .eq("chat_id", chat.id)
    .order("created_at", { ascending: true });
};
```

### 메시지 전송

```typescript
const handleSendMessage = async () => {
  await supabase.from("messages").insert({
    chat_id: chat.id,
    sender_id: userId,
    content,
  });
};
```

---

## 4. 실시간 구독

### 채팅방 메시지 구독

```typescript
useEffect(() => {
  const channel = supabase
    .channel(`chat:${chat.id}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chat.id}`,
      },
      async (payload) => {
        // 새 메시지 처리
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [chat.id]);
```

### 채팅 목록 실시간 업데이트

```typescript
useEffect(() => {
  const channel = supabase
    .channel("chat-list-updates")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages" },
      () => fetchMyChats()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## 5. 읽음 처리

### 마지막 읽은 시간 업데이트

```typescript
const updateLastRead = async () => {
  await supabase
    .from("chat_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("chat_id", chat.id)
    .eq("user_id", userId);
};
```

### 읽지 않은 메시지 수 계산

```typescript
const { count: unreadCount } = await supabase
  .from("messages")
  .select("*", { count: "exact", head: true })
  .eq("chat_id", chat.id)
  .gt("created_at", membership.last_read_at || "1970-01-01");
```

---

## 6. 톡다이어리 (daily_reports)

### 톡다이어리 목록 조회

```typescript
const fetchReports = async () => {
  const { data } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("user_id", userId)
    .order("report_date", { ascending: false });
};
```

### 톡다이어리 상세 조회

```typescript
const fetchReportDetail = async (reportId: string) => {
  const { data } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("id", reportId)
    .single();
};
```

### 톡다이어리 Realtime 구독 (예정)

```typescript
useEffect(() => {
  const channel = supabase
    .channel("talk-diary-updates")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "daily_reports",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        // 새 톡다이어리 도착 시 알림 표시
        setShowNotification(true);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [userId]);
```

---

## TypeScript 타입 정의

### 현재 구현된 타입

```typescript
// types/database.ts

export interface Profile {
  id: string;
  name: string;
  tag: string;
  created_at: string;
}

export interface Chat {
  id: string;
  name: string;
  created_at: string;
}

export interface ChatMember {
  chat_id: string;
  user_id: string;
  joined_at: string;
  last_read_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export interface MessageWithSender extends Message {
  sender: Profile | null;
}
```

### 톡다이어리 타입

```typescript
export interface DailyReportContent {
  dailySummary: {
    title: string;
    summaryText: string;
    keywords: string[];
    emotionWeather: string;
    bestTikitaka: {
      name: string;
      chatId?: string;
    };
  };
  specialConversations: {
    keyword: string;
    title: string;
    preview: string;
    senderName: string;
    chatId: string;
    messageId?: string;
  }[];
  aiImageSummary: {
    imageUrl: string | null;
  };
}

export interface DailyReport {
  id: string;
  user_id: string;
  report_date: string;
  content: DailyReportContent;
  created_at: string;
}
```
