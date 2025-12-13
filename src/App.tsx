import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout';
import { PopupView } from '@/components/layout/PopupView';
import { useChatStore, useSettingsStore } from '@/stores';
import type { AppSettings, Chat } from '@/types';

function App() {
  const [isPopup, setIsPopup] = useState(false);
  const [popupChatId, setPopupChatId] = useState<string | null>(null);

  useEffect(() => {
    // URL에서 popup 모드와 chatId 파싱
    const parsePopupParams = () => {
      const url = window.location.href;
      const isPopupMode = url.includes('popup=true');
      
      if (isPopupMode) {
        const chatIdMatch = url.match(/chatId=([^&]+)/);
        if (chatIdMatch) {
          setIsPopup(true);
          setPopupChatId(chatIdMatch[1]);
        }
      }
    };

    parsePopupParams();
  }, []);

  useEffect(() => {
    const api = window.electronAPI;
    if (!api) return;

    // preload가 오래된 상태(새 API 미주입)면 동기화 비활성화
    if (!api.syncChats || !api.onSyncChats || !api.syncSettings || !api.onSyncSettings) {
      return;
    }

    let applyingRemoteChats = false;
    let applyingRemoteSettings = false;

    // 로컬 변경 -> 다른 창으로 전파
    // NOTE: 이 프로젝트의 store는 subscribeWithSelector 미들웨어를 사용하지 않으므로
    // subscribe(selector, listener) 오버로드가 동작하지 않습니다. plain subscribe로 처리합니다.
    let lastChatsRef = useChatStore.getState().chats;
    const unsubChats = useChatStore.subscribe((state) => {
      if (applyingRemoteChats) return;
      if (state.chats === lastChatsRef) return;
      lastChatsRef = state.chats;
      api.syncChats(state.chats);
    });

    let lastSettingsRef = useSettingsStore.getState().settings;
    const unsubSettings = useSettingsStore.subscribe((state) => {
      if (applyingRemoteSettings) return;
      if (state.settings === lastSettingsRef) return;
      lastSettingsRef = state.settings;
      api.syncSettings(state.settings);
    });

    // 원격 변경 수신 -> 로컬 store에 적용
    api.onSyncChats((chats) => {
      applyingRemoteChats = true;
      useChatStore.setState({ chats: chats as Chat[] });
      queueMicrotask(() => {
        applyingRemoteChats = false;
      });
    });

    api.onSyncSettings((settings) => {
      applyingRemoteSettings = true;
      useSettingsStore.setState({ settings: settings as AppSettings });
      queueMicrotask(() => {
        applyingRemoteSettings = false;
      });
    });

    return () => {
      unsubChats();
      unsubSettings();
      api.removeSyncChatsListener?.();
      api.removeSyncSettingsListener?.();
    };
  }, []);

  // 팝업 모드면 PopupView 렌더링
  if (isPopup && popupChatId) {
    return <PopupView chatId={popupChatId} />;
  }

  // 일반 모드면 MainLayout 렌더링
  return <MainLayout />;
}

export default App;
