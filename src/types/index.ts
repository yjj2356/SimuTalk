// 테마 타입
export type ThemeType = 'kakao' | 'line' | 'imessage' | 'basic';

// 채팅 모드
export type ChatMode = 'immersion' | 'autopilot';

// 프로필 입력 모드
export type ProfileInputMode = 'field' | 'free';

// 출력 언어 설정
export type OutputLanguage = 'korean' | 'foreign';

// AI 제공자
export type AIProvider = 'gemini' | 'openai';

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
  outputLanguage: OutputLanguage;
  foreignLanguage?: string; // 외국어 출력시 언어 설정
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

// 유저 프로필
export interface UserProfile {
  inputMode: ProfileInputMode;
  fieldProfile?: UserFieldProfile;
  freeProfile?: string;
}

// 채팅방
export interface Chat {
  id: string;
  characterId: string;
  messages: Message[];
  mode: ChatMode;
  autopilotScenario?: string; // Autopilot 모드 시나리오
  isAutopilotRunning?: boolean;
  createdAt: number;
  updatedAt: number;
}

// 메시지 분기
export interface MessageBranch {
  id: string;
  content: string;
  translatedContent?: string;
  timestamp: number;
}

// 앱 설정
export interface AppSettings {
  theme: ThemeType;
  geminiApiKey?: string;
  openaiApiKey?: string;
  defaultAIProvider: AIProvider;
  geminiModel: string;
  openaiModel: string;
  translateUserMessages: boolean; // 유저 메시지도 번역할지
}

// 전체 앱 상태
export interface AppState {
  settings: AppSettings;
  userProfile: UserProfile;
  characters: Character[];
  chats: Chat[];
  currentChatId?: string;
}
