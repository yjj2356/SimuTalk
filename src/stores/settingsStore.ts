import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, ThemeType, OutputLanguage, TimeMode } from '@/types';

interface SettingsState {
  settings: AppSettings;
  setTheme: (theme: ThemeType) => void;
  setGeminiApiKey: (key: string) => void;
  setOpenAIApiKey: (key: string) => void;
  setResponseModel: (model: string) => void;
  setTranslationModel: (model: string) => void;
  setOutputLanguage: (language: OutputLanguage) => void;
  setTimeMode: (mode: TimeMode) => void;
  setCustomTime: (date: Date) => void;
  getCurrentTime: () => Date;
  formatCurrentTime: () => string;
}

const defaultSettings: AppSettings = {
  theme: 'kakao',
  responseModel: 'gemini-3-pro-preview',
  translationModel: 'gemini-2.5-flash-preview-09-2025',
  outputLanguage: 'korean',
  timeSettings: {
    mode: 'realtime',
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      setTheme: (theme) =>
        set((state) => ({
          settings: { ...state.settings, theme },
        })),
      setGeminiApiKey: (geminiApiKey) =>
        set((state) => ({
          settings: { ...state.settings, geminiApiKey },
        })),
      setOpenAIApiKey: (openaiApiKey) =>
        set((state) => ({
          settings: { ...state.settings, openaiApiKey },
        })),
      setResponseModel: (responseModel) =>
        set((state) => ({
          settings: { ...state.settings, responseModel },
        })),
      setTranslationModel: (translationModel) =>
        set((state) => ({
          settings: { ...state.settings, translationModel },
        })),
      setOutputLanguage: (outputLanguage) =>
        set((state) => ({
          settings: { ...state.settings, outputLanguage },
        })),
      setTimeMode: (mode) =>
        set((state) => ({
          settings: {
            ...state.settings,
            timeSettings: {
              ...state.settings.timeSettings,
              mode,
              // 실시간 모드로 전환 시 커스텀 시간 초기화
              ...(mode === 'realtime' ? { customBaseTime: undefined, startedAt: undefined } : {}),
            },
          },
        })),
      setCustomTime: (date) =>
        set((state) => ({
          settings: {
            ...state.settings,
            timeSettings: {
              mode: 'custom',
              customBaseTime: date.getTime(),
              startedAt: Date.now(),
            },
          },
        })),
      getCurrentTime: () => {
        const { timeSettings } = get().settings;
        if (!timeSettings || timeSettings.mode === 'realtime') {
          return new Date();
        }
        // 커스텀 모드: 설정된 시간 + (현재 시간 - 시작 시점) = 흘러간 시간
        const elapsed = Date.now() - (timeSettings.startedAt || Date.now());
        return new Date((timeSettings.customBaseTime || Date.now()) + elapsed);
      },
      formatCurrentTime: () => {
        const time = get().getCurrentTime();
        return time.toLocaleTimeString('ko-KR', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: false,
        });
      },
    }),
    {
      name: 'simutalk-settings',
    }
  )
);
