# SimuTalk - AI 캐릭터 채팅 시뮬레이터

오타쿠를 위한 로컬 AI 채팅 앱입니다. 가상 캐릭터와 메신저 스타일 UI로 대화하거나, 오토파일럿 모드로 AI가 자동으로 대화를 진행합니다.

## 기능

- 🎨 **4가지 테마**: 카카오톡, 라인, iMessage, 기본 스타일
- 💬 **몰입 모드**: 직접 메시지를 입력하여 캐릭터와 대화
- 🤖 **오토파일럿 모드**: AI가 자동으로 양쪽 캐릭터를 연기
- 👤 **캐릭터 관리**: 필드/자유 모드로 캐릭터 프로필 작성
- 🔑 **BYOK**: 본인의 API 키 사용 (Gemini / OpenAI)
- 💾 **로컬 저장**: 모든 데이터는 브라우저에 저장

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 개발 서버 실행

```bash
npm run dev
```

### 3. API 키 설정

앱 실행 후 설정에서 Gemini 또는 OpenAI API 키를 입력하세요.

## 기술 스택

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (상태 관리)
- LocalStorage (데이터 저장)

## 프로젝트 구조

```
src/
├── components/
│   ├── chat/           # 채팅 관련 컴포넌트
│   ├── contacts/       # 연락처 목록
│   ├── layout/         # 레이아웃 컴포넌트
│   ├── profile/        # 프로필 관리
│   └── settings/       # 설정 패널
├── services/
│   └── aiService.ts    # AI API 연동
├── stores/             # Zustand 스토어
├── types/              # TypeScript 타입
└── utils/              # 유틸리티 함수
```

## 향후 계획

- [ ] 번역 기능 구현
- [ ] 분기 기능 (Autopilot 모드)
- [ ] Tauri로 데스크톱 앱 래핑
- [ ] 더 많은 테마 추가

## 라이선스

MIT
