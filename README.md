# TalentEx — 재능 교환 플랫폼

재능과 경험을 교환하거나, 크레딧으로 도움을 주고받는 커뮤니티 서비스

## 기술 스택

- **Frontend**: Next.js 15 (App Router), TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **배포**: Vercel

## 주요 기능

| 기능 | 설명 |
|------|------|
| 회원가입/로그인 | Supabase Auth, 가입 시 100 크레딧 자동 지급 |
| 재능 등록 | 제공/요청 + 크레딧/교환/둘다 방식 선택 |
| 재능 교환 | 서로 필요한 재능 일치 시 크레딧 없이 무료 교환 |
| 크레딧 거래 | 도움 1회 = 50 크레딧 소모 / 제공 시 50 크레딧 획득 |
| 교환 관리 | 받은 요청 수락/거절, 완료 처리 |
| 후기/평점 | 교환 완료 후 서로 평가 |
| 프로필 | 회원 정보 확인, 크레딧 내역, 통계 |
| 추천 기능 | 교환 가능한 재능 추천 (대시보드) |

## 크레딧 시스템

```
초기 크레딧:   100점
도움 요청 시:  -50점
도움 제공 시:  +50점
재능 교환:     크레딧 소모 없음 (무료)
```

## 시작하기

### 1. Supabase 설정

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/migrations/001_initial_schema.sql` 실행
3. 프로젝트 URL과 anon key 복사

### 2. 환경변수 설정

```bash
cp .env.local.example .env.local
```

`.env.local` 파일에 Supabase 값 입력:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. 개발 서버 실행

```bash
npm install
npm run dev
```

### 4. Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
vercel

# 환경변수를 Vercel 대시보드에서 설정
# Settings > Environment Variables
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## 프로젝트 구조

```
talentex/
├── app/
│   ├── auth/
│   │   ├── login/page.tsx       # 로그인
│   │   └── register/page.tsx    # 회원가입
│   ├── dashboard/page.tsx       # 대시보드 (요약, 추천)
│   ├── listings/
│   │   ├── new/page.tsx         # 재능 등록
│   │   └── [id]/page.tsx        # 재능 상세 + 교환 신청
│   ├── exchange/page.tsx        # 교환 요청 관리
│   ├── profile/page.tsx         # 내 프로필
│   ├── layout.tsx
│   ├── page.tsx                 # 홈 (탐색)
│   └── globals.css
├── components/
│   └── Navbar.tsx
├── lib/
│   ├── actions/
│   │   ├── auth.ts              # 인증 server actions
│   │   └── listings.ts          # 리스팅/교환 server actions
│   └── supabase/
│       ├── client.ts            # 브라우저 클라이언트
│       └── server.ts            # 서버 클라이언트
├── types/index.ts               # TypeScript 타입
├── middleware.ts                # 인증 미들웨어
└── supabase/migrations/
    └── 001_initial_schema.sql   # DB 스키마
```

## Supabase 보안 (RLS)

모든 테이블에 Row Level Security가 적용되어 있습니다:
- 프로필: 누구나 조회 가능, 본인만 수정
- 리스팅: 누구나 조회, 본인만 등록/수정/삭제
- 교환 요청: 당사자만 조회/수정
- 크레딧 내역: 본인만 조회
- 알림: 본인만 조회/수정
