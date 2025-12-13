// 테마 타입
export type ThemeType = 'kakao' | 'line' | 'imessage' | 'basic';

// iMessage 말풍선 색상 (blue: 애플끼리, green: 아이폰-안드로이드)
export type IMessageColor = 'blue' | 'green';

// 폰 프레임 타입
export type PhoneFrameType = 'iphone' | 'android';

// 배경 타입
export type BackgroundType = 'solid' | 'gradient' | 'pattern' | 'image';

// 그라데이션 방향
export type GradientDirection = 'to-r' | 'to-l' | 'to-t' | 'to-b' | 'to-tr' | 'to-tl' | 'to-br' | 'to-bl';

// 패턴 타입
export type PatternType = 'dots' | 'grid' | 'diagonal' | 'zigzag' | 'circles';

// 스티커/위젯 타입
export interface BackgroundWidget {
  id: string;
  type: 'sticker' | 'emoji' | 'text' | 'image';
  content: string; // emoji/text의 경우 내용, image의 경우 base64 URL
  x: number; // percent
  y: number; // percent
  size: number; // scale factor
  rotation: number; // degrees
}

// 배경 설정
export interface BackgroundSettings {
  type: BackgroundType;
  solidColor?: string;
  gradientColors?: [string, string];
  gradientDirection?: GradientDirection;
  patternType?: PatternType;
  patternColor?: string;
  patternBgColor?: string;
  imageUrl?: string;
  imageOpacity?: number;
  widgets?: BackgroundWidget[];
}

// 테마 커스터마이징 설정
export interface ThemeCustomization {
  // 포인트 컬러 (버튼, 토글 등 강조색)
  accentColor: string;
  
  // 사이드바 설정
  sidebarBgColor: string;
  sidebarTextColor: string;
  sidebarBorderColor: string;
  
  // 폰 옆 패널/설정창 색상
  panelBgColor: string;
  panelTextColor: string;
  panelBorderColor: string;
  
  // 메인 배경 (폰 뒤 회색 영역)
  mainBackground: BackgroundSettings;
  
  // 폰 프레임 색상
  phoneFrameColor: string;
  phoneFrameRingColor: string;
}

// 채팅 모드
export type ChatMode = 'immersion' | 'autopilot';

// 프로필 입력 모드
export type ProfileInputMode = 'field' | 'free';

// 출력 언어 설정
export type OutputLanguage = 'korean' | 'english' | 'japanese' | 'chinese';

// AI 제공자
export type AIProvider = 'gemini' | 'openai';

// 시간 모드 설정
export type TimeMode = 'realtime' | 'custom';

// 시간 설정
export interface TimeSettings {
  mode: TimeMode;
  customBaseTime?: number; // 설정된 기준 시간 (timestamp)
  startedAt?: number; // 커스텀 시간 모드 시작 시점 (timestamp)
}

// 메시지 타입
export interface Message {
  id: string;
  chatId: string;
  senderId: string; // 'user' | character.id
  content: string;
  timestamp: number;
  translatedContent?: string; // 번역된 내용
  branches?: MessageBranch[]; // 분기 메시지들
  currentBranchIndex: number; // 현재 선택된 분기 인덱스 (0 = 원본)
  // 분기점 이후(다음 메시지들) 저장용 - 특정 분기(특히 메시지 편집)에서 사용
  baseMessagesAfter?: Message[];
  imageData?: string; // Base64 인코딩된 이미지 데이터
  imageMimeType?: string; // 이미지 MIME 타입 (image/jpeg, image/png, etc.)
  isSticker?: boolean; // 스티커 메시지 여부 (이모티콘)
}

// 캐릭터 프로필 (필드 모드)
export interface CharacterFieldProfile {
  name: string;
  profileImage?: string;
  personality: string;
  speechStyle: string;
  relationship: string;
  worldSetting: string;
  additionalInfo?: string;
}

