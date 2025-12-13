import { useChatStore, useSettingsStore, useCharacterStore, useUserStore } from '@/stores';
import { callAI, buildAutopilotPrompt, parseAutopilotResponse, cancelCurrentRequest } from '@/services/aiService';

interface AutopilotControlsProps {
  chatId: string;
  compact?: boolean; // 창 모드용 컴팩트 스타일
}

export function AutopilotControls({ chatId, compact = false }: AutopilotControlsProps) {
  const { settings } = useSettingsStore();
  const { getChat, setAutopilotScenario, setAutopilotRunning, addMessage, generatingChatId, setGenerating } = useChatStore();
  const { getCharacter } = useCharacterStore();
  const { getCurrentUserProfile } = useUserStore();

  const chat = getChat(chatId);
  const character = chat ? getCharacter(chat.characterId) : undefined;
  const userProfile = getCurrentUserProfile();
  const isGenerating = generatingChatId === chatId;

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

    setGenerating(chatId);

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
      settings.openaiApiKey,
      undefined,
      settings.gptFlexTier
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
    
    setGenerating(null);
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

  const handleCancel = () => {
    cancelCurrentRequest();
    setGenerating(null);
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
    <div className={compact ? 'space-y-2' : 'p-4'}>
      <div className={compact ? 'mb-2' : 'mb-3'}>
        {!compact && (
          <div className="flex items-center text-[10px] font-semibold text-[#8e8e93] mb-2 uppercase tracking-wider">
            Scenario
          </div>
        )}
        <textarea
          value={chat.autopilotScenario || ''}
          onChange={(e) => handleScenarioChange(e.target.value)}
          placeholder="대화가 진행될 상황을 설명해주세요..."
          rows={compact ? 1 : 2}
          className={`w-full rounded-md border border-black/[0.08] bg-black/[0.02] focus:outline-none focus:bg-white focus:border-[#0071e3] transition-all resize-none ${
            compact ? 'px-2.5 py-1.5 text-[11px]' : 'px-3 py-2 text-[12px]'
          }`}
        />
      </div>

      <div className={`flex items-center ${compact ? 'gap-1.5' : 'gap-2'}`}>
        {isGenerating ? (
          <button
            onClick={handleCancel}
            className={`glossy-btn flex items-center gap-1.5 text-red-600 font-medium ${
              compact ? 'px-2.5 py-1 text-[11px] rounded-md' : 'px-3 py-1.5 text-[12px] rounded-md'
            }`}
          >
            <svg className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="1" />
            </svg>
            취소
          </button>
        ) : isRunning ? (
          <button
            onClick={handlePause}
            className={`glossy-btn glossy-btn-active flex items-center gap-1.5 font-medium ${
              compact ? 'px-2.5 py-1 text-[11px] rounded-md' : 'px-3 py-1.5 text-[12px] rounded-md'
            }`}
          >
            <svg className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
            일시정지
          </button>
        ) : (
          <button
            onClick={handlePlay}
            className={`glossy-btn glossy-btn-active flex items-center gap-1.5 font-medium ${
              compact ? 'px-2.5 py-1 text-[11px] rounded-md' : 'px-3 py-1.5 text-[12px] rounded-md'
            }`}
          >
            <svg className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            시작
          </button>
        )}

        <button
          onClick={handleStep}
          disabled={isGenerating}
          className={`glossy-btn flex items-center gap-1.5 text-[#1d1d1f] font-medium disabled:opacity-50 ${
            compact ? 'px-2.5 py-1 text-[11px] rounded-md' : 'px-3 py-1.5 text-[12px] rounded-md'
          }`}
        >
          <svg className={compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
          다음
        </button>
      </div>
    </div>
  );
}
