import { useRef, useEffect, useState, useCallback } from 'react';
import { ChatBubble } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { useSettingsStore, useChatStore, useCharacterStore, useUserStore, useStickerStore } from '@/stores';
import { getThemeConfig } from '@/utils/theme';
import { OutputLanguage, Sticker } from '@/types';
import { StickerManager } from '@/components/sticker';
import { 
  callAI, 
  buildCharacterPrompt, 
  buildBranchPrompt, 
  translateText,
  shouldSummarize,
  shouldResummarize,
  getMessagesToSummarize,
  getMemoriesToResummarize,
  summarizeConversation,
  resummarizeSummaries,
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

export function ChatWindow() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showStickerManager, setShowStickerManager] = useState(false);
  const { settings } = useSettingsStore();
  const { chats, currentChatId, addMessage, updateMessage, updateBranchTranslation, addBranch, setBranchIndex, addMemorySummary, removeMemorySummaries, removeMessages, generatingChatId, setGenerating } = useChatStore();
  const { getCharacter } = useCharacterStore();
  const { getCurrentUserProfile } = useUserStore();
  const { stickers } = useStickerStore();

  const currentChat = chats.find((chat) => chat.id === currentChatId);
  const themeConfig = currentChat ? getThemeConfig(currentChat.theme) : getThemeConfig('basic');
  const character = currentChat ? getCharacter(currentChat.characterId) : undefined;
  const userProfile = getCurrentUserProfile();
  
  // 현재 채팅방의 응답 생성 상태
  const isLoading = generatingChatId === currentChatId;

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

  // 메시지 타임스탬프를 현재 시간 설정에 맞게 변환하여 포맷하는 함수
  const formatMessageTime = useCallback((messageTimestamp: number) => {
    const timeSettings = currentChat?.timeSettings;
    
    // 실시간 모드면 원래 타임스탬프 그대로 사용
    if (!timeSettings || timeSettings.mode === 'realtime') {
      const date = new Date(messageTimestamp);
      return date.toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    }
    
    // 커스텀 모드: 현재 설정 시간과 메시지 시간의 차이를 계산
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

  // 메시지 번역 핸들러
  const handleTranslateMessage = async (messageId: string) => {
    if (!currentChat || isTranslating) return;

    const message = currentChat.messages.find(m => m.id === messageId);
    if (!message) return;

    setIsTranslating(true);

    // 현재 선택된 분기의 내용을 가져옴
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
      // 분기 선택 여부에 따라 번역 저장 위치 결정
      if (currentBranchIndex === 0) {
        updateMessage(currentChat.id, messageId, { translatedContent: translation.content });
      } else {
        updateBranchTranslation(currentChat.id, messageId, currentBranchIndex - 1, translation.content);
      }
    } else {
      alert(`번역 오류: ${translation.error}`);
    }

    setIsTranslating(false);
  };

  // 번역 리롤 핸들러 (기존 번역을 새로 다시 번역)
  const handleRetranslateMessage = async (messageId: string) => {
    if (!currentChat || isTranslating) return;

    const message = currentChat.messages.find(m => m.id === messageId);
    if (!message) return;

    setIsTranslating(true);

    // 현재 선택된 분기의 내용을 가져옴
    const currentBranchIndex = message.currentBranchIndex || 0;
    const contentToTranslate = currentBranchIndex === 0
      ? message.content
      : message.branches?.[currentBranchIndex - 1]?.content || message.content;

    // 기존 번역 지우고 새로 번역
    if (currentBranchIndex === 0) {
      updateMessage(currentChat.id, messageId, { translatedContent: undefined });
    } else {
      updateBranchTranslation(currentChat.id, messageId, currentBranchIndex - 1, undefined);
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
        updateMessage(currentChat.id, messageId, { translatedContent: translation.content });
      } else {
        updateBranchTranslation(currentChat.id, messageId, currentBranchIndex - 1, translation.content);
      }
    } else {
      alert(`번역 오류: ${translation.error}`);
    }

    setIsTranslating(false);
  };

  const handleSendMessage = async (content: string, imageData?: { data: string; mimeType: string }) => {
    if (!currentChat || !character || isLoading) return;

    // /t 명령어 처리: 번역 후 AI 응답도 생성 (이미지도 함께 전송 가능)
    if (content.startsWith('/t ')) {
      const textToTranslate = content.slice(3);
      if (!textToTranslate.trim()) return;

      setGenerating(currentChatId!);

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
        // 번역 결과를 유저 메시지로 추가 (원문을 번역으로 표시, 이미지 포함)
        addMessage(currentChat.id, {
          chatId: currentChat.id,
          senderId: 'user',
          content: translation.content,
          translatedContent: textToTranslate, // 원문을 하단에 표시
          imageData: imageData?.data,
          imageMimeType: imageData?.mimeType,
        });

        // 번역된 메시지로 AI 응답 생성
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

        // Gemini 모델인 경우 스트리밍 사용 (응답 완료 후 하나의 메시지로 저장)
        const provider = getProviderFromModel(settings.responseModel);
        
        if (provider === 'gemini' && settings.geminiApiKey) {
          const response = await callGeminiAPIStreaming(
            prompt,
            settings.geminiApiKey,
            settings.responseModel,
            undefined
          );

          // 요청이 취소된 경우 (빈 응답 + 에러 없음) 메시지 추가하지 않음
          if (!response.content && !response.error) {
            setGenerating(null);
            return;
          }

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
        } else {
          const response = await callAI(
            prompt,
            settings.responseModel,
            settings.geminiApiKey,
            settings.openaiApiKey,
            undefined,
            settings.gptFlexTier
          );

          // 요청이 취소된 경우 (빈 응답 + 에러 없음) 메시지 추가하지 않음
          if (!response.content && !response.error) {
            setGenerating(null);
            return;
          }

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
        }

        setGenerating(null);
        await checkAndSummarizeIfNeeded();
        return;
      } else {
        alert(`번역 오류: ${translation.error}`);
        setGenerating(null);
        return;
      }
    }

    setGenerating(currentChatId!);

    // 유저 메시지 추가 (이미지 포함)
    addMessage(currentChat.id, {
      chatId: currentChat.id,
      senderId: 'user',
      content,
      imageData: imageData?.data,
      imageMimeType: imageData?.mimeType,
    });

    // 현재 시간 가져오기 (채팅방별 시간 설정 사용)
    const currentAppTime = getCurrentChatTime();
    const currentTimeString = currentAppTime.toLocaleTimeString('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // 채팅방별 언어 설정 사용 (기본값: korean)
    const outputLanguage = currentChat.outputLanguage || 'korean';

    // AI 응답 생성 (메모리 요약 포함)
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

    // Gemini 모델인 경우 스트리밍 사용 (응답 완료 후 하나의 메시지로 저장)
    const provider = getProviderFromModel(settings.responseModel);
    
    if (provider === 'gemini' && settings.geminiApiKey) {
      const response = await callGeminiAPIStreaming(
        finalPrompt,
        settings.geminiApiKey,
        settings.responseModel,
        imageData ? { data: imageData.data, mimeType: imageData.mimeType } : undefined
      );

      // 요청이 취소된 경우 (빈 응답 + 에러 없음) 무시
      if (!response.content && !response.error) {
        setGenerating(null);
        return;
      }

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
    } else {
      // OpenAI 등 다른 모델은 기존 방식
      const response = await callAI(
        finalPrompt,
        settings.responseModel,
        settings.geminiApiKey,
        settings.openaiApiKey,
        imageData ? { data: imageData.data, mimeType: imageData.mimeType } : undefined,
        settings.gptFlexTier
      );

      // 요청이 취소된 경우 (빈 응답 + 에러 없음) 메시지 추가하지 않음
      if (!response.content && !response.error) {
        setGenerating(null);
        return;
      }

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
    }

    setGenerating(null);
    
    // 메모리 시스템: 토큰 초과 시 자동 요약
    await checkAndSummarizeIfNeeded();
  };

  // 메모리 요약 필요 여부 확인 및 실행
  const checkAndSummarizeIfNeeded = async () => {
    if (!currentChat || !character || isSummarizing) return;
    
    const TOKEN_THRESHOLD = 40000; // 40000 토큰 초과 시 요약
    const MEMORY_MAX_RATIO = 0.3; // 메모리는 전체 컨텍스트의 최대 30%
    const MEMORY_MAX_TOKENS = TOKEN_THRESHOLD * MEMORY_MAX_RATIO; // 12000 토큰
    const MESSAGE_SET_COUNT = 4; // 수신+발신 4세트 = 8메시지 단위로 요약
    
    const memorySummaries = currentChat.memorySummaries || [];
    
    // 1단계: 메모리가 최대 비율 초과 시 처리
    if (shouldResummarize(memorySummaries, MEMORY_MAX_TOKENS)) {
      setIsSummarizing(true);
      
      // 메모리가 2개 이상이면 재요약 시도, 아니면 가장 오래된 것 삭제
      if (memorySummaries.length >= 2) {
        const memoriesToMerge = getMemoriesToResummarize(memorySummaries, 2);
        if (memoriesToMerge.length >= 2) {
          console.log('[Memory] 메모리 재요약 시작:', memoriesToMerge.length, '개 요약 병합');
          
          const resummarizeResponse = await resummarizeSummaries(
            memoriesToMerge,
            settings.summaryModel || settings.responseModel,
            settings.geminiApiKey,
            settings.openaiApiKey
          );
          
          if (!resummarizeResponse.error && resummarizeResponse.content) {
            // 기존 요약들 삭제
            removeMemorySummaries(currentChat.id, memoriesToMerge.map(m => m.id));
            
            // 새로운 통합 요약 추가
            addMemorySummary(currentChat.id, {
              content: resummarizeResponse.content,
              summarizedMessageIds: memoriesToMerge.flatMap(m => m.summarizedMessageIds),
              startTime: Math.min(...memoriesToMerge.map(m => m.startTime)),
              endTime: Math.max(...memoriesToMerge.map(m => m.endTime)),
            });
            
            console.log('[Memory] 메모리 재요약 완료');
          }
        }
      } else if (memorySummaries.length === 1) {
        // 메모리가 1개인데 최대치 초과 시, 가장 오래된 것 삭제 (메모리 손실 발생)
        console.log('[Memory] 메모리 최대 용량 초과 - 가장 오래된 메모리 삭제');
        const oldestMemory = [...memorySummaries].sort((a, b) => a.createdAt - b.createdAt)[0];
        removeMemorySummaries(currentChat.id, [oldestMemory.id]);
      }
      
      setIsSummarizing(false);
      return; // 다음 사이클에서 메시지 요약 검사
    }
    
    // 2단계: 전체 컨텍스트(메시지 + 메모리)가 임계값 초과 시 메시지 요약
    if (!shouldSummarize(currentChat.messages, TOKEN_THRESHOLD, memorySummaries)) return;
    
    const messagesToSummarize = getMessagesToSummarize(currentChat.messages, MESSAGE_SET_COUNT);
    if (messagesToSummarize.length < 2) {
      // 요약할 메시지가 부족한데 토큰 초과인 경우 - 메모리 삭제로 대응
      if (memorySummaries.length > 0) {
        console.log('[Memory] 요약할 메시지 부족 - 가장 오래된 메모리 삭제');
        const oldestMemory = [...memorySummaries].sort((a, b) => a.createdAt - b.createdAt)[0];
        removeMemorySummaries(currentChat.id, [oldestMemory.id]);
      }
      return;
    }
    
    setIsSummarizing(true);
    
    const characterName = character.fieldProfile?.name || character.freeProfileName || '캐릭터';
    const userName = userProfile.fieldProfile?.name || '유저';
    
    console.log('[Memory] 대화 요약 시작:', messagesToSummarize.length, '개 메시지');
    
    const summaryResponse = await summarizeConversation(
      messagesToSummarize,
      characterName,
      userName,
      settings.summaryModel || settings.responseModel,
      settings.geminiApiKey,
      settings.openaiApiKey
    );
    
    if (!summaryResponse.error && summaryResponse.content) {
      // 요약 저장
      addMemorySummary(currentChat.id, {
        content: summaryResponse.content,
        summarizedMessageIds: messagesToSummarize.map(m => m.id),
        startTime: messagesToSummarize[0].timestamp,
        endTime: messagesToSummarize[messagesToSummarize.length - 1].timestamp,
      });
      
      // 요약된 메시지들 삭제
      removeMessages(currentChat.id, messagesToSummarize.map(m => m.id));
      
      console.log('[Memory] 대화 요약 완료:', messagesToSummarize.length, '개 메시지 요약됨');
    }
    
    setIsSummarizing(false);
  };

  // 분기 생성 핸들러
  const handleGenerateBranch = async (messageId: string, messageIndex: number) => {
    if (!currentChat || !character || isLoading) return;

    setGenerating(currentChatId!);

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

    if (response.error) {
      alert(`분기 생성 오류: ${response.error}`);
    }

    const responseContent = response.error
      ? `오류가 발생했습니다: ${response.error}`
      : (response.content || '');

    // 리롤(분기 생성)은 캐릭터 응답 성공/실패와 무관하게 "브랜치"를 만든다.
    if (responseContent) {
      addBranch(currentChat.id, messageId, {
        content: responseContent,
        translatedContent: undefined,
      });

      const newIndex = (message.branches?.length || 0) + 1;
      setBranchIndex(currentChat.id, messageId, newIndex);
    }

    setGenerating(null);
  };

  // 스티커 전송 핸들러
  const handleSendSticker = async (sticker: Sticker) => {
    if (!currentChat || !character || isLoading) return;

    setGenerating(currentChatId!);

    // 스티커 메시지 추가 (이미지로 표시, 컨텍스트에 설명 포함)
    const stickerContextText = `[[${sticker.description}] 이모티콘을 사용자가 보냄]`;
    
    addMessage(currentChat.id, {
      chatId: currentChat.id,
      senderId: 'user',
      content: stickerContextText,
      imageData: sticker.imageData,
      imageMimeType: sticker.mimeType,
      isSticker: true,
    });

    // AI 응답 생성
    const currentAppTime = getCurrentChatTime();
    const currentTimeString = currentAppTime.toLocaleTimeString('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const outputLanguage = currentChat.outputLanguage || 'korean';
    
    // 캐릭터가 사용 가능한 스티커 목록 만들기
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

    // Gemini 모델인 경우 스트리밍 사용
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
        addMessage(currentChat.id, {
          chatId: currentChat.id,
          senderId: character.id,
          content: response.content,
        });
      } else if (response.error) {
        addMessage(currentChat.id, {
          chatId: currentChat.id,
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
        addMessage(currentChat.id, {
          chatId: currentChat.id,
          senderId: character.id,
          content: response.content,
        });
      } else if (response.error) {
        addMessage(currentChat.id, {
          chatId: currentChat.id,
          senderId: character.id,
          content: `오류가 발생했습니다: ${response.error}`,
        });
      }
    }

    setGenerating(null);
  };

  // 유저 메시지 수정 핸들러 - 수정 후 AI 응답 재생성
  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!currentChat || !character || isLoading) return;

    // 수정된 메시지의 인덱스 찾기
    const messageIndex = currentChat.messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;

    const editedMessage = currentChat.messages[messageIndex];

    const nextMessage = currentChat.messages[messageIndex + 1];
    const hasNextCharacterMessage = !!nextMessage && nextMessage.senderId === character.id;

    const userExistingBranchCount = editedMessage.branches?.length || 0;
    const characterExistingBranchCount = hasNextCharacterMessage
      ? (nextMessage.branches?.length || 0)
      : 0;

    // 유저 수정으로 시작된 리롤은 "유저 메시지"에 브랜치 네비게이션이 생기도록
    // 유저/캐릭터 브랜치 인덱스를 가능한 동일하게 맞춘다.
    const targetBranchIndex = hasNextCharacterMessage
      ? (Math.max(userExistingBranchCount, characterExistingBranchCount) + 1)
      : (userExistingBranchCount + 1);

    // 수정된 유저 메시지는 원본을 보존하고 "브랜치"로 추가
    const userFillersToAdd = Math.max(0, targetBranchIndex - userExistingBranchCount - 1);
    for (let i = 0; i < userFillersToAdd; i++) {
      addBranch(currentChat.id, messageId, {
        content: editedMessage.content,
        translatedContent: undefined,
      });
    }
    addBranch(currentChat.id, messageId, {
      content: newContent,
      translatedContent: undefined,
    });
    setBranchIndex(currentChat.id, messageId, targetBranchIndex);

    // AI 응답 재생성은 캐릭터 응답 유무와 무관하게 시도
    setGenerating(currentChatId!);

    // 수정된 메시지까지의 대화 내역으로 프롬프트 생성
    const messagesUpToEdit = currentChat.messages.slice(0, messageIndex);

    // 현재 시간 가져오기 (채팅방별 시간 설정 사용)
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

    if (response.error) {
      alert(`응답 재생성 오류: ${response.error}`);
    }

    const responseContent = response.error
      ? `오류가 발생했습니다: ${response.error}`
      : (response.content || '');

    // 수정된 유저 메시지 다음이 캐릭터 응답이면 기존 메시지에 브랜치를 추가하고 이동
    if (hasNextCharacterMessage) {
      const characterFillersToAdd = Math.max(0, targetBranchIndex - characterExistingBranchCount - 1);
      for (let i = 0; i < characterFillersToAdd; i++) {
        addBranch(currentChat.id, nextMessage.id, {
          content: nextMessage.content,
          translatedContent: undefined,
        });
      }
      addBranch(currentChat.id, nextMessage.id, {
        content: responseContent,
        translatedContent: undefined,
      });

      setBranchIndex(currentChat.id, nextMessage.id, targetBranchIndex);
    } else {
      // 캐릭터 응답이 아직 없으면 새 메시지로 추가
      addMessage(currentChat.id, {
        chatId: currentChat.id,
        senderId: character.id,
        content: responseContent,
      });
    }

    setGenerating(null);
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
          
          {/* 우측: 검색 */}
          <div className="flex items-center gap-[18px]">
            <svg className="w-6 h-6 cursor-pointer" fill="currentColor" viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
          </div>
        </div>

        {/* 요약 중 표시기 */}
        {isSummarizing && (
          <div className="bg-yellow-100 text-yellow-800 text-center py-1 text-sm">
            요약중...
          </div>
        )}

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto pb-[10px] px-2">
          {currentChat.messages.map((message, index) => {
            const prevMessage = index > 0 ? currentChat.messages[index - 1] : null;
            const nextMessage = index < currentChat.messages.length - 1 ? currentChat.messages[index + 1] : null;
            const isFirstInGroup = !prevMessage || prevMessage.senderId !== message.senderId;

            const prevUserHasBranches = !!prevMessage && prevMessage.senderId === 'user' && ((prevMessage.branches?.length || 0) > 0);
            const hideBranchNavigation = message.senderId === character.id && prevUserHasBranches;

            const handleBranchChange = (branchIndex: number) => {
              setBranchIndex(currentChat.id, message.id, branchIndex);

              // 유저 메시지에서 브랜치를 바꾸면 바로 다음 캐릭터 메시지도 같이 바뀌도록 동기화
              if (message.senderId === 'user' && nextMessage && nextMessage.senderId === character.id) {
                const maxBranchIndex = nextMessage.branches?.length || 0;
                setBranchIndex(currentChat.id, nextMessage.id, Math.min(branchIndex, maxBranchIndex));
              }
            };
            
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
                onBranchChange={handleBranchChange}
                onGenerateBranch={() => handleGenerateBranch(message.id, index)}
                hideBranchNavigation={hideBranchNavigation}
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
                isSticker={message.isSticker}
              />
            );
          })}
          {isLoading && (
            <div className="flex justify-center py-4">
              <button 
                onClick={handleCancelGeneration}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 hover:bg-white rounded-full shadow-sm transition-colors"
              >
                <div className="animate-spin w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full"></div>
                <span className="text-gray-600 text-[13px]">응답 생성 중...</span>
                <span className="text-red-500 text-[12px] font-medium">취소</span>
              </button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 카카오톡 스타일 입력창 */}
        {currentChat.mode === 'immersion' && (
          <ChatInput 
            onSend={handleSendMessage} 
            disabled={isLoading} 
            theme={currentChat.theme}
            onSendSticker={handleSendSticker}
            onOpenStickerManager={() => setShowStickerManager(true)}
          />
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
          </div>
        </header>

        {/* 요약 중 표시기 */}
        {isSummarizing && (
          <div className="bg-green-100 text-green-800 text-center py-1 text-sm">
            요약중...
          </div>
        )}

        {/* 메시지 영역 */}
        <div className="flex-1 overflow-y-auto pb-[10px] px-2">
          {currentChat.messages.map((message, index) => {
            const prevMessage = index > 0 ? currentChat.messages[index - 1] : null;
            const nextMessage = index < currentChat.messages.length - 1 ? currentChat.messages[index + 1] : null;
            const isFirstInGroup = !prevMessage || prevMessage.senderId !== message.senderId;

            const prevUserHasBranches = !!prevMessage && prevMessage.senderId === 'user' && ((prevMessage.branches?.length || 0) > 0);
            const hideBranchNavigation = message.senderId === character.id && prevUserHasBranches;

            const handleBranchChange = (branchIndex: number) => {
              setBranchIndex(currentChat.id, message.id, branchIndex);
              if (message.senderId === 'user' && nextMessage && nextMessage.senderId === character.id) {
                const maxBranchIndex = nextMessage.branches?.length || 0;
                setBranchIndex(currentChat.id, nextMessage.id, Math.min(branchIndex, maxBranchIndex));
              }
            };
            
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
                onBranchChange={handleBranchChange}
                onGenerateBranch={() => handleGenerateBranch(message.id, index)}
                hideBranchNavigation={hideBranchNavigation}
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
                isSticker={message.isSticker}
              />
            );
          })}
          {isLoading && (
            <div className="flex justify-center py-4">
              <button 
                onClick={handleCancelGeneration}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <div className="animate-spin w-4 h-4 border-2 border-white/40 border-t-white/80 rounded-full"></div>
                <span className="text-white/80 text-[13px]">응답 생성 중...</span>
                <span className="text-red-300 text-[12px] font-medium">취소</span>
              </button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 라인 스타일 입력창 */}
        {currentChat.mode === 'immersion' && (
          <ChatInput 
            onSend={handleSendMessage} 
            disabled={isLoading} 
            theme={currentChat.theme}
            onSendSticker={handleSendSticker}
            onOpenStickerManager={() => setShowStickerManager(true)}
          />
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
          <div className="flex-1 flex justify-end items-center gap-3 mb-[15px]">
            <svg className="w-[26px] h-[26px] cursor-pointer" fill="#007AFF" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          </div>
        </div>

        {/* 요약 중 표시기 */}
        {isSummarizing && (
          <div className="bg-blue-100 text-blue-800 text-center py-1 text-sm">
            요약중...
          </div>
        )}

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
            const prevMessage = index > 0 ? currentChat.messages[index - 1] : null;
            const nextMessage = index < currentChat.messages.length - 1 ? currentChat.messages[index + 1] : null;
            const isLastInGroup = !nextMessage || nextMessage.senderId !== message.senderId;

            const prevUserHasBranches = !!prevMessage && prevMessage.senderId === 'user' && ((prevMessage.branches?.length || 0) > 0);
            const hideBranchNavigation = message.senderId === character.id && prevUserHasBranches;

            const handleBranchChange = (branchIndex: number) => {
              setBranchIndex(currentChat.id, message.id, branchIndex);
              if (message.senderId === 'user' && nextMessage && nextMessage.senderId === character.id) {
                const maxBranchIndex = nextMessage.branches?.length || 0;
                setBranchIndex(currentChat.id, nextMessage.id, Math.min(branchIndex, maxBranchIndex));
              }
            };
            
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
                onBranchChange={handleBranchChange}
                onGenerateBranch={() => handleGenerateBranch(message.id, index)}
                hideBranchNavigation={hideBranchNavigation}
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
                isSticker={message.isSticker}
              />
            );
          })}
          {isLoading && (
            <div className="flex justify-center py-4">
              <button 
                onClick={handleCancelGeneration}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              >
                <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full"></div>
                <span className="text-[#8e8e93] text-[13px]">응답 생성 중...</span>
                <span className="text-red-500 text-[12px] font-medium">취소</span>
              </button>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* iMessage 스타일 입력창 */}
        {currentChat.mode === 'immersion' && (
          <ChatInput 
            onSend={handleSendMessage} 
            disabled={isLoading} 
            theme={currentChat.theme}
            onSendSticker={handleSendSticker}
            onOpenStickerManager={() => setShowStickerManager(true)}
          />
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

      {/* 요약 중 표시기 */}
      {isSummarizing && (
        <div className="bg-gray-100 text-gray-800 text-center py-1 text-sm">
          요약중...
        </div>
      )}

      {/* 메시지 영역 */}
      <div className={`flex-1 overflow-y-auto p-4 ${themeConfig.background}`}>
        {currentChat.messages.map((message, index) => {
          const prevMessage = index > 0 ? currentChat.messages[index - 1] : null;
          const nextMessage = index < currentChat.messages.length - 1 ? currentChat.messages[index + 1] : null;
          const isFirstInGroup = !prevMessage || prevMessage.senderId !== message.senderId;

          const prevUserHasBranches = !!prevMessage && prevMessage.senderId === 'user' && ((prevMessage.branches?.length || 0) > 0);
          const hideBranchNavigation = message.senderId === character.id && prevUserHasBranches;

          const handleBranchChange = (branchIndex: number) => {
            setBranchIndex(currentChat.id, message.id, branchIndex);
            if (message.senderId === 'user' && nextMessage && nextMessage.senderId === character.id) {
              const maxBranchIndex = nextMessage.branches?.length || 0;
              setBranchIndex(currentChat.id, nextMessage.id, Math.min(branchIndex, maxBranchIndex));
            }
          };
          
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
              onBranchChange={handleBranchChange}
              onGenerateBranch={() => handleGenerateBranch(message.id, index)}
              hideBranchNavigation={hideBranchNavigation}
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
              isSticker={message.isSticker}
            />
          );
        })}
        {isLoading && (
          <div className="flex justify-center py-4">
            <button 
              onClick={handleCancelGeneration}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              <div className="animate-spin w-4 h-4 border-2 border-gray-300 border-t-gray-500 rounded-full"></div>
              <span className="text-gray-500 text-[13px]">응답 생성 중...</span>
              <span className="text-red-500 text-[12px] font-medium">취소</span>
            </button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 (몰입 모드일 때만) */}
      {currentChat.mode === 'immersion' && (
        <ChatInput 
          onSend={handleSendMessage} 
          disabled={isLoading} 
          theme={currentChat.theme}
          onSendSticker={handleSendSticker}
          onOpenStickerManager={() => setShowStickerManager(true)}
        />
      )}

      {/* 스티커 관리 모달 */}
      {showStickerManager && (
        <StickerManager onClose={() => setShowStickerManager(false)} />
      )}
    </div>
  );
}
