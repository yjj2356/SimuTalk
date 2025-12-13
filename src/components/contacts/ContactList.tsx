import { useState, useEffect, useRef } from 'react';
import { useChatStore, useCharacterStore, useUserStore, useThemeSettingsStore } from '@/stores';
import { themeConfigs } from '@/utils/theme';
import { Character, Chat, ThemeType, OutputLanguage, IMessageColor, UserProfileSlot } from '@/types';

// 언어 이름 매핑
const languageNames: Record<OutputLanguage, string> = {
  korean: '한국어',
  english: 'English',
  japanese: '日本語',
  chinese: '中文',
};

// 유저 프로필 아이템
interface UserProfileItemProps {
  profile: UserProfileSlot;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
  onEdit: () => void;
}

function UserProfileItem({ profile, isSelected, isCurrent, onClick, onEdit }: UserProfileItemProps) {
  const name = profile.fieldProfile?.name || profile.freeProfileName || '이름 없음';
  const profileImage = profile.fieldProfile?.profileImage;
  const statusMessage = profile.inputMode === 'field' 
    ? profile.fieldProfile?.personality?.slice(0, 30) || ''
    : profile.freeProfile?.slice(0, 30) || '';

  return (
    <div
      className={`w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-left group cursor-pointer rounded-md mx-1.5 mb-0.5 ${
        isSelected 
          ? 'bg-[#1d1d1f] text-white' 
          : 'hover:bg-black/[0.05]'
      }`}
      style={{ width: 'calc(100% - 12px)' }}
      onClick={onClick}
    >
      {/* 프로필 이미지 */}
      {profileImage ? (
        <img
          src={profileImage}
          alt={name}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
          isSelected ? 'bg-white/20' : 'bg-gradient-to-br from-blue-100 to-blue-200'
        }`}>
          <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-blue-600'}`}>
            {name.charAt(0)}
          </span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className={`font-medium truncate text-[13px] ${isSelected ? 'text-white' : 'text-[#1d1d1f]'}`}>
            {name}
          </p>
          {isCurrent && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${
              isSelected ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'
            }`}>
              사용중
            </span>
          )}
        </div>
        {statusMessage && (
          <p className={`text-[11px] truncate mt-0.5 ${isSelected ? 'text-white/70' : 'text-[#8e8e93]'}`}>
            {statusMessage}
          </p>
        )}
      </div>
      
      {/* 수정 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className={`p-1 rounded transition-all ${
          isSelected 
            ? 'hover:bg-white/20 text-white/70 hover:text-white opacity-0 group-hover:opacity-100'
            : 'hover:bg-black/[0.08] text-[#8e8e93] hover:text-[#1d1d1f] opacity-0 group-hover:opacity-100'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      </button>
    </div>
  );
}

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
      className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-left group cursor-pointer hover:bg-black/[0.05] rounded-md mx-1.5 mb-0.5"
      style={{ width: 'calc(100% - 12px)' }}
      onClick={onClick}
    >
      {/* 프로필 이미지 */}
      {profileImage ? (
        <img
          src={profileImage}
          alt={name}
          className="w-9 h-9 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#e5e5ea] to-[#d1d1d6] flex items-center justify-center flex-shrink-0">
          <span className="text-[#8e8e93] text-sm font-medium">
            {name.charAt(0)}
          </span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="font-medium text-[#1d1d1f] truncate text-[13px]">
            {name}
          </p>
          {chatCount > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#1d1d1f] text-white font-medium">
              {chatCount}
            </span>
          )}
        </div>
        {statusMessage && (
          <p className="text-[11px] text-[#8e8e93] truncate mt-0.5">{statusMessage}</p>
        )}
      </div>
      
      {/* 수정 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="p-1 rounded hover:bg-black/[0.08] text-[#8e8e93] hover:text-[#1d1d1f] opacity-0 group-hover:opacity-100 transition-all"
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
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const languageMenuRef = useRef<HTMLDivElement>(null);
  const { setChatOutputLanguage } = useChatStore();
  
  const lastMessage = chat.messages[chat.messages.length - 1];
  // 현재 선택된 분기의 내용을 미리보기로 표시
  const lastMessageContent = lastMessage 
    ? (lastMessage.currentBranchIndex === 0 || !lastMessage.branches?.length
        ? lastMessage.content
        : lastMessage.branches[lastMessage.currentBranchIndex - 1]?.content || lastMessage.content)
    : null;
  const lastMessagePreview = lastMessageContent?.slice(0, 30) || '새 대화';
  const currentLanguage = chat.outputLanguage || 'korean';

  // 외부 클릭 시 메뉴 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
    };
    
    if (showLanguageMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLanguageMenu]);

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const handleLanguageChange = (lang: OutputLanguage) => {
    setChatOutputLanguage(chat.id, lang);
    setShowLanguageMenu(false);
  };

  return (
    <div
      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md transition-colors text-left group cursor-pointer ${
        isSelected 
          ? 'bg-[#1d1d1f] text-white' 
          : 'hover:bg-black/[0.05]'
      }`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
              isSelected 
                ? 'bg-white/20 text-white'
                : chat.theme === 'kakao' ? 'bg-amber-100 text-amber-700' :
                  chat.theme === 'line' ? 'bg-emerald-100 text-emerald-700' :
                  chat.theme === 'imessage' ? 'bg-blue-100 text-blue-700' :
                  'bg-gray-100 text-gray-600'
            }`}>
              {themeConfigs[chat.theme].displayName}
            </span>
            {/* 언어 배지 */}
            <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
              isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {languageNames[currentLanguage]}
            </span>
          </div>
          {lastMessage && (
            <span className={`text-[10px] flex-shrink-0 ml-1.5 ${
              isSelected ? 'text-white/70' : 'text-[#8e8e93]'
            }`}>
              {formatTime(lastMessage.timestamp)}
            </span>
          )}
        </div>
        <p className={`text-[11px] truncate mt-0.5 ${
          isSelected ? 'text-white/80' : 'text-[#8e8e93]'
        }`}>{lastMessagePreview}</p>
      </div>
      
      {/* 언어 설정 버튼 */}
      <div className="relative" ref={languageMenuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowLanguageMenu(!showLanguageMenu);
          }}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all duration-200"
          title="언어 설정"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        </button>
        
        {/* 언어 드롭다운 메뉴 */}
        {showLanguageMenu && (
          <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[100px]">
            {(Object.keys(languageNames) as OutputLanguage[]).map((lang) => (
              <button
                key={lang}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLanguageChange(lang);
                }}
                className={`w-full px-3 py-1.5 text-left text-xs hover:bg-gray-100 transition-colors ${
                  currentLanguage === lang ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'
                }`}
              >
                {languageNames[lang]}
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* 삭제 버튼 */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirm('이 채팅방을 삭제하시겠습니까?')) {
            onDelete();
          }
        }}
        className={`p-1.5 rounded-md hover:bg-red-100 text-transparent hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all ${
          isSelected ? 'hover:bg-white/20 text-white/50 hover:text-white' : ''
        }`}
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
  onCreateChat: (theme: ThemeType, imessageColor?: IMessageColor) => void;
}

function NewChatModal({ characterName, onClose, onCreateChat }: NewChatModalProps) {
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('kakao');
  const [imessageColor, setImessageColor] = useState<IMessageColor>('blue');

  const handleCreate = () => {
    onCreateChat(selectedTheme, selectedTheme === 'imessage' ? imessageColor : undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-xs m-4 shadow-xl">
        <div className="px-4 py-3 border-b border-black/[0.08] flex items-center justify-between">
          <h2 className="text-[13px] font-semibold text-[#1d1d1f]">{characterName}와 새 채팅</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/[0.06] transition-colors"
          >
            <svg className="w-4 h-4 text-[#8e8e93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* 테마 선택 */}
          <div>
            <label className="block text-[10px] font-semibold text-[#8e8e93] mb-2 uppercase tracking-wider">테마 선택</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(themeConfigs) as ThemeType[]).map((theme) => (
                <button
                  key={theme}
                  onClick={() => setSelectedTheme(theme)}
                  className={`p-2.5 rounded-md border text-left transition-all ${
                    selectedTheme === theme
                      ? 'border-[#1d1d1f] bg-[#1d1d1f]/5'
                      : 'border-black/[0.08] hover:bg-black/[0.03]'
                  }`}
                >
                  <span className={`text-[12px] font-medium ${selectedTheme === theme ? 'text-[#1d1d1f]' : 'text-[#6e6e73]'}`}>
                    {themeConfigs[theme].displayName}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* iMessage 색상 선택 */}
          {selectedTheme === 'imessage' && (
            <div>
              <label className="block text-[10px] font-semibold text-[#8e8e93] mb-2 uppercase tracking-wider">말풍선 색상</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setImessageColor('blue')}
                  className={`p-2.5 rounded-md border text-left transition-all flex items-center gap-2 ${
                    imessageColor === 'blue'
                      ? 'border-[#007AFF] bg-[#007AFF]/5'
                      : 'border-black/[0.08] hover:bg-black/[0.03]'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-[#007AFF]"></div>
                  <span className={`text-[12px] font-medium ${imessageColor === 'blue' ? 'text-[#007AFF]' : 'text-[#6e6e73]'}`}>
                    Blue
                  </span>
                </button>
                <button
                  onClick={() => setImessageColor('green')}
                  className={`p-2.5 rounded-md border text-left transition-all flex items-center gap-2 ${
                    imessageColor === 'green'
                      ? 'border-[#38DA61] bg-[#38DA61]/5'
                      : 'border-black/[0.08] hover:bg-black/[0.03]'
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-[#38DA61]"></div>
                  <span className={`text-[12px] font-medium ${imessageColor === 'green' ? 'text-[#38DA61]' : 'text-[#6e6e73]'}`}>
                    Green
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* 생성 버튼 */}
          <button
            onClick={handleCreate}
            className="w-full py-2 bg-[#1d1d1f] text-white rounded-md hover:bg-[#3a3a3c] text-[12px] font-medium transition-all"
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
  onEditUserProfile: (profileId?: string) => void;
}

export function ContactList({ onAddCharacter, onEditCharacter, onEditUserProfile }: ContactListProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [profilesExpanded, setProfilesExpanded] = useState(true);
  
  const { characters, getCharacter } = useCharacterStore();
  const { chats, currentChatId, createChat, setCurrentChat, deleteChat } = useChatStore();
  const { userProfiles, currentUserProfileId, setCurrentUserProfile } = useUserStore();
  const { themeCustomization } = useThemeSettingsStore();

  const selectedCharacter = selectedCharacterId ? getCharacter(selectedCharacterId) : null;
  
  // 선택된 캐릭터의 채팅방들
  const characterChats = selectedCharacterId 
    ? chats.filter(c => c.characterId === selectedCharacterId).sort((a, b) => b.updatedAt - a.updatedAt)
    : [];

  // 캐릭터별 채팅방 수
  const getChatCount = (characterId: string) => chats.filter(c => c.characterId === characterId).length;

  const handleCreateChat = (theme: ThemeType, imessageColor?: IMessageColor) => {
    if (selectedCharacterId) {
      createChat(selectedCharacterId, theme, imessageColor);
    }
  };

  const characterName = selectedCharacter?.fieldProfile?.name || selectedCharacter?.freeProfileName || '캐릭터';

  // 캐릭터 목록 뷰
  if (!selectedCharacterId) {
    return (
      <div className="flex flex-col h-full">
        {/* 프로필 섹션 */}
        <div className="border-b" style={{ borderColor: themeCustomization.sidebarBorderColor }}>
          {/* 프로필 헤더 */}
          <div className="flex items-center justify-between px-4 py-2.5">
            <button 
              onClick={() => setProfilesExpanded(!profilesExpanded)}
              className="flex items-center gap-1.5 text-[13px] font-semibold hover:opacity-80 transition-opacity"
              style={{ color: themeCustomization.sidebarTextColor }}
            >
              <svg 
                className={`w-3 h-3 transition-transform ${profilesExpanded ? 'rotate-90' : ''}`} 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/>
              </svg>
              내 프로필
              <span className="text-[10px] font-normal opacity-60">({userProfiles.length})</span>
            </button>
            <button
              onClick={() => onEditUserProfile()}
              className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/[0.06] transition-all"
              style={{ color: themeCustomization.sidebarTextColor, opacity: 0.6 }}
              title="프로필 추가"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {/* 프로필 목록 */}
          {profilesExpanded && (
            <div className="pb-2 px-1.5">
              {userProfiles.length === 0 ? (
                <div className="flex items-center justify-center py-3 px-3">
                  <button
                    onClick={() => onEditUserProfile()}
                    className="text-[11px] px-3 py-1.5 rounded-md border border-dashed transition-all hover:bg-black/[0.03]"
                    style={{ 
                      color: themeCustomization.sidebarTextColor, 
                      opacity: 0.6,
                      borderColor: themeCustomization.sidebarBorderColor 
                    }}
                  >
                    + 프로필 추가하기
                  </button>
                </div>
              ) : (
                userProfiles.map((profile) => (
                  <UserProfileItem
                    key={profile.id}
                    profile={profile}
                    isSelected={false}
                    isCurrent={currentUserProfileId === profile.id}
                    onClick={() => setCurrentUserProfile(profile.id)}
                    onEdit={() => onEditUserProfile(profile.id)}
                  />
                ))
              )}
            </div>
          )}
        </div>

        {/* 친구 헤더 */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <h1 className="text-[13px] font-semibold" style={{ color: themeCustomization.sidebarTextColor }}>
            친구
            <span className="text-[10px] font-normal opacity-60 ml-1.5">({characters.length})</span>
          </h1>
          <button
            onClick={onAddCharacter}
            className="w-6 h-6 flex items-center justify-center rounded hover:bg-black/[0.06] transition-all"
            style={{ color: themeCustomization.sidebarTextColor, opacity: 0.6 }}
            title="캐릭터 추가"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* 캐릭터 목록 */}
        <div className="flex-1 overflow-y-auto px-1.5">
          {characters.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-4" style={{ color: themeCustomization.sidebarTextColor, opacity: 0.6 }}>
              <p className="text-[12px] mb-3">등록된 캐릭터가 없습니다</p>
              <button
                onClick={onAddCharacter}
                className="px-3 py-1.5 text-white text-[12px] font-medium rounded-md hover:opacity-90 transition-colors"
                style={{ backgroundColor: themeCustomization.accentColor }}
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
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="flex items-center gap-2 px-2.5 py-2.5 border-b border-black/[0.08]">
        <button
          onClick={() => setSelectedCharacterId(null)}
          className="p-1 rounded hover:bg-black/[0.06] text-[#8e8e93] hover:text-[#1d1d1f] transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* 캐릭터 정보 */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {(selectedCharacter?.fieldProfile?.profileImage || selectedCharacter?.freeProfileImage) ? (
            <img
              src={selectedCharacter.fieldProfile?.profileImage || selectedCharacter.freeProfileImage}
              alt={characterName}
              className="w-7 h-7 rounded-full object-cover"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#e5e5ea] to-[#d1d1d6] flex items-center justify-center">
              <span className="text-[#8e8e93] text-xs font-medium">{characterName.charAt(0)}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-[#1d1d1f] truncate text-[13px]">{characterName}</p>
            <p className="text-[10px] text-[#8e8e93]">{characterChats.length}개 채팅</p>
          </div>
        </div>

        {/* 새 채팅 버튼 */}
        <button
          onClick={() => setShowNewChatModal(true)}
          className="p-1 rounded hover:bg-black/[0.06] text-[#8e8e93] hover:text-[#1d1d1f] transition-all"
          title="새 채팅"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* 채팅방 목록 */}
      <div className="flex-1 overflow-y-auto p-1.5">
        {characterChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[#8e8e93] p-4">
            <p className="text-[12px] mb-3">채팅방이 없습니다</p>
            <button
              onClick={() => setShowNewChatModal(true)}
              className="px-3 py-1.5 bg-[#1d1d1f] text-white text-[12px] font-medium rounded-md hover:bg-[#3a3a3c] transition-colors"
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
