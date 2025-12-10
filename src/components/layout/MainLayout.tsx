import { useState, useEffect } from 'react';
import { ContactList } from '@/components/contacts';
import { ChatWindow, AutopilotControls, TimeControls } from '@/components/chat';
import { CharacterForm, UserProfileForm } from '@/components/profile';
import { SettingsPanel } from '@/components/settings';
import { useChatStore } from '@/stores';
import { Character } from '@/types';

export function MainLayout() {
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | undefined>(undefined);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const { currentChatId, getChat, setChatMode } = useChatStore();

  const currentChat = currentChatId ? getChat(currentChatId) : undefined;

  // 채팅방별 시간 계산 함수
  const getCurrentChatTime = (): Date => {
    const timeSettings = currentChat?.timeSettings;
    if (!timeSettings || timeSettings.mode === 'realtime') {
      return new Date();
    }
    const elapsed = Date.now() - (timeSettings.startedAt || Date.now());
    return new Date((timeSettings.customBaseTime || Date.now()) + elapsed);
  };

  // 시간 업데이트 (매 초마다)
  useEffect(() => {
    const updateTime = () => {
      const time = getCurrentChatTime();
      setCurrentTime(time.toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [currentChat?.timeSettings]);

  const handleAddCharacter = () => {
    setEditingCharacter(undefined);
    setShowCharacterForm(true);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setShowCharacterForm(true);
  };

  const handleCloseCharacterForm = () => {
    setShowCharacterForm(false);
    setEditingCharacter(undefined);
  };

  return (
    <div className="flex h-screen bg-white text-gray-900 font-sans">
      {/* 사이드바 */}
      <div className="w-80 flex flex-col border-r border-gray-200 bg-[#F5F5F7]">
        {/* 연락처 목록 */}
        <div className="flex-1 overflow-hidden">
          <ContactList 
            onAddCharacter={handleAddCharacter}
            onEditCharacter={handleEditCharacter}
          />
        </div>

        {/* 하단 메뉴 */}
        <div className="border-t border-gray-200 p-3 flex justify-around bg-[#F5F5F7]">
          <button
            onClick={() => setShowUserProfile(true)}
            className="flex flex-col items-center gap-1 p-2 hover:bg-gray-200/50 rounded-lg transition-colors duration-200"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[10px] font-medium text-gray-500">내 프로필</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex flex-col items-center gap-1 p-2 hover:bg-gray-200/50 rounded-lg transition-colors duration-200"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[10px] font-medium text-gray-500">설정</span>
          </button>
        </div>
      </div>

      {/* 메인 채팅 영역 (iPhone Frame) */}
      <div className="flex-1 bg-[#F5F5F7] relative flex flex-row items-center justify-center p-8 overflow-auto gap-12">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-[0.4] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:20px_20px]"></div>

        {/* Control Panel (Left Side) - 좌측 하단 고정 */}
        {currentChat && (
          <div className="absolute bottom-8 left-8 flex flex-col gap-3 z-20 w-96">
            {/* Autopilot Controls - 스위치 위에 표시 */}
            {currentChat.mode === 'autopilot' && (
              <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
                <AutopilotControls chatId={currentChat.id} />
              </div>
            )}
            
            {/* Mode Toggles */}
            <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-full flex items-center shadow-lg border border-gray-200/50 self-start">
              <button
                onClick={() => setChatMode(currentChat.id, 'immersion')}
                className={`px-5 py-2 text-xs font-semibold rounded-full transition-all duration-200 ${
                  currentChat.mode === 'immersion'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                직접
              </button>
              <button
                onClick={() => setChatMode(currentChat.id, 'autopilot')}
                className={`px-5 py-2 text-xs font-semibold rounded-full transition-all duration-200 ${
                  currentChat.mode === 'autopilot'
                    ? 'bg-black text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                자동진행
              </button>
            </div>
          </div>
        )}

        {/* Time Controls (Right Side) - 우측 하단 고정 */}
        {currentChat && (
          <div className="absolute bottom-8 right-8 z-20 w-72">
            <TimeControls chatId={currentChat.id} />
          </div>
        )}

        <div className="relative w-[375px] h-[812px] bg-black rounded-[50px] shadow-[0_0_0_12px_#1a1a1a,0_20px_50px_-10px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/20 z-10 shrink-0">
          
          {/* Screen Content */}
          <div className="absolute inset-0 bg-white rounded-[40px] overflow-hidden flex flex-col">
            
            {/* Status Bar & Notch - 테마별 배경색 변경 */}
            <div className={`h-[44px] w-full flex items-center justify-between px-6 text-xs font-medium select-none z-50 relative shrink-0 ${
              currentChat?.theme === 'kakao' ? 'bg-kakao-bg' : 
              currentChat?.theme === 'line' ? 'bg-line-bg' :
              'bg-white'
            }`}>
                <span className="w-10 text-center">{currentTime || '9:41'}</span>
                <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-[18px]"></div>
                <div className="flex gap-1.5 w-10 justify-end">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
                </div>
            </div>

            {/* App Content */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-[#F5F5F7]">
                <ChatWindow />
            </div>

            {/* Home Indicator - 모드와 테마에 따라 배경색 변경 */}
            <div className={`h-[20px] w-full flex items-center justify-center shrink-0 z-50 ${
              currentChat?.mode === 'immersion'
                ? 'bg-white' // 직접 모드: 입력창 배경색 (흰색)
                : currentChat?.theme === 'kakao'
                  ? 'bg-kakao-bg' // 자동진행 + 카카오: 채팅방 배경색
                  : currentChat?.theme === 'line'
                    ? 'bg-line-bg'
                    : currentChat?.theme === 'imessage'
                      ? 'bg-imessage-bg'
                      : 'bg-white'
            }`}>
                <div className="w-[120px] h-[4px] bg-gray-300 rounded-full"></div>
            </div>

          </div>
        </div>
      </div>

      {/* 모달들 */}
      {showCharacterForm && (
        <CharacterForm
          character={editingCharacter}
          onSave={handleCloseCharacterForm}
          onCancel={handleCloseCharacterForm}
        />
      )}

      {showUserProfile && (
        <UserProfileForm onClose={() => setShowUserProfile(false)} />
      )}

      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
