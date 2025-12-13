const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');

// 개발 모드 여부 확인
const isDev = !app.isPackaged;

let mainWindow;
let popupWindows = new Map(); // chatId -> BrowserWindow

function createWindow() {
  // 아이콘 경로 설정
  const iconPath = isDev 
    ? path.join(__dirname, '../build/icon.ico')
    : path.join(process.resourcesPath, 'icon.ico');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    titleBarStyle: 'default',
    show: false,
    backgroundColor: '#1a1a2e'
  });

  // 창이 준비되면 표시
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // 개발 모드에서는 로컬 서버, 프로덕션에서는 빌드된 파일 로드
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    // 개발 도구 열기
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 외부 링크는 기본 브라우저에서 열기
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    // 메인 창 닫히면 모든 팝업도 닫기
    popupWindows.forEach(win => win.close());
    popupWindows.clear();
  });
}

// 팝업 창 생성 함수
function createPopupWindow(chatId) {
  // 이미 해당 채팅의 팝업이 있으면 포커스
  if (popupWindows.has(chatId)) {
    const existingWindow = popupWindows.get(chatId);
    existingWindow.focus();
    return;
  }

  // 아이콘 경로 설정
  const iconPath = isDev 
    ? path.join(__dirname, '../build/icon.ico')
    : path.join(process.resourcesPath, 'icon.ico');

  const popup = new BrowserWindow({
    width: 380,
    height: 650,
    minWidth: 320,
    minHeight: 500,
    maxWidth: 500,
    maxHeight: 900,
    icon: iconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    resizable: true,
    skipTaskbar: false,
    show: false,
    backgroundColor: '#1a1a2e',
    parent: null, // 독립 창
  });

  // URL에 chatId를 쿼리 파라미터로 전달
  const baseUrl = isDev ? 'http://localhost:5173' : `file://${path.join(__dirname, '../dist/index.html')}`;
  const separator = isDev ? '?' : '#';
  popup.loadURL(`${baseUrl}${separator}popup=true&chatId=${chatId}`);

  popup.once('ready-to-show', () => {
    popup.show();
  });

  popup.on('closed', () => {
    popupWindows.delete(chatId);
    // 메인 창에 팝업 닫힘 알림
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('popup-closed', chatId);
    }
  });

  popupWindows.set(chatId, popup);
}

// Electron 앱 준비 완료
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 모든 창이 닫히면 앱 종료 (macOS 제외)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 핸들러 (필요시 추가)
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// 팝업 창 열기
ipcMain.handle('open-popup-window', (event, chatId) => {
  createPopupWindow(chatId);
  return true;
});

// 팝업 창 닫기
ipcMain.on('close-popup-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && win !== mainWindow) {
    win.close();
  }
});

// 팝업 창 최소화
ipcMain.on('minimize-popup-window', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

// 팝업 창 항상 위 토글
ipcMain.handle('toggle-popup-always-on-top', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    const isOnTop = win.isAlwaysOnTop();
    win.setAlwaysOnTop(!isOnTop);
    return !isOnTop;
  }
  return false;
});

// 팝업 창 항상 위 상태 확인
ipcMain.handle('is-popup-always-on-top', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  return win ? win.isAlwaysOnTop() : false;
});

// 창 제어 핸들러
ipcMain.on('window-minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window-close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('toggle-always-on-top', () => {
  if (mainWindow) {
    const isOnTop = mainWindow.isAlwaysOnTop();
    mainWindow.setAlwaysOnTop(!isOnTop);
    return !isOnTop;
  }
  return false;
});

ipcMain.handle('is-always-on-top', () => {
  return mainWindow ? mainWindow.isAlwaysOnTop() : false;
});
