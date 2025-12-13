const { contextBridge, ipcRenderer } = require('electron');

// 안전하게 렌더러 프로세스에 API 노출
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform,
  // 메인 창 제어
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  toggleAlwaysOnTop: () => ipcRenderer.invoke('toggle-always-on-top'),
  isAlwaysOnTop: () => ipcRenderer.invoke('is-always-on-top'),
  // 팝업 창 관련
  openPopupWindow: (chatId) => ipcRenderer.invoke('open-popup-window', chatId),
  closePopupWindow: () => ipcRenderer.send('close-popup-window'),
  minimizePopupWindow: () => ipcRenderer.send('minimize-popup-window'),
  togglePopupAlwaysOnTop: () => ipcRenderer.invoke('toggle-popup-always-on-top'),
  isPopupAlwaysOnTop: () => ipcRenderer.invoke('is-popup-always-on-top'),
  // 팝업 닫힘 이벤트 수신
  onPopupClosed: (callback) => ipcRenderer.on('popup-closed', (event, chatId) => callback(chatId)),
  removePopupClosedListener: () => ipcRenderer.removeAllListeners('popup-closed')
});
