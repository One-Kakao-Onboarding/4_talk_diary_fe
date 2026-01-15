# 기술 스택

## 개요

| 영역         | 기술                                   |
| ------------ | -------------------------------------- |
| 프론트엔드   | Next.js 16, React 19, TypeScript       |
| 스타일링     | Tailwind CSS 4, Radix UI, Lucide Icons |
| UI 컴포넌트  | Embla Carousel (리포트 카드 스와이프)  |
| 백엔드       | Supabase (BaaS)                        |
| 데이터베이스 | PostgreSQL (Supabase)                  |
| 실시간 통신  | Supabase Realtime                      |
| 인증         | 간단 인증 (이름.확장자 + localStorage) |

---

## 프론트엔드

### Next.js 16 + React 19

**선택 이유**

- App Router로 서버/클라이언트 컴포넌트 분리
- 파일 기반 라우팅으로 간편한 페이지 관리
- 내장 최적화 (이미지, 폰트, 번들링)
- TypeScript 기본 지원

**사용 버전**

```json
{
  "next": "16.0.10",
  "react": "^19.2.0",
  "typescript": "^5"
}
```

### TypeScript

**선택 이유**

- 타입 안정성으로 런타임 에러 방지
- IDE 자동완성 및 리팩토링 지원
- 코드 문서화 효과

---

## 스타일링

### Tailwind CSS 4

**선택 이유**

- Utility-first로 빠른 UI 개발
- 커스텀 디자인 시스템 구축 용이
- 번들 사이즈 최적화 (사용하는 클래스만 포함)

**커스텀 색상 (카카오 테마)**

```css
:root {
  --kakao-yellow: #fee500; /* 카카오 노랑 (메시지, 버튼) */
  --kakao-orange: #ff6b35; /* 읽지 않은 메시지 뱃지 */
  --kakao-chat: #d0dde8;   /* 채팅방 배경 */
}
```

**커스텀 스크롤바**

```css
.scrollbar-thin {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}
.scrollbar-thin::-webkit-scrollbar {
  width: 4px;
  background: transparent;
}
```

### Radix UI

**선택 이유**

- 접근성(a11y) 기본 지원
- 스타일 없는 Headless 컴포넌트
- Tailwind CSS와 조합 용이

### Lucide React

**선택 이유**

- 가벼운 SVG 아이콘 라이브러리
- Tree-shaking 지원
- 일관된 디자인 스타일

**주요 사용 아이콘**

- `MessageCircle`: 채팅 탭
- `Archive`: 기록 탭
- `Plus`: 채팅방 생성
- `LogOut`: 로그아웃
- `ChevronLeft`, `ChevronRight`: 네비게이션
- `Send`: 메시지 전송
- `Calendar`: 날짜 pill

### Embla Carousel

**선택 이유**

- 가볍고 유연한 캐러셀 라이브러리
- React hooks 지원
- 터치/스와이프 제스처 지원

**사용처**

- 톡다이어리 리포트 카드 (3장 가로 스와이프)

---

## 백엔드 (Supabase)

### Supabase 선택 이유

**장점**

- 백엔드 코드 작성 없이 풀스택 구현
- PostgreSQL 기반의 강력한 쿼리
- 내장 실시간 기능 (WebSocket)
- Row Level Security로 데이터 보호
- 관대한 무료 티어

### 사용하는 Supabase 기능

**1. Database (PostgreSQL)**

- 테이블 CRUD
- Foreign Key 관계
- JSONB 타입 (톡다이어리 콘텐츠 저장)
- Row Level Security (RLS)

**2. Realtime**

- Postgres Changes 구독
- 채널 기반 메시지 수신
- 톡다이어리 수신 (예정)

---

## 세션 관리

### localStorage 기반

Supabase Auth를 사용하지 않고 간단한 세션 관리:

```typescript
// lib/supabase.ts
export function saveUserId(userId: string) { ... }
export function saveUserName(name: string) { ... }
export function saveUserTag(tag: string) { ... }
export function getUserId(): string | null { ... }
export function getUserName(): string | null { ... }
export function getUserTag(): string | null { ... }
export function clearUserSession() { ... }
```

**저장 항목**
| 키 | 설명 |
|---|---|
| `userId` | 사용자 UUID |
| `userName` | 이름 (예: `Liam`) |
| `userTag` | 확장자 (예: `gg`) |

---

## 개발 도구

### ESLint 9

- Next.js 권장 규칙 적용
- TypeScript 규칙

### 패키지 매니저

- npm (기본)
- Node.js 18+ 권장

---

## 배포

### GitHub Pages

- 정적 내보내기 (`output: 'export'`)
- basePath 설정: `/4_talk_diary_fe`
- assetPrefix 설정 (이미지 경로용)

**next.config.ts**

```typescript
const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/4_talk_diary_fe" : "",
  assetPrefix: isProd ? "/4_talk_diary_fe" : "",
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? "/4_talk_diary_fe" : "",
  },
};
```

**환경 변수**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
```

---

## 톡다이어리 기술 스택

### 현재 구현 (프론트엔드)

- 톡다이어리 전용 페이지 (`TalkDiaryPage`)
- 리포트 카드 캐러셀 (`ReportCard` + Embla Carousel)
- 알림 컴포넌트 (`TalkDiaryNotification`)
- Mock 데이터 (`lib/mock-data.ts`)

### 예정 (백엔드 연동)

- Supabase Realtime으로 `daily_reports` 테이블 INSERT 감지
- AI 서버에서 리포트 생성 후 Supabase에 저장
