import { useEffect, useState, useRef, useCallback } from 'react';
import { TitleBar } from './TitleBar';
import { ChatBubble } from '@/components/chat/ChatBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChatStore, useCharacterStore, useSettingsStore, useUserStore } from '@/stores';
import { getThemeConfig } from '@/utils/theme';
import { 
  callAI, 
  buildCharacterPrompt, 
  buildBranchPrompt, 
  translateText,
} from '@/services/aiService';

interface PopupViewProps {
  chatId: string;
}

export function PopupView({ chatId }: PopupViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const { settings } = useSettingsStore();
  const { chats, addMessage, updateMessage, updateBranchTranslation, addBranch, setBranchIndex, generatingChatId, setGenerating } = useChatStore();
  const { getCharacter } = useCharacterStore();
  const { getCurrentUserProfile } = useUserStore();

  const currentChat = chats.find((chat) => chat.id === chatId);
  const themeConfig = currentChat ? getThemeConfig(currentChat.theme) : getThemeConfig('basic');
  const character = currentChat ? getCharacter(currentChat.characterId) : undefined;
  const userProfile = getCurrentUserProfile();
  
  const isLoading = generatingChatId === chatId;

  // 캐릭터 이름
  const characterName = character?.fieldProfile?.name || character?.freeProfileName || '캐릭터';

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
  const formatMessageTime = useCallback((messageTimestamp: number): string => {
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

  // 메시지 전송 핸들러
  const handleSendMessage = async (content: string, imageData?: { data: string; mimeType: string }) => {
    if (!currentChat || !character || isLoading) return;

    // 유저 메시지 추가
    addMessage(chatId, {
      chatId,
      senderId: 'user',
      content,
      imageData: imageData?.data,
      imageMimeType: imageData?.mimeType,
    });

    // AI 응답 생성
    setGenerating(chatId);

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

    // 이미지가 있으면 프롬프트에 이미지 설명 요청 추가
    const finalPrompt = imageData 
      ? `${prompt}\n\n[IMPORTANT: The user has sent an image along with this message. You MUST look at and acknowledge the image in your response. Describe what you see in the image or react to it naturally as the character would.]`
      : prompt;

    const response = await callAI(
      finalPrompt,
      settings.responseModel,
      settings.geminiApiKey,
      settings.openaiApiKey,
      undefined,
      settings.gptFlexTier
    );

    if (!response.error) {
      addMessage(chatId, {
        chatId,
        senderId: character.id,
        content: response.content,
      });
    } else {
      alert(`응답 생성 오류: ${response.error}`);
    }

    setGenerating(null);
  };

  // 메시지 번역 핸들러
  const handleTranslateMessage = async (messageId: string) => {
    if (!currentChat || isTranslating) return;

    const message = currentChat.messages.find(m => m.id === messageId);
    if (!message) return;

    setIsTranslating(true);

    // 브랜치가 있는 경우 현재 선택된 브랜치의 컨텐츠를 번역
    const currentBranchIndex = message.currentBranchIndex ?? 0;
    const contentToTranslate = message.branches && message.branches.length > 0 && currentBranchIndex > 0
      ? message.branches[currentBranchIndex - 1].content
      : message.content;

    const translation = await translateText(
      contentToTranslate,
      '한국어',
      settings.translationModel,
      settings.geminiApiKey,
      settings.openaiApiKey
    );

    if (!translation.error) {
      if (currentBranchIndex > 0 && message.branches) {
        // 브랜치인 경우
        updateBranchTranslation(chatId, messageId, currentBranchIndex - 1, translation.content);
      } else {
        // 원본 메시지인 경우
        updateMessage(chatId, messageId, { translatedContent: translation.content });
      }
    }

    setIsTranslating(false);
  };

  // 번역 리롤 핸들러
  const handleRetranslateMessage = async (messageId: string) => {
    if (!currentChat || isTranslating) return;

    const message = currentChat.messages.find(m => m.id === messageId);
    if (!message) return;

    setIsTranslating(true);
    
    // 브랜치가 있는 경우 현재 선택된 브랜치의 컨텐츠를 번역
    const currentBranchIndex = message.currentBranchIndex ?? 0;
    const contentToTranslate = message.branches && message.branches.length > 0 && currentBranchIndex > 0
      ? message.branches[currentBranchIndex - 1].content
      : message.content;

    // 기존 번역 삭제
    if (currentBranchIndex > 0 && message.branches) {
      updateBranchTranslation(chatId, messageId, currentBranchIndex - 1, '');
    } else {
      updateMessage(chatId, messageId, { translatedContent: undefined });
    }

    const translation = await translateText(
      contentToTranslate,
      '한국어',
      settings.translationModel,
      settings.geminiApiKey,
      settings.openaiApiKey
    );

    if (!translation.error) {
      if (currentBranchIndex > 0 && message.branches) {
        // 브랜치인 경우
        updateBranchTranslation(chatId, messageId, currentBranchIndex - 1, translation.content);
      } else {
        // 원본 메시지인 경우
        updateMessage(chatId, messageId, { translatedContent: translation.content });
      }
    }

    setIsTranslating(false);
  };

  // 분기 생성 핸들러
  const handleGenerateBranch = async (messageId: string, messageIndex: number) => {
    if (!currentChat || !character || isLoading) return;

    setGenerating(chatId);

    const message = currentChat.messages[messageIndex];
    const existingBranches = [message.content, ...(message.branches?.map(b => b.content) || [])];

    // 자동진행 모드일 경우 시나리오 전달
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

      // 새로 생성된 분기로 이동
      const newIndex = (message.branches?.length || 0) + 1;
      setBranchIndex(chatId, messageId, newIndex);
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
        currentChat.theme
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
        updateMessage(chatId, nextMessage.id, {
          content: response.content,
          translatedContent: undefined,
          branches: undefined,
          currentBranchIndex: 0
        });
      }
      
      setGenerating(null);
    }
  };

  if (!currentChat || !character) {
    return (
      <div className="flex flex-col h-screen bg-[#1a1a2e]">
        <TitleBar title="SimuTalk" />
        <div className="flex-1 flex items-center justify-center text-white/50">
          채팅을 찾을 수 없습니다
        </div>
      </div>
    );
  }

  // 카카오톡 테마
  if (currentChat.theme === 'kakao') {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <TitleBar title={characterName} />
        <div className="flex-1 flex flex-col bg-kakao-bg overflow-hidden">
          {/* 카카오톡 스타일 헤더 */}
          <div className="sticky top-0 left-0 w-full h-[50px] bg-kakao-bg flex items-center justify-between px-4 z-10 flex-shrink-0">
            <div className="flex items-center gap-0.5 text-black cursor-pointer">
              <svg className="w-6 h-6 -ml-1.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-[16px]">{currentChat.messages.length}</span>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-black">
              {characterName}
            </div>
            <div className="flex items-center gap-[18px]">
              <svg className="w-6 h-6 cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </div>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto pb-[10px] px-2">
            {currentChat.messages.map((message, index) => {
              const prevMessage = index > 0 ? currentChat.messages[index - 1] : null;
              const isFirstInGroup = !prevMessage || prevMessage.senderId !== message.senderId;
              
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
                  onBranchChange={(branchIndex) => setBranchIndex(chatId, message.id, branchIndex)}
                  onGenerateBranch={() => handleGenerateBranch(message.id, index)}
                  isLastCharacterMessage={message.id === lastCharacterMessageId}
                  onTranslate={() => handleTranslateMessage(message.id)}
                  onRetranslate={() => handleRetranslateMessage(message.id)}
                  isTranslating={isTranslating}
                  isFirstInGroup={isFirstInGroup}
                  theme={currentChat.theme}
                  onEdit={message.senderId === 'user' ? (newContent) => handleEditMessage(message.id, newContent) : undefined}
                  formatTimeFunc={formatMessageTime}
                  imageData={message.imageData}
                  imageMimeType={message.imageMimeType}
                />
              );
            })}
            {isLoading && (
              <div className="flex justify-center py-4">
                <div className="animate-pulse text-gray-600 text-[13px]">응답 생성 중...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력창 */}
          {currentChat.mode === 'immersion' && (
            <ChatInput onSend={handleSendMessage} disabled={isLoading} theme={currentChat.theme} />
          )}
        </div>
      </div>
    );
  }

  // 라인 테마
  if (currentChat.theme === 'line') {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <TitleBar title={characterName} />
        <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: '#8dabd8' }}>
          {/* 라인 스타일 헤더 */}
          <header 
            className="sticky top-0 left-0 w-full flex justify-between items-center px-[15px] py-[15px] z-10 flex-shrink-0"
            style={{ backgroundColor: '#8dabd8' }}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 cursor-pointer text-[#111]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
              </svg>
              <span className="text-[17px] font-medium text-[#111] mr-[5px]">
                {currentChat.messages.length > 99 ? '99+' : currentChat.messages.length || ''}
              </span>
              <span className="text-[17px] font-bold text-[#111]">{characterName}</span>
              <span className="text-[12px] text-[#777] ml-0.5">♬</span>
            </div>
            <div className="flex items-center gap-5 text-[20px] text-[#111]">
              <svg className="w-5 h-5 cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
              <svg className="w-5 h-5 cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
            </div>
          </header>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto pb-[10px] px-2">
            {currentChat.messages.map((message, index) => {
              const prevMessage = index > 0 ? currentChat.messages[index - 1] : null;
              const isFirstInGroup = !prevMessage || prevMessage.senderId !== message.senderId;
              
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
                  onBranchChange={(branchIndex) => setBranchIndex(chatId, message.id, branchIndex)}
                  onGenerateBranch={() => handleGenerateBranch(message.id, index)}
                  isLastCharacterMessage={message.id === lastCharacterMessageId}
                  onTranslate={() => handleTranslateMessage(message.id)}
                  onRetranslate={() => handleRetranslateMessage(message.id)}
                  isTranslating={isTranslating}
                  isFirstInGroup={isFirstInGroup}
                  theme={currentChat.theme}
                  onEdit={message.senderId === 'user' ? (newContent) => handleEditMessage(message.id, newContent) : undefined}
                  formatTimeFunc={formatMessageTime}
                  imageData={message.imageData}
                  imageMimeType={message.imageMimeType}
                />
              );
            })}
            {isLoading && (
              <div className="flex justify-center py-4">
                <div className="animate-pulse text-white/80 text-[13px]">응답 생성 중...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력창 */}
          {currentChat.mode === 'immersion' && (
            <ChatInput onSend={handleSendMessage} disabled={isLoading} theme={currentChat.theme} />
          )}
        </div>
      </div>
    );
  }

  // iMessage 테마
  if (currentChat.theme === 'imessage') {
    const avatarText = characterName.length >= 3 ? characterName.charAt(0) : characterName;
    
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <TitleBar title={characterName} />
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {/* iMessage 스타일 헤더 */}
          <div 
            className="sticky top-0 flex justify-between items-center px-3 py-[10px] z-10 border-b border-[#ceced2] flex-shrink-0"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(10px)',
              height: '90px',
            }}
          >
            <div className="flex items-center gap-[5px] flex-1 mb-[15px]">
              <svg className="w-3 h-5 cursor-pointer" fill="#007AFF" viewBox="0 0 12 20">
                <path d="M10 20L0 10 10 0l1.5 1.5L3 10l8.5 8.5z"/>
              </svg>
              <span className="bg-[#007AFF] text-white text-[11px] font-semibold py-[3px] px-2 rounded-xl min-w-[24px] text-center">
                {currentChat.messages.length > 99 ? '99' : currentChat.messages.length || '1'}
              </span>
            </div>
            
            <div className="flex flex-col items-center flex-1 mt-[10px]">
              {(character.fieldProfile?.profileImage || character.freeProfileImage) ? (
                <img
                  src={character.fieldProfile?.profileImage || character.freeProfileImage}
                  alt=""
                  className="w-12 h-12 rounded-full object-cover mb-1"
                />
              ) : (
                <div 
                  className="w-12 h-12 rounded-full flex justify-center items-center mb-1 text-white text-lg font-medium overflow-hidden"
                  style={{ background: 'linear-gradient(180deg, #B4B4B4 0%, #888888 100%)' }}
                >
                  {avatarText}
                </div>
              )}
              <div className="flex items-center gap-[3px]">
                <span className="text-[11px] text-black font-normal">{characterName}</span>
                <svg className="w-2 h-2" fill="#C7C7CC" viewBox="0 0 10 16">
                  <path d="M2 0L0.5 1.5 7 8 0.5 14.5 2 16l8-8z"/>
                </svg>
              </div>
            </div>
            
            <div className="flex-1 flex justify-end items-center gap-3 mb-[15px]">
              <svg className="w-[26px] h-[26px] cursor-pointer" fill="#007AFF" viewBox="0 0 24 24">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
              </svg>
            </div>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 overflow-y-auto py-[10px] px-[10px] flex flex-col gap-1">
            {currentChat.messages.length > 0 && (
              <div className="flex justify-center my-[15px]">
                <span className="text-[#8e8e93] text-[11px] font-medium">
                  {new Date(currentChat.messages[0].timestamp).toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short',
                  })} {new Date(currentChat.messages[0].timestamp).toLocaleTimeString('ko-KR', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                  })}
                </span>
              </div>
            )}
            
            {currentChat.messages.map((message, index) => {
              const nextMessage = index < currentChat.messages.length - 1 ? currentChat.messages[index + 1] : null;
              const isLastInGroup = !nextMessage || nextMessage.senderId !== message.senderId;
              
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
                  onBranchChange={(branchIndex) => setBranchIndex(chatId, message.id, branchIndex)}
                  onGenerateBranch={() => handleGenerateBranch(message.id, index)}
                  isLastCharacterMessage={message.id === lastCharacterMessageId}
                  onTranslate={() => handleTranslateMessage(message.id)}
                  onRetranslate={() => handleRetranslateMessage(message.id)}
                  isTranslating={isTranslating}
                  isFirstInGroup={isLastInGroup}
                  showTime={false}
                  theme={currentChat.theme}
                  onEdit={message.senderId === 'user' ? (newContent) => handleEditMessage(message.id, newContent) : undefined}
                  formatTimeFunc={formatMessageTime}
                  imageData={message.imageData}
                  imageMimeType={message.imageMimeType}
                />
              );
            })}
            {isLoading && (
              <div className="flex justify-center py-4">
                <div className="animate-pulse text-[#8e8e93] text-[13px]">응답 생성 중...</div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력창 */}
          {currentChat.mode === 'immersion' && (
            <ChatInput onSend={handleSendMessage} disabled={isLoading} theme={currentChat.theme} />
          )}
        </div>
      </div>
    );
  }

  // 기본 테마
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <TitleBar title={characterName} />
      <div className={`flex-1 flex flex-col ${themeConfig.background} overflow-hidden`}>
        {/* 헤더 */}
        <div className={`flex items-center gap-4 ${themeConfig.header.style} ${themeConfig.header.bg} sticky top-0 z-10 flex-shrink-0`}>
          {themeConfig.showProfilePicture && (
            <div className="relative">
              {(character.fieldProfile?.profileImage || character.freeProfileImage) ? (
                <img
                  src={character.fieldProfile?.profileImage || character.freeProfileImage}
                  alt=""
                  className="w-10 h-10 rounded-xl object-cover shadow-sm border border-gray-100"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-inner">
                  <span className="text-gray-500 font-semibold">
                    {characterName.charAt(0)}
                  </span>
                </div>
              )}
              <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 border-2 border-white rounded-full ${currentChat.mode === 'autopilot' ? 'bg-purple-500' : 'bg-green-500'}`}></div>
            </div>
          )}
          <div className="flex-1">
            <h2 className={`font-bold ${themeConfig.header.textColor} leading-tight`}>
              {characterName}
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
          {currentChat.messages.map((message, index) => {
            const prevMessage = index > 0 ? currentChat.messages[index - 1] : null;
            const isFirstInGroup = !prevMessage || prevMessage.senderId !== message.senderId;
            
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
                onBranchChange={(branchIndex) => setBranchIndex(chatId, message.id, branchIndex)}
                onGenerateBranch={() => handleGenerateBranch(message.id, index)}
                isLastCharacterMessage={message.id === lastCharacterMessageId}
                onTranslate={() => handleTranslateMessage(message.id)}
                onRetranslate={() => handleRetranslateMessage(message.id)}
                isTranslating={isTranslating}
                isFirstInGroup={isFirstInGroup}
                theme={currentChat.theme}
                onEdit={message.senderId === 'user' ? (newContent) => handleEditMessage(message.id, newContent) : undefined}
                formatTimeFunc={formatMessageTime}
                imageData={message.imageData}
                imageMimeType={message.imageMimeType}
              />
            );
          })}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="animate-pulse text-gray-500">응답 생성 중...</div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 입력창 */}
        {currentChat.mode === 'immersion' && (
          <ChatInput onSend={handleSendMessage} disabled={isLoading} theme={currentChat.theme} />
        )}
      </div>
    </div>
  );
}
