import { useState } from 'react';
import { useChatStore, useSettingsStore, useCharacterStore, useUserStore } from '@/stores';
import { callAI, buildAutopilotPrompt } from '@/services/aiService';

interface AutopilotControlsProps {
  chatId: string;
}

export function AutopilotControls({ chatId }: AutopilotControlsProps) {
  const [scenario, setScenario] = useState('');
  const { settings } = useSettingsStore();
  const { getChat, setAutopilotScenario, setAutopilotRunning, addMessage } = useChatStore();
  const { getCharacter } = useCharacterStore();
  const { userProfile } = useUserStore();

  const chat = getChat(chatId);
  const character = chat ? getCharacter(chat.characterId) : undefined;

  if (!chat || !character) return null;

  const isRunning = chat.isAutopilotRunning;

  const generateNextMessage = async () => {
    if (!chat.autopilotScenario) {
      alert('시나리오를 먼저 입력해주세요.');
      return;
    }

    // 다음 화자 결정 (번갈아가며)
    const lastMessage = chat.messages[chat.messages.length - 1];
    const nextSpeaker = !lastMessage || lastMessage.senderId !== 'user' ? 'user' : 'character';

    const prompt = buildAutopilotPrompt(
      character,
      userProfile,
      chat.messages,
      chat.autopilotScenario,
      nextSpeaker
    );

    const response = await callAI(
      prompt,
      settings.responseModel,
      settings.geminiApiKey,
      settings.openaiApiKey
    );

    if (!response.error) {
      addMessage(chatId, {
        chatId,
        senderId: nextSpeaker === 'user' ? 'user' : character.id,
        content: response.content,
      });
    } else {
      alert(`오류: ${response.error}`);
    }
  };

  const handlePlay = async () => {
    if (!chat.autopilotScenario && scenario) {
      setAutopilotScenario(chatId, scenario);
    }
    setAutopilotRunning(chatId, true);
    await generateNextMessage();
  };

  const handlePause = () => {
    setAutopilotRunning(chatId, false);
  };

  const handleStep = async () => {
    if (!chat.autopilotScenario && scenario) {
      setAutopilotScenario(chatId, scenario);
    }
    await generateNextMessage();
  };

  return (
    <div className="p-5">
      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">
          Scenario Setup
        </label>
        <textarea
          value={chat.autopilotScenario || scenario}
          onChange={(e) => {
            setScenario(e.target.value);
            if (chat.autopilotScenario) {
              setAutopilotScenario(chatId, e.target.value);
            }
          }}
          placeholder="대화가 진행될 상황을 설명해주세요..."
          rows={2}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5 transition-all duration-200 resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        {isRunning ? (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-200 shadow-sm text-sm font-medium"
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
            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full hover:bg-gray-800 transition-all duration-200 shadow-sm text-sm font-medium"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            자동 진행
          </button>
        )}

        <button
          onClick={handleStep}
          className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 border border-gray-200 rounded-full hover:bg-gray-50 transition-all duration-200 shadow-sm text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
          한 턴 진행
        </button>
      </div>
    </div>
  );
}
