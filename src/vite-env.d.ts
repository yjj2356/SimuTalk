/// <reference types="vite/client" />

import type { AppSettings, Chat } from '@/types';

export {};

// Electron API 타입 정의
interface ElectronAPI {
  getAppVersion: () => Promise<string>;
  platform: string;
  // 메인 창 제어
  minimizeWindow: () => void;
  closeWindow: () => void;
  toggleAlwaysOnTop: () => Promise<boolean>;
  isAlwaysOnTop: () => Promise<boolean>;
  // 팝업 창 관련
  openPopupWindow: (chatId: string) => Promise<boolean>;
  closePopupWindow: () => void;
  minimizePopupWindow: () => void;
  togglePopupAlwaysOnTop: () => Promise<boolean>;
  isPopupAlwaysOnTop: () => Promise<boolean>;
  onPopupClosed: (callback: (chatId: string) => void) => void;
  removePopupClosedListener: () => void;

  // 상태 동기화
  syncChats: (chats: Chat[]) => void;
  onSyncChats: (callback: (chats: Chat[]) => void) => void;
  removeSyncChatsListener: () => void;

  syncSettings: (settings: AppSettings) => void;
  onSyncSettings: (callback: (settings: AppSettings) => void) => void;
  removeSyncSettingsListener: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}
