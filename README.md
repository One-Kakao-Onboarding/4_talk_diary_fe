# Talk Diary

카카오톡 채팅 + 톡다이어리 서비스

하루하루 흘러가는 채팅 속에서 그날의 의미를 발견하고 기록할 수 있습니다.

## 주요 기능

- **실시간 채팅** - 카카오톡 스타일의 그룹 채팅
- **톡다이어리** - AI가 생성한 하루 요약 리포트를 받아보는 전용 채팅방
- **리포트 카드** - 데일리 요약, 특별한 대화, 감정 키워드, AI 이미지
- **알림** - 새 톡다이어리 도착 시 푸시 알림 스타일 표시

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

### 완료

- 이름.확장자 로그인/회원가입
- 채팅방 생성 및 참여
- 실시간 텍스트 메시지 송수신
- 읽지 않은 메시지 표시
- 톡다이어리 채팅방 (채팅 목록에 고정)
- 리포트 카드 UI (3장 캐러셀: 데일리 요약, 특별한 대화, AI 이미지)
- 톡다이어리 알림 컴포넌트
- 날짜 pill 및 커스텀 스크롤바

### 예정

- Supabase Realtime 톡다이어리 수신 연동
- 기록 탭 (Archive) 리포트 목록
- AI 서버 연동

## Documentation

상세 문서는 [docs/](./docs/README.md) 참고

- [기능 명세](./docs/FEATURES.md)
- [기술 스택](./docs/TECH_STACK.md)
- [데이터베이스](./docs/DATABASE.md)
- [API](./docs/API.md)
