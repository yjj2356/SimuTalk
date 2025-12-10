import { useRef, useEffect, useState } from 'react';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { useSettingsStore, useChatStore, useCharacterStore, useUserStore } from '@/stores';
import { getThemeConfig } from '@/utils/theme';
import { callAI, buildCharacterPrompt, buildBranchPrompt, translateText } from '@/services/aiService';

// 출력 언어 -> 언어명 매핑
const languageNames: Record<string, string> = {
  korean: '한국어',
  english: 'English',
  japanese: '日本語',
  chinese: '中文',
};

export function ChatWindow() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const { settings } = useSettingsStore();
  const { chats, currentChatId, addMessage, updateMessage, addBranch, setBranchIndex } = useChatStore();
  const { getCharacter } = useCharacterStore();
  const { userProfile } = useUserStore();

  const currentChat = chats.find((chat) => chat.id === currentChatId);
  const themeConfig = currentChat ? getThemeConfig(currentChat.theme) : getThemeConfig('basic');
  const character = currentChat ? getCharacter(currentChat.characterId) : undefined;

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

  // 메시지 번역 핸들러
  const handleTranslateMessage = async (messageId: string) => {
    if (!currentChat || isTranslating) return;

    const message = currentChat.messages.find(m => m.id === messageId);
    if (!message) return;

    setIsTranslating(true);

    const translation = await translateText(
      message.content,
      '한국어',
      settings.translationModel,
      settings.geminiApiKey,
      settings.openaiApiKey
    );

    if (!translation.error) {
      updateMessage(currentChat.id, messageId, { translatedContent: translation.content });
    } else {
      alert(`번역 오류: ${translation.error}`);
    }

    setIsTranslating(false);
  };

  const handleSendMessage = async (content: string) => {
    if (!currentChat || !character || isLoading) return;

    // /t 명령어 처리: 번역만 하고 전송하지 않음
    if (content.startsWith('/t ')) {
      const textToTranslate = content.slice(3);
      if (!textToTranslate.trim()) return;

      setIsLoading(true);

      const targetLanguage = languageNames[settings.outputLanguage] || settings.outputLanguage;
      const translation = await translateText(
        textToTranslate,
        targetLanguage,
        settings.translationModel,
        settings.geminiApiKey,
        settings.openaiApiKey
      );

      if (!translation.error) {
        // 번역 결과를 유저 메시지로 추가 (원문을 번역으로 표시)
        addMessage(currentChat.id, {
          chatId: currentChat.id,
          senderId: 'user',
          content: translation.content,
          translatedContent: textToTranslate, // 원문을 하단에 표시
        });
      } else {
        alert(`번역 오류: ${translation.error}`);
      }

      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // 유저 메시지 추가
    addMessage(currentChat.id, {
      chatId: currentChat.id,
      senderId: 'user',
      content,
    });

    // AI 응답 생성
    const prompt = buildCharacterPrompt(
      character,
      userProfile,
      currentChat.messages,
      content,
      settings.outputLanguage
    );

    const response = await callAI(
      prompt,
      settings.responseModel,
      settings.geminiApiKey,
      settings.openaiApiKey
    );

    if (response.error) {
      addMessage(currentChat.id, {
        chatId: currentChat.id,
        senderId: character.id,
        content: `⚠️ 오류: ${response.error}`,
      });
    } else {
      addMessage(currentChat.id, {
        chatId: currentChat.id,
        senderId: character.id,
        content: response.content,
      });
    }

    setIsLoading(false);
  };

  // 분기 생성 핸들러
  const handleGenerateBranch = async (messageId: string, messageIndex: number) => {
    if (!currentChat || !character || isLoading) return;

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

    const response = await callAI(
      prompt,
      settings.responseModel,
      settings.geminiApiKey,
      settings.openaiApiKey
    );

    if (!response.error && response.content) {
      let translatedContent: string | undefined;

      addBranch(currentChat.id, messageId, {
        content: response.content,
        translatedContent,
      });

      // 새로 생성된 분기로 이동
      const newIndex = (message.branches?.length || 0) + 1;
      setBranchIndex(currentChat.id, messageId, newIndex);
    } else if (response.error) {
      alert(`분기 생성 오류: ${response.error}`);
    }

    setIsLoading(false);
  };

  // 유저 메시지 수정 핸들러 - 수정 후 AI 응답 재생성
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!currentChat || !character || isLoading) return;
    
    // 메시지 업데이트
    updateMessage(currentChat.id, messageId, { content: newContent });
    
    // 수정된 메시지의 인덱스 찾기
    const messageIndex = currentChat.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    // 수정된 메시지 다음에 캐릭터 응답이 있는지 확인
    const nextMessage = currentChat.messages[messageIndex + 1];
    if (nextMessage && nextMessage.senderId === character.id) {
      // AI 응답 재생성
      setIsLoading(true);
      
      // 수정된 메시지까지의 대화 내역으로 프롬프트 생성
      const messagesUpToEdit = currentChat.messages.slice(0, messageIndex);
      
      const prompt = buildCharacterPrompt(
        character,
        userProfile,
        messagesUpToEdit,
        newContent,
        settings.outputLanguage
      );

      const response = await callAI(
        prompt,
        settings.responseModel,
        settings.geminiApiKey,
        settings.openaiApiKey
      );

      if (!response.error) {
        // 기존 캐릭터 응답을 새로운 응답으로 업데이트
        updateMessage(currentChat.id, nextMessage.id, { 
          content: response.content,
          translatedContent: undefined,
          branches: undefined,
          currentBranchIndex: 0
        });
      } else {
        alert(`응답 재생성 오류: ${response.error}`);
      }
      
      setIsLoading(false);
    }
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

  const characterName = character.fieldProfile?.name || character.freeProfileName || character.freeProfile?.slice(0, 20) || '캐릭터';

  // 카카오톡 테마 전용 렌더링
  if (currentChat.theme === 'kakao') {
    return (
      <div className="flex-1 flex flex-col bg-kakao-bg h-full overflow-hidden">
        {/* 카카오톡 스타일 헤더 - sticky로 고정 */}
        <div className="sticky top-0 left-0 w-full h-[50px] bg-kakao-bg flex items-center justify-between px-4 z-10 flex-shrink-0">
          {/* 좌측: 뒤로가기 + 숫자 */}
          <div className="flex items-center gap-0.5 text-black cursor-pointer">
            <svg className="w-6 h-6 -ml-1.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            <span className="text-[16px]">{currentChat.messages.length}</span>
          </div>
          
          {/* 중앙: 타이틀 */}
          <div className="absolute left-1/2 -translate-x-1/2 text-[17px] font-semibold text-black">
            {characterName}
          </div>
          
          {/* 우측: 검색 + 메뉴 */}
          <div className="flex items-center gap-[18px]">
            <svg className="w-6 h-6 cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <svg className="w-6 h-6 cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
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
                onBranchChange={(branchIndex) => setBranchIndex(currentChat.id, message.id, branchIndex)}
                onGenerateBranch={() => handleGenerateBranch(message.id, index)}
                isLastCharacterMessage={message.id === lastCharacterMessageId}
                onTranslate={() => handleTranslateMessage(message.id)}
                isTranslating={isTranslating}
                isFirstInGroup={isFirstInGroup}
                theme={currentChat.theme}
                onEdit={message.senderId === 'user' ? (newContent) => handleEditMessage(message.id, newContent) : undefined}
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

        {/* 카카오톡 스타일 입력창 */}
        {currentChat.mode === 'immersion' && (
          <ChatInput onSend={handleSendMessage} disabled={isLoading} theme={currentChat.theme} />
        )}
      </div>
    );
  }

  // 라인 테마 전용 렌더링
  if (currentChat.theme === 'line') {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden" style={{ backgroundColor: '#8dabd8' }}>
        {/* 라인 스타일 헤더 - sticky로 고정 */}
        <header 
          className="sticky top-0 left-0 w-full flex justify-between items-center px-[15px] py-[15px] z-10 flex-shrink-0"
          style={{ backgroundColor: '#8dabd8' }}
        >
          <div className="flex items-center gap-2">
            {/* 뒤로가기 */}
            <svg className="w-5 h-5 cursor-pointer text-[#111]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
            {/* 안 읽은 메시지 수 */}
            <span className="text-[17px] font-medium text-[#111] mr-[5px]">
              {currentChat.messages.length > 99 ? '99+' : currentChat.messages.length || ''}
            </span>
            {/* 친구 이름 */}
            <span className="text-[17px] font-bold text-[#111]">{characterName}</span>
            {/* 뮤직 아이콘 (옵션) */}
            <span className="text-[12px] text-[#777] ml-0.5">♬</span>
          </div>
          <div className="flex items-center gap-5 text-[20px] text-[#111]">
            <svg className="w-5 h-5 cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <svg className="w-5 h-5 cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
            <svg className="w-5 h-5 cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
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
                onBranchChange={(branchIndex) => setBranchIndex(currentChat.id, message.id, branchIndex)}
                onGenerateBranch={() => handleGenerateBranch(message.id, index)}
                isLastCharacterMessage={message.id === lastCharacterMessageId}
                onTranslate={() => handleTranslateMessage(message.id)}
                isTranslating={isTranslating}
                isFirstInGroup={isFirstInGroup}
                theme={currentChat.theme}
                onEdit={message.senderId === 'user' ? (newContent) => handleEditMessage(message.id, newContent) : undefined}
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

        {/* 라인 스타일 입력창 */}
        {currentChat.mode === 'immersion' && (
          <ChatInput onSend={handleSendMessage} disabled={isLoading} theme={currentChat.theme} />
        )}
      </div>
    );
  }

  // iMessage 테마 전용 렌더링
  if (currentChat.theme === 'imessage') {
    // 프로필 아바타 텍스트 로직 (3글자 이상이면 첫 글자만)
    const avatarText = characterName.length >= 3 ? characterName.charAt(0) : characterName;
    
    return (
      <div className="flex-1 flex flex-col bg-white h-full overflow-hidden">
        {/* iMessage 스타일 헤더 - sticky로 고정 */}
        <div 
          className="sticky top-0 flex justify-between items-center px-3 py-[10px] z-10 border-b border-[#ceced2] flex-shrink-0"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            height: '90px',
          }}
        >
          {/* 좌측: 뒤로가기 + 뱃지 */}
          <div className="flex items-center gap-[5px] flex-1 mb-[15px]">
            <svg className="w-3 h-5 cursor-pointer" fill="#007AFF" viewBox="0 0 12 20">
              <path d="M10 20L0 10 10 0l1.5 1.5L3 10l8.5 8.5z"/>
            </svg>
            <span className="bg-[#007AFF] text-white text-[11px] font-semibold py-[3px] px-2 rounded-xl min-w-[24px] text-center">
              {currentChat.messages.length > 99 ? '99' : currentChat.messages.length || '1'}
            </span>
          </div>
          
          {/* 중앙: 프로필 */}
          <div className="flex flex-col items-center flex-1 mt-[10px]">
            {/* 프로필 아바타 */}
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
            {/* 이름 + 화살표 */}
            <div className="flex items-center gap-[3px]">
              <span className="text-[11px] text-black font-normal">{characterName}</span>
              <svg className="w-2 h-2" fill="#C7C7CC" viewBox="0 0 10 16">
                <path d="M2 0L0.5 1.5 7 8 0.5 14.5 2 16l8-8z"/>
              </svg>
            </div>
          </div>
          
          {/* 우측: 영상통화 아이콘 */}
          <div className="flex-1 flex justify-end mb-[15px]">
            <svg className="w-[26px] h-[26px] cursor-pointer" fill="#007AFF" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto py-[10px] px-[10px] flex flex-col gap-1">
          {/* 날짜 표시 */}
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
                onBranchChange={(branchIndex) => setBranchIndex(currentChat.id, message.id, branchIndex)}
                onGenerateBranch={() => handleGenerateBranch(message.id, index)}
                isLastCharacterMessage={message.id === lastCharacterMessageId}
                onTranslate={() => handleTranslateMessage(message.id)}
                isTranslating={isTranslating}
                isFirstInGroup={isLastInGroup}
                showTime={false}
                theme={currentChat.theme}
                onEdit={message.senderId === 'user' ? (newContent) => handleEditMessage(message.id, newContent) : undefined}
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

        {/* iMessage 스타일 입력창 */}
        {currentChat.mode === 'immersion' && (
          <ChatInput onSend={handleSendMessage} disabled={isLoading} theme={currentChat.theme} />
        )}
      </div>
    );
  }

  // 기본/다른 테마 렌더링
  return (
    <div className={`flex-1 flex flex-col ${themeConfig.background} h-full overflow-hidden`}>
      {/* 채팅방 헤더 - sticky로 고정 */}
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
        <div>
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
              onBranchChange={(branchIndex) => setBranchIndex(currentChat.id, message.id, branchIndex)}
              onGenerateBranch={() => handleGenerateBranch(message.id, index)}
              isLastCharacterMessage={message.id === lastCharacterMessageId}
              onTranslate={() => handleTranslateMessage(message.id)}
              isTranslating={isTranslating}
              isFirstInGroup={isFirstInGroup}
              theme={currentChat.theme}
              onEdit={message.senderId === 'user' ? (newContent) => handleEditMessage(message.id, newContent) : undefined}
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

      {/* 입력창 (몰입 모드일 때만) */}
      {currentChat.mode === 'immersion' && (
        <ChatInput onSend={handleSendMessage} disabled={isLoading} theme={currentChat.theme} />
      )}
    </div>
  );
}
