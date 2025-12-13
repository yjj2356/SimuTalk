import { useEffect, useState } from 'react';
import { MainLayout } from '@/components/layout';
import { PopupView } from '@/components/layout/PopupView';

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

  // 팝업 모드면 PopupView 렌더링
  if (isPopup && popupChatId) {
    return <PopupView chatId={popupChatId} />;
  }

  // 일반 모드면 MainLayout 렌더링
  return <MainLayout />;
}

export default App;
