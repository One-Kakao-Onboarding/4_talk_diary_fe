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

**캐러셀 설정**

```typescript
useEmblaCarousel({
  align: "center",        // 중앙 정렬 (이전/다음 카드 peek)
  containScroll: "trimSnaps",  // 첫/마지막 카드는 가장자리 정렬
  slidesToScroll: 1,
})
```

**카드 레이아웃**

- 카드 너비: 360px 고정
- 카드 간격: 12px (gap-3)
- 좌측 여백: 12px (프로필과 정렬)
- 우측 스페이서: 24px (마지막 카드 여백)

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

**톡다이어리 채팅방**
- `TalkDiaryPage`: 리포트 목록 표시 (날짜순 정렬)
- `ReportCard`: 3장 캐러셀 (Embla Carousel)
- `TalkDiaryNotification`: 상단 푸시 알림 스타일

**톡다이어리 전체보기**
- `TalkDiary` (components/talk-diary/index.tsx): 홈/리포트 탭 컨테이너
- `HomeTab`: 월별 캘린더, 랭킹, 키워드, AI 갤러리
- `ReportTab`: 주별 캘린더, 날짜별 리포트 상세

**UI 스타일**
- 카드 border-radius: 12px (rounded-xl)
- 내부 박스/버튼 border-radius: 8px (rounded-lg)
- 박스 그림자: `shadow-[0_0_12px_rgba(0,0,0,0.1)]`
- 내부 박스 배경: `#FAFAFA`

**애니메이션**
- AI 갤러리: 3초 간격 자동 슬라이드, 1초 크로스페이드

### 백엔드 연동 (완료)

- Supabase Realtime으로 `reports` 테이블 INSERT 감지
- 새 리포트 도착 시 알림 표시
- `fetchReports()`: 사용자별 리포트 조회

### 리포트 생성 흐름

```
AI 서버 (자동 생성) → Supabase DB 저장 → Realtime 이벤트 → 클라이언트 알림/표시
```

- 클라이언트는 AI 서버를 직접 호출하지 않음
- 서버에서 리포트 생성 후 DB에 저장하면 Realtime으로 감지
- 클라이언트는 DB에서 리포트를 조회하여 UI 구성
