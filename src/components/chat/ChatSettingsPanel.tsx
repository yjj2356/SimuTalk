import { useChatStore, useCharacterStore, useSettingsStore, useUserStore } from '@/stores';
import { callAI, buildFirstMessagePrompt } from '@/services/aiService';

interface ChatSettingsPanelProps {
  chatId: string;
  compact?: boolean;
  panelTextColor?: string;
  accentColor?: string;
}

export function ChatSettingsPanel({ 
  chatId, 
  compact = false, 
  panelTextColor = '#1d1d1f',
  accentColor = '#1d1d1f'
}: ChatSettingsPanelProps) {
  const { getChat, setShortResponseMode, addMessage, generatingChatId, setGenerating } = useChatStore();
  const { getCharacter } = useCharacterStore();
  const { getCurrentUserProfile } = useUserStore();
  const { settings } = useSettingsStore();
  
  const chat = getChat(chatId);
  const character = chat ? getCharacter(chat.characterId) : undefined;
  const userProfile = getCurrentUserProfile();
  const isGenerating = generatingChatId === chatId;

  if (!chat || !character) return null;

  const shortResponseMode = chat.shortResponseMode ?? false;
  const characterName = character.fieldProfile?.name || character.freeProfileName || '캐릭터';

  // 선톡 보내기 핸들러
  const handleSendFirstMessage = async () => {
    if (isGenerating) return;
    
    setGenerating(chatId);

    try {
      const currentTime = new Date().toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      const outputLanguage = chat.outputLanguage || 'korean';
      const prompt = buildFirstMessagePrompt(
        character,
        userProfile,
        chat.messages,
        outputLanguage,
        currentTime,
        chat.theme,
        chat.shortResponseMode
      );

      const response = await callAI(
        prompt,
        settings.responseModel,
        settings.geminiApiKey,
        settings.openaiApiKey,
        undefined,
        settings.gptFlexTier
      );

      if (!response.error && response.content) {
        addMessage(chatId, {
          chatId,
          senderId: character.id,
          content: response.content,
        });
      } else if (response.error) {
        alert(`선톡 생성 오류: ${response.error}`);
      }
    } catch (error) {
      console.error('First message error:', error);
    }

    setGenerating(null);
  };

  return (
    <div className={compact ? 'space-y-2' : 'space-y-3'}>
      {/* 짧은 응답 모드 토글 */}
      <div className="flex items-center justify-between">
        <div>
          <div 
            className={`font-medium ${compact ? 'text-[11px]' : 'text-[12px]'}`}
            style={{ color: panelTextColor }}
          >
            짧은 응답 모드
          </div>
          <div 
            className={`${compact ? 'text-[9px]' : 'text-[10px]'}`}
            style={{ color: panelTextColor, opacity: 0.5 }}
          >
            최대 3줄로 응답 제한
          </div>
        </div>
        <button
          onClick={() => setShortResponseMode(chatId, !shortResponseMode)}
          className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors"
          style={{
            backgroundColor: shortResponseMode ? accentColor : 'rgba(0,0,0,0.15)',
          }}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              shortResponseMode ? 'translate-x-[18px]' : 'translate-x-[3px]'
            }`}
          />
        </button>
      </div>

      {/* 선톡 버튼 */}
      <div>
        <button
          onClick={handleSendFirstMessage}
          disabled={isGenerating}
          className={`w-full flex items-center justify-center gap-1.5 font-medium rounded-md transition-all disabled:opacity-50 ${
            compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-[12px]'
          }`}
          style={{
            backgroundColor: 'rgba(0,0,0,0.04)',
            color: panelTextColor,
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {isGenerating ? '생성 중...' : `${characterName}의 선톡`}
        </button>
      </div>
    </div>
  );
}
