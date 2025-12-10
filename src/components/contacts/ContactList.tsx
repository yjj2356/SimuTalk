import { useState } from 'react';
import { useChatStore, useCharacterStore } from '@/stores';
import { themeConfigs } from '@/utils/theme';
import { Character, Chat, ThemeType } from '@/types';

// 캐릭터(친구) 아이템
interface CharacterItemProps {
  character: Character;
  chatCount: number;
  onClick: () => void;
  onEdit: () => void;
}

function CharacterItem({ character, chatCount, onClick, onEdit }: CharacterItemProps) {
  const name = character.fieldProfile?.name || character.freeProfileName || character.freeProfile?.slice(0, 20) || '캐릭터';
  const profileImage = character.fieldProfile?.profileImage || character.freeProfileImage;
  const statusMessage = character.fieldProfile?.personality?.slice(0, 30) || '';

  return (
    <div
      className="w-full flex items-center gap-3 px-4 py-3 mx-2 mb-1 rounded-lg transition-all duration-200 text-left group cursor-pointer hover:bg-white/60 hover:shadow-sm"
      style={{ width: 'calc(100% - 16px)' }}
      onClick={onClick}
    >
      {/* 프로필 이미지 */}
      {profileImage ? (
        <img
          src={profileImage}
          alt={name}
          className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-sm border border-gray-100"
        />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0 shadow-inner">
          <span className="text-gray-500 text-lg font-semibold">
            {name.charAt(0)}
          </span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold truncate text-gray-700 group-hover:text-gray-900 transition-colors">
            {name}
          </p>
          {chatCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600">
              {chatCount}
            </span>
          )}
        </div>
        {statusMessage && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{statusMessage}</p>
        )}
      </div>
      
      {/* 수정 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="p-2 rounded-lg hover:bg-gray-200/50 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}

// 채팅방 아이템
interface ChatItemProps {
  chat: Chat;
  character: Character;
  isSelected: boolean;
  onClick: () => void;
  onDelete: () => void;
}

function ChatItem({ chat, isSelected, onClick, onDelete }: ChatItemProps) {
  const lastMessage = chat.messages[chat.messages.length - 1];
  const lastMessagePreview = lastMessage?.content?.slice(0, 30) || '새 대화';

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left group cursor-pointer ${
        isSelected 
          ? 'bg-white shadow-sm ring-1 ring-black/5' 
          : 'hover:bg-white/60 hover:shadow-sm'
      }`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              chat.theme === 'kakao' ? 'bg-kakao-yellow/30 text-yellow-700' :
              chat.theme === 'line' ? 'bg-line-green/20 text-green-700' :
              chat.theme === 'imessage' ? 'bg-imessage-blue/20 text-blue-700' :
              'bg-gray-100 text-gray-600'
            }`}>
              {themeConfigs[chat.theme].displayName}
            </span>
          </div>
          {lastMessage && (
            <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">
              {formatTime(lastMessage.timestamp)}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 truncate mt-1">{lastMessagePreview}</p>
      </div>
      
      {/* 삭제 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm('이 채팅방을 삭제하시겠습니까?')) {
            onDelete();
          }
        }}
        className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-200"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

// 새 채팅 테마 선택 모달
interface NewChatModalProps {
  characterId: string;
  characterName: string;
  onClose: () => void;
  onCreateChat: (theme: ThemeType) => void;
}

function NewChatModal({ characterName, onClose, onCreateChat }: NewChatModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('kakao');

  const handleCreate = () => {
    onCreateChat(selectedTheme);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-sm m-4 shadow-2xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold">{characterName}와 새 채팅</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* 테마 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">테마 선택</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(themeConfigs) as ThemeType[]).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setSelectedTheme(theme)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    selectedTheme === theme
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-sm font-medium">{themeConfigs[theme].displayName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 생성 버튼 */}
          <button
            onClick={handleCreate}
            className="w-full py-2.5 bg-black text-white rounded-xl hover:bg-gray-800 text-sm font-medium transition-all"
          >
            채팅방 만들기
          </button>
        </div>
      </div>
    </div>
  );
}

