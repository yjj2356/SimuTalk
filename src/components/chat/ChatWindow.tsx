import { useRef, useEffect, useState } from 'react';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { useSettingsStore, useChatStore, useCharacterStore, useUserStore } from '@/stores';
import { getThemeConfig } from '@/utils/theme';
import { callGeminiAPI, callOpenAIAPI, buildCharacterPrompt, buildBranchPrompt, translateText } from '@/services/aiService';

export function ChatWindow() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { settings } = useSettingsStore();
  const { chats, currentChatId, addMessage, updateMessage, addBranch, setBranchIndex } = useChatStore();
  const { getCharacter } = useCharacterStore();
  const { userProfile } = useUserStore();

  const themeConfig = getThemeConfig(settings.theme);
  const currentChat = chats.find((chat) => chat.id === currentChatId);
  const character = currentChat ? getCharacter(currentChat.characterId) : undefined;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const handleSendMessage = async (content: string) => {
    if (!currentChat || !character || isLoading) return;

    setIsLoading(true);

    // 유저 메시지 추가
    const userMsgId = addMessage(currentChat.id, {
      chatId: currentChat.id,
      senderId: 'user',
      content,
    });

    // AI 응답 생성
    const apiKey = settings.defaultAIProvider === 'gemini'
      ? settings.geminiApiKey
      : settings.openaiApiKey;

    const model = settings.defaultAIProvider === 'gemini'
      ? settings.geminiModel
      : settings.openaiModel;

    if (!apiKey) {
      addMessage(currentChat.id, {
        chatId: currentChat.id,
        senderId: character.id,
        content: '⚠️ API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.',
      });
      setIsLoading(false);
      return;
    }

    // 유저 메시지 번역 (외국어 출력 + 번역 설정시)
    if (character.outputLanguage === 'foreign' && character.foreignLanguage && settings.translateUserMessages) {
      const userTranslation = await translateText(
        content,
        character.foreignLanguage,
        apiKey,
        settings.defaultAIProvider,
        model
      );
      if (!userTranslation.error) {
        updateMessage(currentChat.id, userMsgId, { translatedContent: userTranslation.content });
      }
    }

    const prompt = buildCharacterPrompt(
      character,
      userProfile,
      currentChat.messages,
      content
    );

    const response = settings.defaultAIProvider === 'gemini'
      ? await callGeminiAPI(prompt, apiKey, model)
      : await callOpenAIAPI(prompt, apiKey, model);

    if (response.error) {
      addMessage(currentChat.id, {
        chatId: currentChat.id,
        senderId: character.id,
        content: `⚠️ 오류: ${response.error}`,
      });
    } else {
      const charMsgId = addMessage(currentChat.id, {
        chatId: currentChat.id,
        senderId: character.id,
        content: response.content,
      });

      // 캐릭터 응답 번역 (외국어 출력시 한국어로 번역)
      if (character.outputLanguage === 'foreign' && character.foreignLanguage) {
        const charTranslation = await translateText(
          response.content,
          '한국어',
          apiKey,
          settings.defaultAIProvider,
          model
        );
        if (!charTranslation.error) {
          updateMessage(currentChat.id, charMsgId, { translatedContent: charTranslation.content });
        }
      }
    }

    setIsLoading(false);
  };

  // 분기 생성 핸들러
  const handleGenerateBranch = async (messageId: string, messageIndex: number) => {
    if (!currentChat || !character || isLoading) return;

    const apiKey = settings.defaultAIProvider === 'gemini'
      ? settings.geminiApiKey
      : settings.openaiApiKey;

    const model = settings.defaultAIProvider === 'gemini'
      ? settings.geminiModel
      : settings.openaiModel;

    if (!apiKey) {
      alert('API 키가 설정되지 않았습니다.');
      return;
    }

    setIsLoading(true);

    const message = currentChat.messages[messageIndex];
    const existingBranches = [message.content, ...(message.branches?.map(b => b.content) || [])];

    const prompt = buildBranchPrompt(
      character,
      userProfile,
      currentChat.messages,
      messageIndex,
      existingBranches
    );

    const response = settings.defaultAIProvider === 'gemini'
      ? await callGeminiAPI(prompt, apiKey, model)
      : await callOpenAIAPI(prompt, apiKey, model);

    if (!response.error && response.content) {
      let translatedContent: string | undefined;

      // 외국어 출력시 번역
      if (character.outputLanguage === 'foreign' && character.foreignLanguage) {
        const translation = await translateText(
          response.content,
          '한국어',
          apiKey,
          settings.defaultAIProvider,
          model
        );
        if (!translation.error) {
          translatedContent = translation.content;
        }
      }

      addBranch(currentChat.id, messageId, {
        content: response.content,
        translatedContent,
      });

      // 새로 생성된 분기로 이동
      const newIndex = (message.branches?.length || 0) + 1;
      setBranchIndex(currentChat.id, messageId, newIndex);
    }

    setIsLoading(false);
  };

  if (!currentChat || !character) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#F5F5F7]">
        <div className="text-center">
          <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No Chat Selected</h3>
          <p className="text-sm text-gray-500">Select a character from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#F5F5F7] relative">
      {/* 채팅방 헤더 */}
      <div className="flex items-center gap-4 px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-10">
        {themeConfig.showProfilePicture && (
          <div className="relative">
            {character.fieldProfile?.profileImage ? (
              <img
                src={character.fieldProfile.profileImage}
                alt=""
                className="w-10 h-10 rounded-xl object-cover shadow-sm border border-gray-100"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
                <span className="text-gray-500 font-semibold">
                  {character.fieldProfile?.name?.charAt(0) || '?'}
                </span>
              </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${currentChat.mode === 'autopilot' ? 'bg-purple-500' : 'bg-green-500'}`}></div>
          </div>
        )}
        <div>
          <h2 className="font-bold text-gray-900 leading-tight">
            {character.fieldProfile?.name || character.freeProfile?.slice(0, 20) || '캐릭터'}
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className="text-xs font-medium text-gray-500">
              {currentChat.mode === 'autopilot' ? 'Autopilot Mode' : 'Immersion Mode'}
            </p>
          </div>
        </div>
      </div>

      {/* 메시지 영역 */}
      <div className={`flex-1 overflow-y-auto p-4 ${themeConfig.background}`}>
        {currentChat.messages.map((message, index) => (
          <ChatBubble
            key={message.id}
            content={message.content}
            isUser={message.senderId === 'user'}
            character={character}
            translatedContent={message.translatedContent}
            timestamp={message.timestamp}
            branches={message.branches}
            currentBranchIndex={message.currentBranchIndex}
            onBranchChange={(branchIndex) => setBranchIndex(currentChat.id, message.id, branchIndex)}
            onGenerateBranch={() => handleGenerateBranch(message.id, index)}
          />
        ))}
        {isLoading && (
          <div className="flex justify-center py-4">
            <div className="animate-pulse text-gray-500">응답 생성 중...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 (몰입 모드일 때만) */}
      {currentChat.mode === 'immersion' && (
        <ChatInput onSend={handleSendMessage} disabled={isLoading} />
      )}
    </div>
  );
}
