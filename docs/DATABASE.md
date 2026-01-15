# 데이터베이스 스키마

## ERD (Entity Relationship Diagram)

```
┌─────────────────────┐
│      profiles       │
├─────────────────────┤
│ id (PK)             │
│ name                │
│ tag                 │
│ created_at          │
│ UNIQUE(name, tag)   │
└──────────┬──────────┘
           │
           │ 1:N
           ▼
┌─────────────────┐       ┌─────────────────┐
│     chats       │       │  chat_members   │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │──1:N──│ chat_id (PK,FK) │
│ name            │       │ user_id (PK,FK) │──N:1──┐
│ created_at      │       │ joined_at       │       │
└────────┬────────┘       │ last_read_at    │       │
         │                └─────────────────┘       │
         │ 1:N                                      │
         ▼                                          │
┌─────────────────┐       ┌─────────────────┐       │
│    messages     │       │  daily_reports  │       │
├─────────────────┤       ├─────────────────┤       │
│ id (PK)         │       │ id (PK)         │       │
│ chat_id (FK)    │       │ user_id (FK)    │───────┘
│ sender_id (FK)  │───────│ report_date     │
│ content         │       │ content (JSONB) │
│ created_at      │       │ created_at      │
└─────────────────┘       └─────────────────┘
```

---

## 테이블 정의

### 1. profiles (사용자)

독립적인 사용자 테이블 (Supabase Auth 미사용)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, tag)
);

CREATE INDEX idx_profiles_name_tag ON profiles(name, tag);
```

| 컬럼       | 타입        | 설명                                    |
| ---------- | ----------- | --------------------------------------- |
| id         | UUID        | 사용자 ID (PK, 자동 생성)               |
| name       | TEXT        | 사용자 이름 (첫글자 대문자, 예: `Liam`) |
| tag        | TEXT        | 확장자 (소문자, 예: `gg`)               |
| created_at | TIMESTAMPTZ | 생성 시간                               |

**저장 규칙**

- `liam.gg` 입력 → name: `Liam`, tag: `gg`
- name + tag 조합이 UNIQUE
- 채팅방에서는 name만 표시

### 2. chats (채팅방)

일반 공개 채팅방과 시스템 채팅방(톡다이어리)을 포함

```sql
CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  chat_type TEXT DEFAULT 'normal',
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chats_created_at ON chats(created_at DESC);
CREATE INDEX idx_chats_owner_type ON chats(owner_id, chat_type);
```

| 컬럼       | 타입        | 설명                                      |
| ---------- | ----------- | ----------------------------------------- |
| id         | UUID        | 채팅방 ID (PK)                            |
| name       | TEXT        | 채팅방 이름                               |
| chat_type  | TEXT        | 채팅방 타입 (`normal` / `talk_diary`)     |
| owner_id   | UUID        | 소유자 ID (톡다이어리 채팅방의 경우, FK)  |
| created_at | TIMESTAMPTZ | 생성 시간                                 |

**chat_type 값**

| 값          | 설명                                |
| ----------- | ----------------------------------- |
| `normal`    | 일반 공개 채팅방 (기본값)           |
| `talk_diary`| 톡다이어리 시스템 채팅방 (사용자별) |

### 3. chat_members (채팅방 멤버)

채팅방과 사용자의 N:M 관계 테이블

```sql
CREATE TABLE chat_members (
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

CREATE INDEX idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX idx_chat_members_chat_id ON chat_members(chat_id);
```

| 컬럼         | 타입        | 설명               |
| ------------ | ----------- | ------------------ |
| chat_id      | UUID        | 채팅방 ID (PK, FK) |
| user_id      | UUID        | 사용자 ID (PK, FK) |
| joined_at    | TIMESTAMPTZ | 참여 시간          |
| last_read_at | TIMESTAMPTZ | 마지막 읽은 시간   |

### 4. messages (메시지)

텍스트 메시지 및 리포트 메시지 저장

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  report_id UUID REFERENCES daily_reports(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_chat_created ON messages(chat_id, created_at DESC);
```

| 컬럼         | 타입        | 설명                              |
| ------------ | ----------- | --------------------------------- |
| id           | UUID        | 메시지 ID (PK)                    |
| chat_id      | UUID        | 채팅방 ID (FK)                    |
| sender_id    | UUID        | 발신자 ID (FK, nullable)          |
| content      | TEXT        | 메시지 내용                       |
| message_type | TEXT        | 메시지 타입 (`text` / `report`)   |
| report_id    | UUID        | 연결된 리포트 ID (FK, nullable)   |
| created_at   | TIMESTAMPTZ | 전송 시간                         |

**message_type 값**

| 값       | 설명                              |
| -------- | --------------------------------- |
| `text`   | 일반 텍스트 메시지 (기본값)       |
| `report` | 리포트 카드 메시지 (톡다이어리용) |

### 5. daily_reports (데일리 리포트)

사용자별 일일 리포트 저장

```sql
CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  report_date DATE NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, report_date)
);

CREATE INDEX idx_daily_reports_user_id ON daily_reports(user_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date DESC);
```

| 컬럼        | 타입        | 설명                          |
| ----------- | ----------- | ----------------------------- |
| id          | UUID        | 리포트 ID (PK)                |
| user_id     | UUID        | 사용자 ID (FK)                |
| report_date | DATE        | 리포트 날짜                   |
| content     | JSONB       | 리포트 내용 (구조화된 데이터) |
| created_at  | TIMESTAMPTZ | 생성 시간                     |

**content JSONB 구조** _(AI 서버 구현에 따라 변경될 수 있음)_

```typescript
interface DailyReportContent {
  summary: string;              // 그날의 요약
  memorableChats: {
    chatId: string;             // 채팅방 ID
    chatName: string;           // 채팅방 이름
    messageId: string;          // 하이라이트 메시지 ID
    preview: string;            // 메시지 미리보기
  }[];
  emotionKeywords: string[];    // 감정 키워드 배열
  imageUrl: string | null;      // AI 생성 이미지 URL
}
```

**예시**

```json
{
  "summary": "오늘은 프로젝트 회의와 친구들과의 저녁 약속이 있었던 바쁜 하루였어요.",
  "memorableChats": [
    {
      "chatId": "uuid-1",
      "chatName": "개발팀",
      "messageId": "msg-uuid-1",
      "preview": "배포 성공했습니다!"
    }
  ],
  "emotionKeywords": ["성취감", "피곤함", "기대"],
  "imageUrl": "https://example.com/generated-image.png"
}
```

---

## Row Level Security (RLS) 정책

간단한 인증 방식이므로 RLS를 최소화합니다.

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on chats" ON chats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on chat_members" ON chat_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on daily_reports" ON daily_reports FOR ALL USING (true) WITH CHECK (true);
```

---

## Realtime 설정

Supabase Dashboard에서 Realtime 활성화 필요:

1. Database → Replication
2. `messages` 테이블 → Realtime 활성화
3. `chats` 테이블 → Realtime 활성화 (선택)
4. `daily_reports` 테이블 → Realtime 활성화 (Talk Diary용)

---

## 전체 스키마 SQL

```sql
-- ===================================
-- 1. 테이블 생성
-- ===================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tag TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, tag)
);

