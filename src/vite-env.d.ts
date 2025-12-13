/// <reference types="vite/client" />

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
}

interface Window {
  electronAPI?: ElectronAPI;
}
