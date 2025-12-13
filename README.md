# SimuTalk

AI 캐릭터와 대화할 수 있는 데스크톱 채팅 앱입니다.

카카오톡, 라인, iMessage 등 실제 메신저처럼 보이는 UI에서 내가 만든 캐릭터와 자연스럽게 대화할 수 있습니다.


## 주요 기능

### 💬 채팅
- 실제 메신저와 동일한 UI로 캐릭터와 대화
- 메시지 수정/리롤 가능 (브랜치 기능)
- 이미지 첨부 및 AI 이미지 인식 지원
- 이모티콘/스티커 등록 및 사용 (캐릭터도 사용 가능)
- 실시간/커스텀 시간 설정

### 🎨 테마
- 카카오톡
- 라인
- iMessage
- 기본 스타일

### 🤖 AI
- Gemini / OpenAI 모델 선택 가능
- 몰입 모드: 직접 메시지 입력
- 오토파일럿 모드: AI가 유저와 캐릭터 양쪽을 자동 연기
- 번역 기능 (실시간 번역 + 리롤)
- 장기 기억 (대화 요약 및 자동 관리)

### 👤 캐릭터 & 유저 프로필
- 필드 모드: 성격, 말투, 관계 등 항목별 입력
- 자유 모드: 원하는 형식으로 자유롭게 작성
- 프로필 이미지 설정
- 여러 유저 프로필 슬롯 관리

### 🖥️ 앱 기능
- 팝업 창으로 채팅방 분리 (항상 위 고정 가능)
- 채팅 데이터 내보내기/불러오기
- 자동 업데이트 지원

## 설치

[Releases](https://github.com/yjj2356/SimuTalk/releases)에서 최신 버전을 다운로드하세요.

- `SimuTalk Setup x.x.x.exe` - 설치형 (권장)
- `SimuTalk x.x.x.exe` - 포터블 버전

## 사용 방법

1. 앱 실행 후 **설정**에서 API 키 입력 (Gemini 또는 OpenAI)
2. **캐릭터 추가**에서 대화할 캐릭터 생성
3. 캐릭터 클릭하여 채팅 시작

## 개발 환경 설정

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run electron:dev

# 빌드
npm run electron:build:win
```

## 기술 스택

- Electron
- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand

## 라이선스

CC0-1.0 license
