import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings, ThemeType, OutputLanguage } from '@/types';

interface SettingsState {
  settings: AppSettings;
  setTheme: (theme: ThemeType) => void;
  setGeminiApiKey: (key: string) => void;
  setOpenAIApiKey: (key: string) => void;
  setResponseModel: (model: string) => void;
  setTranslationModel: (model: string) => void;
  setOutputLanguage: (language: OutputLanguage) => void;
}

const defaultSettings: AppSettings = {
  theme: 'kakao',
  responseModel: 'gemini-3-pro-preview',
  translationModel: 'gemini-2.5-flash-preview-09-2025',
  outputLanguage: 'korean',
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
    }),
    {
      name: 'simutalk-settings',
    }
  )
);
