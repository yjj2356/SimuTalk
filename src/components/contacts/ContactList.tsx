import { useSettingsStore, useChatStore, useCharacterStore } from '@/stores';
import { getThemeConfig } from '@/utils/theme';
import { Character } from '@/types';

interface ContactItemProps {
  character: Character;
  isSelected: boolean;
  onClick: () => void;
}

function ContactItem({ character, isSelected, onClick }: ContactItemProps) {
  const { settings } = useSettingsStore();
  const themeConfig = getThemeConfig(settings.theme);

  const name = character.fieldProfile?.name || character.freeProfile?.slice(0, 20) || '캐릭터';
  const statusMessage = character.fieldProfile?.personality?.slice(0, 30) || '';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 mx-2 mb-1 rounded-lg transition-all duration-200 text-left group ${
        isSelected 
          ? 'bg-white shadow-sm ring-1 ring-black/5' 
          : 'hover:bg-white/60 hover:shadow-sm'
      }`}
      style={{ width: 'calc(100% - 16px)' }}
    >
      {/* 프로필 이미지 */}
      {themeConfig.contactList.showProfilePicture ? (
        character.fieldProfile?.profileImage ? (
          <img
            src={character.fieldProfile.profileImage}
            alt={name}
            className="w-12 h-12 rounded-xl object-cover flex-shrink-0 shadow-sm border border-gray-100"
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0 shadow-inner">
            <span className="text-gray-500 text-lg font-semibold">
              {name.charAt(0)}
            </span>
          </div>
        )
      ) : (
        // iMessage 스타일: 이니셜 원형 아바타
        settings.theme === 'imessage' && (
          <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-medium">
              {name.charAt(0)}
            </span>
          </div>
        )
      )}

      <div className="flex-1 min-w-0">
        <p className={`font-semibold truncate transition-colors ${isSelected ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'}`}>
          {name}
        </p>
        {themeConfig.contactList.showStatusMessage && statusMessage && (
          <p className="text-xs text-gray-500 truncate mt-0.5 font-medium">{statusMessage}</p>
        )}
      </div>
    </button>
  );
}

interface ContactListProps {
  onAddCharacter: () => void;
}

export function ContactList({ onAddCharacter }: ContactListProps) {
  const { settings } = useSettingsStore();
  const { characters } = useCharacterStore();
  const { currentChatId, createChat, setCurrentChat, getChatByCharacter } = useChatStore();

  const themeConfig = getThemeConfig(settings.theme);

  const handleSelectCharacter = (characterId: string) => {
    const existingChat = getChatByCharacter(characterId);
    if (existingChat) {
      setCurrentChat(existingChat.id);
    } else {
      createChat(characterId);
    }
  };

  const getSelectedCharacterId = () => {
    if (!currentChatId) return null;
    const chat = useChatStore.getState().chats.find((c) => c.id === currentChatId);
    return chat?.characterId || null;
  };

  const selectedCharacterId = getSelectedCharacterId();

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-6 py-5">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Chats</h1>
        <button
          onClick={onAddCharacter}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-200/50 text-gray-400 hover:text-gray-900 transition-all duration-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* 연락처 목록 */}
      <div className={`flex-1 overflow-y-auto ${themeConfig.contactList.style} px-0`}>
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4">
            <p className="text-sm mb-3 font-medium">대화할 캐릭터가 없습니다</p>
            <button
              onClick={onAddCharacter}
              className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
            >
              캐릭터 추가하기
            </button>
          </div>
        ) : (
          characters.map((character) => (
            <ContactItem
              key={character.id}
              character={character}
              isSelected={character.id === selectedCharacterId}
              onClick={() => handleSelectCharacter(character.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
