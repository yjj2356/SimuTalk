import { useState } from 'react';
import { ContactList } from '@/components/contacts';
import { ChatWindow } from '@/components/chat';
import { CharacterForm, UserProfileForm } from '@/components/profile';
import { SettingsPanel } from '@/components/settings';
import { useChatStore } from '@/stores';

export function MainLayout() {
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { currentChatId, getChat, setChatMode } = useChatStore();

  const currentChat = currentChatId ? getChat(currentChatId) : undefined;

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <div className="w-80 flex flex-col border-r bg-white">
        {/* 연락처 목록 */}
        <div className="flex-1 overflow-hidden">
          <ContactList onAddCharacter={() => setShowCharacterForm(true)} />
        </div>

        {/* 하단 메뉴 */}
        <div className="border-t p-2 flex justify-around">
          <button
            onClick={() => setShowUserProfile(true)}
            className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-xs">내 프로필</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex flex-col items-center gap-1 p-2 hover:bg-gray-100 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs">설정</span>
          </button>
        </div>
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex-1 flex flex-col">
        {/* 모드 전환 버튼 (채팅방이 열려있을 때) */}
        {currentChat && (
          <div className="bg-white border-b px-4 py-2 flex items-center gap-2">
            <span className="text-sm text-gray-500 mr-2">모드:</span>
            <button
              onClick={() => setChatMode(currentChat.id, 'immersion')}
              className={`px-3 py-1 text-sm rounded-full ${
                currentChat.mode === 'immersion'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              몰입 모드
            </button>
            <button
              onClick={() => setChatMode(currentChat.id, 'autopilot')}
              className={`px-3 py-1 text-sm rounded-full ${
                currentChat.mode === 'autopilot'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              오토파일럿
            </button>
          </div>
        )}

        <ChatWindow />
      </div>

      {/* 모달들 */}
      {showCharacterForm && (
        <CharacterForm
          onSave={() => setShowCharacterForm(false)}
          onCancel={() => setShowCharacterForm(false)}
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
