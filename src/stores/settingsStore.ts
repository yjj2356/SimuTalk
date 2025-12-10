import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings } from '@/types';

interface SettingsState {
  settings: AppSettings;
  setGeminiApiKey: (key: string) => void;
  setOpenAIApiKey: (key: string) => void;
  setResponseModel: (model: string) => void;
  setTranslationModel: (model: string) => void;
  setSummaryModel: (model: string) => void;
}

const defaultSettings: AppSettings = {
  responseModel: 'gemini-3-pro-preview',
  translationModel: 'gemini-2.5-flash-preview-09-2025',
  summaryModel: 'gemini-2.5-flash-preview-09-2025',
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
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
      setSummaryModel: (summaryModel) =>
        set((state) => ({
          settings: { ...state.settings, summaryModel },
        })),
    }),
    {
      name: 'simutalk-settings',
    }
  )
);
