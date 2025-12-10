import { useState } from 'react';
import { useChatStore, useSettingsStore, useCharacterStore, useUserStore } from '@/stores';
import { callGeminiAPI, callOpenAIAPI, buildAutopilotPrompt } from '@/services/aiService';

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

    const apiKey = settings.defaultAIProvider === 'gemini'
      ? settings.geminiApiKey
      : settings.openaiApiKey;

    if (!apiKey) {
      alert('API 키가 설정되지 않았습니다.');
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

    const response = settings.defaultAIProvider === 'gemini'
      ? await callGeminiAPI(prompt, apiKey)
      : await callOpenAIAPI(prompt, apiKey);

    if (!response.error) {
      addMessage(chatId, {
        chatId,
        senderId: nextSpeaker === 'user' ? 'user' : character.id,
        content: response.content,
      });
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
    <div className="bg-purple-50 border-b p-4">
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          시나리오 / 상황 설정
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
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-purple-500"
        />
      </div>

      <div className="flex items-center gap-2">
        {isRunning ? (
          <button
            onClick={handlePause}
            className="flex items-center gap-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
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
            className="flex items-center gap-1 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            자동 진행
          </button>
        )}

        <button
          onClick={handleStep}
          className="flex items-center gap-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
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
