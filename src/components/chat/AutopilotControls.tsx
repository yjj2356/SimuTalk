import { useState } from 'react';
import { useChatStore, useSettingsStore, useCharacterStore, useUserStore } from '@/stores';
import { callAI, buildAutopilotPrompt, parseAutopilotResponse } from '@/services/aiService';

interface AutopilotControlsProps {
  chatId: string;
}

export function AutopilotControls({ chatId }: AutopilotControlsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { settings } = useSettingsStore();
  const { getChat, setAutopilotScenario, setAutopilotRunning, addMessage } = useChatStore();
  const { getCharacter } = useCharacterStore();
  const { getCurrentUserProfile } = useUserStore();

  const chat = getChat(chatId);
  const character = chat ? getCharacter(chat.characterId) : undefined;
  const userProfile = getCurrentUserProfile();

  if (!chat || !character) return null;

  const isRunning = chat.isAutopilotRunning;
  const userName = userProfile.fieldProfile?.name || '유저';
  const characterName = character.fieldProfile?.name || character.freeProfileName || '캐릭터';

  // 채팅방별 시간 계산 함수
  const getCurrentChatTime = (): Date => {
    const timeSettings = chat?.timeSettings;
    if (!timeSettings || timeSettings.mode === 'realtime') {
      return new Date();
    }
    const elapsed = Date.now() - (timeSettings.startedAt || Date.now());
    return new Date((timeSettings.customBaseTime || Date.now()) + elapsed);
  };

  const generateNextMessage = async (currentScenario: string) => {
    if (!currentScenario.trim()) {
      alert('시나리오를 먼저 입력해주세요.');
      return;
    }

    setIsGenerating(true);

    // 현재 시간 가져오기 (채팅방별 시간 설정 사용)
    const currentAppTime = getCurrentChatTime();
    const currentTimeString = currentAppTime.toLocaleTimeString('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const prompt = buildAutopilotPrompt(
      character,
      userProfile,
      chat.messages,
      currentScenario,
      settings.outputLanguage,
      currentTimeString,
      chat.theme
    );

    const response = await callAI(
      prompt,
      settings.responseModel,
      settings.geminiApiKey,
      settings.openaiApiKey
    );

    if (!response.error) {
      // AI 응답에서 화자와 내용 파싱
      const parsed = parseAutopilotResponse(response.content, userName, characterName);
      
      addMessage(chatId, {
        chatId,
        senderId: parsed.isUser ? 'user' : character.id,
        content: parsed.content,
      });
    } else {
      alert(`오류: ${response.error}`);
    }
    
    setIsGenerating(false);
  };

  const handlePlay = async () => {
    if (isGenerating) return;
    
    const currentScenario = chat.autopilotScenario || '';
    
    if (!currentScenario.trim()) {
      alert('시나리오를 먼저 입력해주세요.');
      return;
    }
    
    setAutopilotRunning(chatId, true);
    await generateNextMessage(currentScenario);
  };

  const handlePause = () => {
    setAutopilotRunning(chatId, false);
  };

  const handleStep = async () => {
    if (isGenerating) return;
    
    const currentScenario = chat.autopilotScenario || '';
    
    if (!currentScenario.trim()) {
      alert('시나리오를 먼저 입력해주세요.');
      return;
    }
    
    await generateNextMessage(currentScenario);
  };

  const handleScenarioChange = (value: string) => {
    setAutopilotScenario(chatId, value);
  };

  return (
    <div className="p-5">
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
          Scenario Setup
        </label>
        <textarea
          value={chat.autopilotScenario || ''}
          onChange={(e) => handleScenarioChange(e.target.value)}
          placeholder="대화가 진행될 상황을 설명해주세요..."
          rows={2}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-200 resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        {isRunning ? (
          <button
            onClick={handlePause}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-200 shadow-sm text-sm font-medium disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
            일시정지
          </button>
        ) : (
          <button
            onClick={handlePlay}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-200 shadow-sm text-sm font-medium disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                생성 중...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                시작
              </>
            )}
          </button>
        )}

        <button
          onClick={handleStep}
          disabled={isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-full hover:bg-gray-50 transition-all duration-200 shadow-sm text-sm font-medium disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              생성 중...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
              다음
            </>
          )}
        </button>
      </div>
    </div>
  );
}