interface ContactListProps {
  onAddCharacter: () => void;
  onEditCharacter: (character: Character) => void;
}

export function ContactList({ onAddCharacter, onEditCharacter }: ContactListProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  
  const { characters, getCharacter } = useCharacterStore();
  const { chats, currentChatId, createChat, setCurrentChat, deleteChat } = useChatStore();

  const selectedCharacter = selectedCharacterId ? getCharacter(selectedCharacterId) : null;
  
  // 선택된 캐릭터의 채팅방들
  const characterChats = selectedCharacterId 
    ? chats.filter(c => c.characterId === selectedCharacterId).sort((a, b) => b.updatedAt - a.updatedAt)
    : [];

  // 캐릭터별 채팅방 수
  const getChatCount = (characterId: string) => chats.filter(c => c.characterId === characterId).length;

  const handleCreateChat = (theme: ThemeType) => {
    if (selectedCharacterId) {
      createChat(selectedCharacterId, theme);
    }
  };

  const characterName = selectedCharacter?.fieldProfile?.name || selectedCharacter?.freeProfileName || '캐릭터';

  // 캐릭터 목록 뷰
  if (!selectedCharacterId) {
    return (
      <div className="flex flex-col h-full bg-transparent">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">친구</h1>
          <button
            onClick={onAddCharacter}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200/50 text-gray-400 hover:text-gray-900 transition-all duration-200"
            title="캐릭터 추가"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* 캐릭터 목록 */}
        <div className="flex-1 overflow-y-auto px-0">
          {characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
              <p className="text-sm mb-3 font-medium">등록된 캐릭터가 없습니다</p>
              <button
                onClick={onAddCharacter}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
              >
                캐릭터 추가하기
              </button>
            </div>
          ) : (
            characters.map((character) => (
              <CharacterItem
                key={character.id}
                character={character}
                chatCount={getChatCount(character.id)}
                onClick={() => setSelectedCharacterId(character.id)}
                onEdit={() => onEditCharacter(character)}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  // 채팅방 목록 뷰 (캐릭터 선택됨)
  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
        <button
          onClick={() => setSelectedCharacterId(null)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* 캐릭터 정보 */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {(selectedCharacter?.fieldProfile?.profileImage || selectedCharacter?.freeProfileImage) ? (
            <img
              src={selectedCharacter.fieldProfile?.profileImage || selectedCharacter.freeProfileImage}
              alt={characterName}
              className="w-9 h-9 rounded-xl object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span className="text-gray-500 text-sm font-semibold">{characterName.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{characterName}</p>
            <p className="text-xs text-gray-500">{characterChats.length}개의 채팅방</p>
          </div>
        </div>

        {/* 새 채팅 버튼 */}
        <button
          onClick={() => setShowNewChatModal(true)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-all"
          title="새 채팅"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* 채팅방 목록 */}
      <div className="flex-1 overflow-y-auto p-2">
        {characterChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <p className="text-sm mb-3 font-medium">채팅방이 없습니다</p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
            >
              새 채팅 시작하기
            </button>
          </div>
        ) : (
          characterChats.map((chat) => (
            <ChatItem
              key={chat.id}
              chat={chat}
              character={selectedCharacter!}
              isSelected={chat.id === currentChatId}
              onClick={() => setCurrentChat(chat.id)}
              onDelete={() => deleteChat(chat.id)}
            />
          ))
        )}
      </div>

      {/* 새 채팅 모달 */}
      {showNewChatModal && (
        <NewChatModal
          characterId={selectedCharacterId}
          characterName={characterName}
          onClose={() => setShowNewChatModal(false)}
          onCreateChat={handleCreateChat}
        />
      )}
    </div>
  );
}