// 캐릭터
export interface Character {
  id: string;
  inputMode: ProfileInputMode;
  fieldProfile?: CharacterFieldProfile;
  freeProfile?: string;
  freeProfileImage?: string; // 자유 모드에서의 프로필 이미지
  freeProfileName?: string; // 자유 모드에서의 이름
  createdAt: number;
  updatedAt: number;
}

// 유저 프로필 (필드 모드)
export interface UserFieldProfile {
  name: string;
  profileImage?: string;
  personality: string;
  appearance: string;
  settings: string;
  additionalInfo?: string;
}

// 유저 프로필 슬롯
export interface UserProfileSlot {
  id: string;
  inputMode: ProfileInputMode;
  fieldProfile?: UserFieldProfile;
  freeProfile?: string;
  freeProfileName?: string; // 자유 모드에서의 이름
  createdAt: number;
  updatedAt: number;
}

// 유저 프로필 (레거시 호환)
export interface UserProfile {
  inputMode: ProfileInputMode;
  fieldProfile?: UserFieldProfile;
  freeProfile?: string;
}

// 메모리 요약 (장기 기억)
export interface MemorySummary {
  id: string;
  content: string; // 마크다운 형식 요약 (영어)
  summarizedMessageIds: string[]; // 요약된 메시지 ID들
  startTime: number; // 요약 대상 시작 시간
  endTime: number; // 요약 대상 끝 시간
  createdAt: number;
}

// 채팅방
export interface Chat {
  id: string;
  characterId: string;
  userProfileId?: string; // 유저 프로필 슬롯 ID
  theme: ThemeType; // 채팅방 고정 테마
  imessageColor?: IMessageColor; // iMessage 테마일 때 말풍선 색상
  messages: Message[];
  memorySummaries?: MemorySummary[]; // 장기 기억 요약들
  mode: ChatMode;
  autopilotScenario?: string; // Autopilot 모드 시나리오
  isAutopilotRunning?: boolean;
  timeSettings?: TimeSettings; // 채팅방별 시간 설정
  outputLanguage?: OutputLanguage; // 채팅방별 출력 언어 설정
  createdAt: number;
  updatedAt: number;
}

// 메시지 분기
export interface MessageBranch {
  id: string;
  content: string;
  translatedContent?: string;
  timestamp: number;
  // 이 브랜치를 선택했을 때 보여줄 분기점 이후 메시지들
  messagesAfter?: Message[];
}

// 이모티콘/스티커
export interface Sticker {
  id: string;
  name: string; // 이모티콘 이름
  description: string; // 이모티콘 설명 (AI 컨텍스트용)
  imageData: string; // Base64 이미지 데이터
  mimeType: string; // image/png, image/jpeg, image/gif 등
  isCharacterUsable: boolean; // 캐릭터도 이 이모티콘을 사용할 수 있는지
  createdAt: number;
}

// 앱 설정
export interface AppSettings {
  geminiApiKey?: string;
  openaiApiKey?: string;
  responseModel: string; // 답변 모델 (gemini-xxx 또는 gpt-xxx)
  translationModel: string; // 번역 모델 (gemini-xxx 또는 gpt-xxx)
  summaryModel: string; // 요약 모델 (gemini-xxx 또는 gpt-xxx)
  gptFlexTier?: boolean; // GPT Flex 티어 사용 여부 (저렴한 가격, 느린 처리)
  phoneFrame?: PhoneFrameType; // 폰 프레임 타입 (iphone/android)
  // 레거시 호환 (deprecated)
  defaultAIProvider?: AIProvider;
  geminiModel?: string;
  openaiModel?: string;
  theme?: ThemeType; // deprecated - 기존 데이터 호환용
  outputLanguage?: OutputLanguage; // deprecated - 채팅방별로 이동
  timeSettings?: TimeSettings; // deprecated - 채팅방별로 이동
}

// 전체 앱 상태
export interface AppState {
  settings: AppSettings;
  userProfile: UserProfile;
  characters: Character[];
  chats: Chat[];
  currentChatId?: string;
}
