import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, ThemeType, AIProvider } from '@/types';

interface SettingsState {
  settings: AppSettings;
  setTheme: (theme: ThemeType) => void;
  setGeminiApiKey: (key: string) => void;
  setOpenAIApiKey: (key: string) => void;
  setDefaultAIProvider: (provider: AIProvider) => void;
  setGeminiModel: (model: string) => void;
  setOpenAIModel: (model: string) => void;
  setTranslateUserMessages: (value: boolean) => void;
}

const defaultSettings: AppSettings = {
  theme: 'kakao',
  defaultAIProvider: 'gemini',
  geminiModel: 'gemini-3-pro-preview',
  openaiModel: 'gpt-5.1-chat-latest',
  translateUserMessages: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
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
      setDefaultAIProvider: (defaultAIProvider) =>
        set((state) => ({
          settings: { ...state.settings, defaultAIProvider },
        })),
      setGeminiModel: (geminiModel) =>
        set((state) => ({
          settings: { ...state.settings, geminiModel },
        })),
      setOpenAIModel: (openaiModel) =>
        set((state) => ({
          settings: { ...state.settings, openaiModel },
        })),
      setTranslateUserMessages: (translateUserMessages) =>
        set((state) => ({
          settings: { ...state.settings, translateUserMessages },
        })),
    }),
    {
      name: 'simutalk-settings',
    }
  )
);
