# Talk Diary

카카오톡 채팅 + 톡다이어리 서비스

하루하루 흘러가는 채팅 속에서 그날의 의미를 발견하고 기록할 수 있습니다.

## 주요 기능

- **실시간 채팅** - 카카오톡 스타일의 그룹 채팅
- **톡다이어리 채팅방** - AI가 생성한 하루 요약 리포트를 받아보는 전용 채팅방
- **리포트 카드** - 데일리 요약, 특별한 대화, AI 이미지 (3장 캐러셀)
- **톡다이어리 전체보기**
  - 홈탭: 감정 캘린더, 티키타카 랭킹, 키워드 컬렉션, AI 갤러리
  - 리포트탭: 주별 캘린더, 날짜별 리포트 상세
- **알림** - 새 톡다이어리 도착 시 Supabase Realtime으로 실시간 알림

## Quick Start

```bash
npm install
npm run dev
```

환경 변수 설정이 필요합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Tech Stack

- Next.js 16 / React 19 / TypeScript
- Tailwind CSS 4 / Radix UI
- Supabase (PostgreSQL, Realtime)
- Embla Carousel (리포트 카드 스와이프)

## 구현 상태

### 채팅 기능

- 이름.확장자 로그인/회원가입
- 채팅방 생성 및 참여
- 실시간 텍스트 메시지 송수신
- 읽지 않은 메시지 표시
- 날짜 pill 및 커스텀 스크롤바

### 톡다이어리

- 톡다이어리 채팅방 (채팅 목록 최상단 고정)
- 리포트 카드 UI (3장 캐러셀, 360px 고정 너비)
- Supabase Realtime으로 새 리포트 실시간 알림
- 톡다이어리 전체보기 (홈탭/리포트탭)
  - 월별 감정 캘린더
  - 이달의 티키타카 랭킹 (최대 3명)
  - 키워드 컬렉션 (랜덤 10개)
  - AI 갤러리 (3초 크로스페이드 슬라이드쇼)
  - 주별 캘린더 및 날짜별 리포트 상세

### 리포트 생성 흐름

```
AI 서버 (자동 생성) → Supabase DB 저장 → Realtime 이벤트 → 클라이언트 알림/표시
```

**AI 서버 레포지토리**: [4_talk_diary_be](https://github.com/One-Kakao-Onboarding/4_talk_diary_be)

## Documentation

상세 문서는 [docs/](./docs/README.md) 참고

- [기능 명세](./docs/FEATURES.md)
- [기술 스택](./docs/TECH_STACK.md)
- [데이터베이스](./docs/DATABASE.md)
- [API](./docs/API.md)
