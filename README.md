# Talk Diary

카카오톡 채팅 + 데일리 리포트 서비스

하루하루 흘러가는 채팅 속에서 그날의 의미를 발견하고 기록할 수 있습니다.

## 주요 기능

- 🗨️ **실시간 채팅** - 카카오톡의 기본적인 채팅
- 📊 **데일리 리포트** - 당일 채팅 기반 하루 요약 (예정)

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

## Documentation

상세 문서는 [docs/](./docs/README.md) 참고

- [기능 명세](./docs/FEATURES.md)
- [기술 스택](./docs/TECH_STACK.md)
- [데이터베이스](./docs/DATABASE.md)
- [API](./docs/API.md)
