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
      className={`w-full flex items-center gap-3 p-3 hover:bg-gray-100 transition-colors text-left ${
        isSelected ? 'bg-blue-50' : ''
      }`}
    >
      {/* 프로필 이미지 */}
      {themeConfig.contactList.showProfilePicture ? (
        character.fieldProfile?.profileImage ? (
          <img
            src={character.fieldProfile.profileImage}
            alt={name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
            <span className="text-gray-600 text-lg font-medium">
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
        <p className="font-medium truncate">{name}</p>
        {themeConfig.contactList.showStatusMessage && statusMessage && (
          <p className="text-sm text-gray-500 truncate">{statusMessage}</p>
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
    <div className="flex flex-col h-full bg-white">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h1 className="text-lg font-bold">연락처</h1>
        <button
          onClick={onAddCharacter}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* 연락처 목록 */}
      <div className={`flex-1 overflow-y-auto ${themeConfig.contactList.style}`}>
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
            <p className="text-sm mb-2">등록된 캐릭터가 없습니다</p>
            <button
              onClick={onAddCharacter}
              className="text-blue-500 hover:underline text-sm"
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
