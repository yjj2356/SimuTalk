import { useRef, useEffect, useState, useCallback } from 'react';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { AutopilotControls } from './AutopilotControls';
import { TimeControls } from './TimeControls';
import { useSettingsStore, useChatStore, useCharacterStore, useUserStore, useStickerStore } from '@/stores';
import { getThemeConfig } from '@/utils/theme';
import { OutputLanguage, Sticker } from '@/types';
import { StickerManager } from '@/components/sticker';
import { 
  callAI, 
  buildCharacterPrompt, 
  buildBranchPrompt, 
  translateText,
  callGeminiAPIStreaming,
  getProviderFromModel,
  cancelCurrentRequest,
} from '@/services/aiService';

// 출력 언어 -> 언어명 매핑
const languageNames: Record<OutputLanguage, string> = {
  korean: '한국어',
  english: 'English',
  japanese: '日本語',
  chinese: '中文',
};

interface PopoutChatWindowProps {
  chatId: string;
  onClose: () => void;
}

export function PopoutChatWindow({ chatId, onClose }: PopoutChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showStickerManager, setShowStickerManager] = useState(false);
  const { settings } = useSettingsStore();
  const { 
    chats, 
    addMessage, 
    updateMessage, 
    updateBranchTranslation,
    addBranch, 
    setBranchIndex, 
    generatingChatId, 
    setGenerating, 
    setChatMode 
  } = useChatStore();
  const { getCharacter } = useCharacterStore();
  const { getCurrentUserProfile } = useUserStore();
  const { stickers } = useStickerStore();

  const currentChat = chats.find((chat) => chat.id === chatId);
  const themeConfig = currentChat ? getThemeConfig(currentChat.theme) : getThemeConfig('basic');
  const character = currentChat ? getCharacter(currentChat.characterId) : undefined;
  const userProfile = getCurrentUserProfile();
  
  const isLoading = generatingChatId === chatId;

  // 응답 생성 취소
  const handleCancelGeneration = useCallback(() => {
    cancelCurrentRequest();
    setGenerating(null);
  }, [setGenerating]);

  // 채팅방별 시간 계산 함수
  const getCurrentChatTime = useCallback((): Date => {
    const timeSettings = currentChat?.timeSettings;
    if (!timeSettings || timeSettings.mode === 'realtime') {
      return new Date();
    }
    const elapsed = Date.now() - (timeSettings.startedAt || Date.now());
    return new Date((timeSettings.customBaseTime || Date.now()) + elapsed);
  }, [currentChat?.timeSettings]);

  // 메시지 타임스탬프 포맷
  const formatMessageTime = useCallback((messageTimestamp: number) => {
    const timeSettings = currentChat?.timeSettings;
    
    if (!timeSettings || timeSettings.mode === 'realtime') {
      const date = new Date(messageTimestamp);
      return date.toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    
    const currentAppTime = getCurrentChatTime();
    const now = Date.now();
    const messageAge = now - messageTimestamp;
    const adjustedTime = new Date(currentAppTime.getTime() - messageAge);
    
    return adjustedTime.toLocaleTimeString('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, [currentChat?.timeSettings, getCurrentChatTime]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 마지막 캐릭터 메시지 ID 찾기
  const getLastCharacterMessageId = () => {
    if (!currentChat || !character) return null;
    for (let i = currentChat.messages.length - 1; i >= 0; i--) {
      if (currentChat.messages[i].senderId === character.id) {
        return currentChat.messages[i].id;
      }
    }
    return null;
  };

  const lastCharacterMessageId = getLastCharacterMessageId();

  // 메시지 번역 핸들러
  const handleTranslateMessage = async (messageId: string) => {
    if (!currentChat || isTranslating) return;

    const message = currentChat.messages.find(m => m.id === messageId);
    if (!message) return;

    setIsTranslating(true);

    const currentBranchIndex = message.currentBranchIndex || 0;
    const contentToTranslate = currentBranchIndex === 0
      ? message.content
      : message.branches?.[currentBranchIndex - 1]?.content || message.content;

    const translation = await translateText(
      contentToTranslate,
      '한국어',
      settings.translationModel,
      settings.geminiApiKey,
      settings.openaiApiKey
    );

    if (!translation.error) {
      if (currentBranchIndex === 0) {
        updateMessage(chatId, messageId, { translatedContent: translation.content });
      } else {
        updateBranchTranslation(chatId, messageId, currentBranchIndex - 1, translation.content);
      }
    } else {
      alert(`번역 오류: ${translation.error}`);
    }

    setIsTranslating(false);
  };

  // 번역 리롤 핸들러
  const handleRetranslateMessage = async (messageId: string) => {
    if (!currentChat || isTranslating) return;

    const message = currentChat.messages.find(m => m.id === messageId);
    if (!message) return;

    setIsTranslating(true);

    const currentBranchIndex = message.currentBranchIndex || 0;
    const contentToTranslate = currentBranchIndex === 0
      ? message.content
      : message.branches?.[currentBranchIndex - 1]?.content || message.content;

    if (currentBranchIndex === 0) {
      updateMessage(chatId, messageId, { translatedContent: undefined });
    } else {
      updateBranchTranslation(chatId, messageId, currentBranchIndex - 1, undefined);
    }

    const translation = await translateText(
      contentToTranslate,
      '한국어',
      settings.translationModel,
      settings.geminiApiKey,
      settings.openaiApiKey
    );

    if (!translation.error) {
      if (currentBranchIndex === 0) {
        updateMessage(chatId, messageId, { translatedContent: translation.content });
      } else {
        updateBranchTranslation(chatId, messageId, currentBranchIndex - 1, translation.content);
      }
    } else {
      alert(`번역 오류: ${translation.error}`);
    }

    setIsTranslating(false);
  };

  // 분기 생성 핸들러
  const handleGenerateBranch = async (messageId: string, messageIndex: number) => {
    if (!currentChat || !character || isLoading) return;

    setGenerating(chatId);

    const message = currentChat.messages[messageIndex];
    const existingBranches = [message.content, ...(message.branches?.map(b => b.content) || [])];

    const scenario = currentChat.mode === 'autopilot' ? currentChat.autopilotScenario : undefined;

    const prompt = buildBranchPrompt(
      character,
      userProfile,
      currentChat.messages,
      messageIndex,
      existingBranches,
      currentChat.outputLanguage || 'korean',
      scenario
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
      addBranch(chatId, messageId, {
        content: response.content,
      });

      const newIndex = (message.branches?.length || 0) + 1;
      setBranchIndex(chatId, messageId, newIndex);
    } else if (response.error) {
      alert(`분기 생성 오류: ${response.error}`);
    }

    setGenerating(null);
  };

  // 스티커 전송 핸들러
  const handleSendSticker = async (sticker: Sticker) => {
    if (!currentChat || !character || isLoading) return;

    setGenerating(chatId);

    const stickerContextText = `[[${sticker.description}] 이모티콘을 사용자가 보냄]`;
    
    addMessage(chatId, {
      chatId,
      senderId: 'user',
      content: stickerContextText,
      imageData: sticker.imageData,
      imageMimeType: sticker.mimeType,
      isSticker: true,
    });

    const currentAppTime = getCurrentChatTime();
    const currentTimeString = currentAppTime.toLocaleTimeString('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const outputLanguage = currentChat.outputLanguage || 'korean';
    
    const availableStickers = stickers.filter(s => s.isCharacterUsable);
    const stickerListForAI = availableStickers.length > 0
      ? `\n\n사용 가능한 이모티콘: ${availableStickers.map(s => `[${s.name}: ${s.description}]`).join(', ')}\n원한다면 [[이모티콘이름]] 형식으로 이모티콘을 사용할 수 있습니다.`
      : '';

    const prompt = buildCharacterPrompt(
      character,
      userProfile,
      currentChat.messages,
      stickerContextText + stickerListForAI,
      outputLanguage,
      currentTimeString,
      currentChat.theme,
      currentChat.memorySummaries
    );

    const provider = getProviderFromModel(settings.responseModel);
    
    if (provider === 'gemini' && settings.geminiApiKey) {
      const response = await callGeminiAPIStreaming(
        prompt,
        settings.geminiApiKey,
        settings.responseModel,
        undefined
      );

      if (!response.content && !response.error) {
        setGenerating(null);
        return;
      }

      if (!response.error && response.content) {
        addMessage(chatId, {
          chatId,
          senderId: character.id,
          content: response.content,
        });
      } else if (response.error) {
        addMessage(chatId, {
          chatId,
          senderId: character.id,
          content: `오류가 발생했습니다: ${response.error}`,
        });
      }
    } else {
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
        addMessage(chatId, {
          chatId,
          senderId: character.id,
          content: `오류가 발생했습니다: ${response.error}`,
        });
      }
    }

    setGenerating(null);
  };

  // 메시지 전송 핸들러
  const handleSendMessage = async (content: string, imageData?: { data: string; mimeType: string }) => {
    if (!currentChat || !character || isLoading) return;

    // /t 명령어 처리
    if (content.startsWith('/t ')) {
      const textToTranslate = content.slice(3);
      if (!textToTranslate.trim()) return;

      setGenerating(chatId);

      const chatOutputLanguage = currentChat.outputLanguage || 'korean';
      const targetLanguage = languageNames[chatOutputLanguage] || chatOutputLanguage;
      const translation = await translateText(
        textToTranslate,
        targetLanguage,
        settings.translationModel,
        settings.geminiApiKey,
        settings.openaiApiKey
      );

      if (!translation.error) {
        addMessage(chatId, {
          chatId,
          senderId: 'user',
          content: translation.content,
          translatedContent: textToTranslate,
          imageData: imageData?.data,
          imageMimeType: imageData?.mimeType,
        });

        // AI 응답 생성
        const currentAppTime = getCurrentChatTime();
        const currentTimeString = currentAppTime.toLocaleTimeString('ko-KR', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        });

        const outputLanguage = currentChat.outputLanguage || 'korean';
        const prompt = buildCharacterPrompt(
          character,
          userProfile,
          currentChat.messages,
          translation.content,
          outputLanguage,
          currentTimeString,
          currentChat.theme,
          currentChat.memorySummaries
        );

        const provider = getProviderFromModel(settings.responseModel);
        
        if (provider === 'gemini' && settings.geminiApiKey) {
          const response = await callGeminiAPIStreaming(
            prompt,
            settings.geminiApiKey,
            settings.responseModel,
            undefined
          );

          if (!response.content && !response.error) {
            setGenerating(null);
            return;
          }

          if (response.error) {
            addMessage(chatId, {
              chatId,
              senderId: character.id,
              content: `⚠️ 오류: ${response.error}`,
            });
          } else {
            addMessage(chatId, {
              chatId,
              senderId: character.id,
              content: response.content,
            });
          }
        } else {
          const response = await callAI(
            prompt,
            settings.responseModel,
            settings.geminiApiKey,
            settings.openaiApiKey,
            undefined,
            settings.gptFlexTier
          );

          if (!response.content && !response.error) {
            setGenerating(null);
            return;
          }

          if (response.error) {
            addMessage(chatId, {
              chatId,
              senderId: character.id,
              content: `⚠️ 오류: ${response.error}`,
            });
          } else {
            addMessage(chatId, {
              chatId,
              senderId: character.id,
              content: response.content,
            });
          }
        }

        setGenerating(null);
        return;
      } else {
        alert(`번역 오류: ${translation.error}`);
        setGenerating(null);
        return;
      }
    }

    setGenerating(chatId);

    // 유저 메시지 추가
    addMessage(chatId, {
      chatId,
      senderId: 'user',
      content,
      imageData: imageData?.data,
      imageMimeType: imageData?.mimeType,
    });

    // AI 응답 생성
    const currentAppTime = getCurrentChatTime();
    const currentTimeString = currentAppTime.toLocaleTimeString('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const outputLanguage = currentChat.outputLanguage || 'korean';

    const prompt = buildCharacterPrompt(
      character,
      userProfile,
      currentChat.messages,
      content,
      outputLanguage,
      currentTimeString,
      currentChat.theme,
      currentChat.memorySummaries
    );

    const finalPrompt = imageData 
      ? `${prompt}\n\n[IMPORTANT: The user has sent an image along with this message. You MUST look at and acknowledge the image in your response. Describe what you see in the image or react to it naturally as the character would.]`
      : prompt;

    const provider = getProviderFromModel(settings.responseModel);
    
    if (provider === 'gemini' && settings.geminiApiKey) {
      const response = await callGeminiAPIStreaming(
        finalPrompt,
        settings.geminiApiKey,
        settings.responseModel,
        imageData ? { data: imageData.data, mimeType: imageData.mimeType } : undefined
      );

      if (!response.content && !response.error) {
        setGenerating(null);
        return;
      }

      if (response.error) {
        addMessage(chatId, {
          chatId,
          senderId: character.id,
          content: `⚠️ 오류: ${response.error}`,
        });
      } else {
        addMessage(chatId, {
          chatId,
          senderId: character.id,
          content: response.content,
        });
      }
    } else {
      const response = await callAI(
        finalPrompt,
        settings.responseModel,
        settings.geminiApiKey,
        settings.openaiApiKey,
        imageData ? { data: imageData.data, mimeType: imageData.mimeType } : undefined,
        settings.gptFlexTier
      );

      if (!response.content && !response.error) {
        setGenerating(null);
        return;
      }

      if (response.error) {
        addMessage(chatId, {
          chatId,
          senderId: character.id,
          content: `⚠️ 오류: ${response.error}`,
        });
      } else {
        addMessage(chatId, {
          chatId,
          senderId: character.id,
          content: response.content,
        });
      }
    }

    setGenerating(null);
  };

  // 메시지 수정 핸들러
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!currentChat || !character || isLoading) return;
    
    updateMessage(chatId, messageId, { content: newContent });
    
    const messageIndex = currentChat.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    const nextMessage = currentChat.messages[messageIndex + 1];
    if (nextMessage && nextMessage.senderId === character.id) {
      setGenerating(chatId);
      
      const messagesUpToEdit = currentChat.messages.slice(0, messageIndex);
      const currentAppTime = getCurrentChatTime();
      const currentTimeString = currentAppTime.toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      
      const outputLanguage = currentChat.outputLanguage || 'korean';
      
      const prompt = buildCharacterPrompt(
        character,
        userProfile,
        messagesUpToEdit,
        newContent,
        outputLanguage,
        currentTimeString,
        currentChat.theme,
        currentChat.memorySummaries
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
        addBranch(chatId, nextMessage.id, {
          content: response.content,
        });
        
        const newIndex = (nextMessage.branches?.length || 0) + 1;
        setBranchIndex(chatId, nextMessage.id, newIndex);
      }
      
      setGenerating(null);
    }
  };

  if (!currentChat || !character) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <p className="text-gray-500">채팅을 찾을 수 없습니다</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    );
  }

  const characterName = character.inputMode === 'field' 
    ? character.fieldProfile?.name 
    : character.freeProfileName || '캐릭터';
  const characterImage = character.inputMode === 'field'
    ? character.fieldProfile?.profileImage
    : character.freeProfileImage;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg h-full max-h-[900px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* 상단 헤더 */}
        <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${
          currentChat.theme === 'kakao' ? 'bg-kakao-bg border-yellow-200' :
          currentChat.theme === 'line' ? 'bg-line-bg border-green-200' :
          currentChat.theme === 'imessage' ? 'bg-imessage-bg border-gray-200' :
          'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            {characterImage ? (
              <img src={characterImage} alt={characterName} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-medium">
                {characterName?.charAt(0)}
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-900">{characterName}</h3>
              <p className="text-xs text-gray-500">
                {currentChat.mode === 'autopilot' ? '자동진행 모드' : '직접 모드'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowControls(!showControls)}
              className={`p-2 rounded-full transition-colors ${
                showControls ? 'bg-gray-200 text-gray-700' : 'text-gray-400 hover:text-gray-600'
              }`}
              title={showControls ? '컨트롤 숨기기' : '컨트롤 보기'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>
            
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              title="창 닫기 (ESC)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 컨트롤 패널 */}
        {showControls && (
          <div className={`px-4 py-3 border-b space-y-3 shrink-0 ${
            currentChat.theme === 'kakao' ? 'bg-yellow-50/50 border-yellow-100' :
            currentChat.theme === 'line' ? 'bg-green-50/50 border-green-100' :
            'bg-gray-50 border-gray-100'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">모드</span>
              <div className="bg-white p-0.5 rounded-full flex items-center shadow-sm border border-gray-200">
                <button
                  onClick={() => setChatMode(chatId, 'immersion')}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                    currentChat.mode === 'immersion'
                      ? 'bg-black text-white'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  직접
                </button>
                <button
                  onClick={() => setChatMode(chatId, 'autopilot')}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-all duration-200 ${
                    currentChat.mode === 'autopilot'
                      ? 'bg-black text-white'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  자동진행
                </button>
              </div>
            </div>

            {currentChat.mode === 'autopilot' && (
              <AutopilotControls chatId={chatId} compact />
            )}

            <TimeControls chatId={chatId} compact />
          </div>
        )}

        {/* 채팅 메시지 영역 */}
        <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${themeConfig.background}`}>
          {currentChat.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p className="text-sm">대화를 시작해보세요</p>
            </div>
          ) : (
            currentChat.messages.map((message, index) => {
              const isFirstInGroup = index === 0 || 
                currentChat.messages[index - 1].senderId !== message.senderId;
              const isLastCharMessage = message.id === lastCharacterMessageId;
              
              return (
                <ChatBubble
                  key={message.id}
                  content={message.content}
                  isUser={message.senderId === 'user'}
                  character={character}
                  translatedContent={message.translatedContent}
                  timestamp={message.timestamp}
                  branches={message.branches}
                  currentBranchIndex={message.currentBranchIndex}
                  onBranchChange={message.branches && message.branches.length > 0 
                    ? (idx) => setBranchIndex(chatId, message.id, idx)
                    : undefined
                  }
                  onGenerateBranch={
                    message.senderId !== 'user' && isLastCharMessage
                      ? () => handleGenerateBranch(message.id, index)
                      : undefined
                  }
                  isLastCharacterMessage={isLastCharMessage}
                  onTranslate={message.senderId !== 'user' && !message.translatedContent ? () => handleTranslateMessage(message.id) : undefined}
                  onRetranslate={message.senderId !== 'user' && message.translatedContent ? () => handleRetranslateMessage(message.id) : undefined}
                  isTranslating={isTranslating}
                  isFirstInGroup={isFirstInGroup}
                  showTime={true}
                  theme={currentChat.theme}
                  onEdit={message.senderId === 'user' ? (newContent) => handleEditMessage(message.id, newContent) : undefined}
                  formatTimeFunc={formatMessageTime}
                  imageData={message.imageData}
                  imageMimeType={message.imageMimeType}
                  isSticker={message.isSticker}
                />
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력 영역 */}
        {currentChat.mode === 'immersion' ? (
          <div className="shrink-0 border-t border-gray-200">
            {isLoading ? (
              <div className="px-4 py-3 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-500 text-sm">
                  <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                  <span>응답 생성 중...</span>
                </div>
                <button
                  onClick={handleCancelGeneration}
                  className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                >
                  취소
                </button>
              </div>
            ) : (
              <ChatInput
                onSend={handleSendMessage}
                theme={currentChat.theme}
                disabled={isLoading}
                onSendSticker={handleSendSticker}
                onOpenStickerManager={() => setShowStickerManager(true)}
              />
            )}
          </div>
        ) : (
          isLoading && (
            <div className="shrink-0 border-t border-gray-200 px-4 py-3 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
                <span>응답 생성 중...</span>
              </div>
              <button
                onClick={handleCancelGeneration}
                className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          )
        )}

        {/* 스티커 관리 모달 - overflow-hidden 밖에 위치 */}
      </div>
      
      {showStickerManager && (
        <StickerManager onClose={() => setShowStickerManager(false)} />
      )}
    </div>
  );
}