CREATE TABLE chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  chat_type TEXT DEFAULT 'normal',
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE chat_members (
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  report_date DATE NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, report_date)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  report_id UUID REFERENCES daily_reports(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 2. 인덱스 생성
-- ===================================

CREATE INDEX idx_profiles_name_tag ON profiles(name, tag);
CREATE INDEX idx_chats_created_at ON chats(created_at DESC);
CREATE INDEX idx_chats_owner_type ON chats(owner_id, chat_type);
CREATE INDEX idx_chat_members_user_id ON chat_members(user_id);
CREATE INDEX idx_chat_members_chat_id ON chat_members(chat_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_chat_created ON messages(chat_id, created_at DESC);
CREATE INDEX idx_daily_reports_user_id ON daily_reports(user_id);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date DESC);

-- ===================================
-- 3. RLS 정책
-- ===================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on chats" ON chats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on chat_members" ON chat_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on daily_reports" ON daily_reports FOR ALL USING (true) WITH CHECK (true);
```

---

## 마이그레이션 SQL (기존 DB 업데이트용)

기존 데이터베이스에 Talk Diary 기능을 추가할 때 실행:

```sql
-- chats 테이블 확장
ALTER TABLE chats ADD COLUMN IF NOT EXISTS chat_type TEXT DEFAULT 'normal';
ALTER TABLE chats ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES profiles(id);
CREATE INDEX IF NOT EXISTS idx_chats_owner_type ON chats(owner_id, chat_type);

-- messages 테이블 확장
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS report_id UUID REFERENCES daily_reports(id);
```
