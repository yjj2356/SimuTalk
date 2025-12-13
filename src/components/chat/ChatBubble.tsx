import { useState, useRef, useEffect } from 'react';
import { useChatStore, useStickerStore } from '@/stores';
import { getThemeConfig } from '@/utils/theme';
import { Character, MessageBranch, ThemeType } from '@/types';

interface ChatBubbleProps {
  content: string;
  isUser: boolean;
  character?: Character;
  translatedContent?: string;
  timestamp: number;
  branches?: MessageBranch[];
  currentBranchIndex: number;
  onBranchChange?: (index: number) => void;
  onGenerateBranch?: () => void;
  hideBranchNavigation?: boolean;
  isLastCharacterMessage?: boolean;
  onTranslate?: () => void;
  onRetranslate?: () => void;
  isTranslating?: boolean;
  isFirstInGroup?: boolean;
  showTime?: boolean;
  theme?: ThemeType;
  onEdit?: (newContent: string) => void;
  formatTimeFunc?: (ts: number) => string;
  imageData?: string; // Base64 인코딩된 이미지 데이터
  imageMimeType?: string; // 이미지 MIME 타입
  isSticker?: boolean; // 스티커 메시지 여부
}

export function ChatBubble({
  content,
  isUser,
  character,
  translatedContent,
  timestamp,
  branches,
  currentBranchIndex,
  onBranchChange,
  onGenerateBranch,
  hideBranchNavigation = false,
  onTranslate,
  onRetranslate,
  isTranslating,
  isFirstInGroup = true,
  showTime = true,
  theme,
  onEdit,
  formatTimeFunc,
  imageData,
  imageMimeType,
  isSticker,
}: ChatBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [showTranslation, setShowTranslation] = useState(true); // 번역 보이기/숨기기
  const bubbleRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // 채팅 테마 사용 (전달된 theme 또는 현재 채팅방의 theme)
  const { chats, currentChatId } = useChatStore();
  const { stickers } = useStickerStore();
  const currentChat = chats.find(c => c.id === currentChatId);
  const effectiveTheme = theme || currentChat?.theme || 'kakao';
  const themeConfig = getThemeConfig(effectiveTheme);

  const showProfile = !isUser && themeConfig.showProfilePicture && isFirstInGroup;
  const showProfileSpace = !isUser && themeConfig.showProfilePicture;

  // 현재 표시할 내용 결정
  const displayContent = currentBranchIndex === 0 
    ? content 
    : branches?.[currentBranchIndex - 1]?.content || content;
  
  const displayTranslation = currentBranchIndex === 0
    ? translatedContent
    : branches?.[currentBranchIndex - 1]?.translatedContent;

  const totalVersions = 1 + (branches?.length || 0);
  const hasBranches = totalVersions > 1;

  // [[이모티콘이름]] 또는 [이모티콘이름] 패턴을 찾아서 이미지로 변환하는 함수
  const renderTextWithStickers = (text: string) => {
    // [[이모티콘이름]] 또는 [이모티콘이름] 패턴 매칭 (이중 대괄호 우선)
    const stickerPattern = /\[\[([^\]]+)\]\]|\[([^\]]+)\]/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;
    let keyIndex = 0;

    while ((match = stickerPattern.exec(text)) !== null) {
      // 매치 이전의 텍스트 추가
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }

      // match[1]은 [[...]]에서 캡처, match[2]는 [...]에서 캡처
      const stickerName = match[1] || match[2];
      // 이모티콘 찾기 (이름으로 매칭)
      const sticker = stickers.find(s => 
        s.name.toLowerCase() === stickerName.toLowerCase() ||
        s.name.toLowerCase().includes(stickerName.toLowerCase()) ||
        stickerName.toLowerCase().includes(s.name.toLowerCase())
      );

      if (sticker) {
        // 이모티콘 이미지로 렌더링
        parts.push(
          <img
            key={`sticker-${keyIndex++}`}
            src={`data:${sticker.mimeType};base64,${sticker.imageData}`}
            alt={sticker.name}
            className="inline-block align-middle"
            style={{ 
              width: '80px', 
              height: '80px', 
              objectFit: 'contain',
              verticalAlign: 'middle',
              margin: '2px',
            }}
          />
        );
      } else {
        // 이모티콘을 찾지 못하면 원본 텍스트 유지
        parts.push(match[0]);
      }

      lastIndex = match.index + match[0].length;
    }

    // 나머지 텍스트 추가
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  // 메시지가 오직 스티커만 포함하는지 확인
  const isOnlySticker = (text: string): boolean => {
    const trimmed = text.trim();
    // [[이모티콘]] 또는 [이모티콘] 형식만 있는지 확인
    const stickerPattern = /^(\[\[[^\]]+\]\]|\[[^\]]+\])$/;
    if (!stickerPattern.test(trimmed)) return false;
    
    // 실제로 해당 이모티콘이 존재하는지도 확인
    const nameMatch = trimmed.match(/\[\[([^\]]+)\]\]|\[([^\]]+)\]/);
    if (!nameMatch) return false;
    const stickerName = nameMatch[1] || nameMatch[2];
    return stickers.some(s => 
      s.name.toLowerCase() === stickerName.toLowerCase() ||
      s.name.toLowerCase().includes(stickerName.toLowerCase()) ||
      stickerName.toLowerCase().includes(s.name.toLowerCase())
    );
  };

  // [이름]: 형식 제거 함수
  const cleanSpeakerPrefix = (text: string): string => {
    // [이름]: 또는 이름: 형식 제거
    return text.replace(/^\[[^\]]+\]:\s*/, '').replace(/^[^:\n]+:\s*/, '');
  };

  // 줄바꿈으로 메시지 분리 (각각 다른 말풍선으로 표시) + [이름]: 제거
  const messageLines = displayContent
    .split('\n')
    .map(line => cleanSpeakerPrefix(line.trim()))
    .filter(line => line !== '');

  // 편집 모드 진입 시 textarea에 포커스
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editedContent.length, editedContent.length);
    }
  }, [isEditing]);

  const formatTime = (ts: number) => {
    // 외부에서 전달된 formatTimeFunc이 있으면 사용
    if (formatTimeFunc) {
      return formatTimeFunc(ts);
    }
    const date = new Date(ts);
    return date.toLocaleTimeString('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  // 번역 토글 핸들러
  const handleToggleTranslation = () => {
    if (displayTranslation) {
      setShowTranslation(!showTranslation);
    } else if (onTranslate) {
      onTranslate();
    }
  };

  const handlePrevBranch = () => {
    if (currentBranchIndex > 0 && onBranchChange) {
      onBranchChange(currentBranchIndex - 1);
    }
  };

  const handleNextBranch = () => {
    if (currentBranchIndex < totalVersions - 1 && onBranchChange) {
      onBranchChange(currentBranchIndex + 1);
    }
  };

  const handleEditClick = () => {
    setEditedContent(displayContent);
    setIsEditing(true);
  };

  const handleEditSave = () => {
    if (onEdit && editedContent.trim() !== displayContent) {
      onEdit(editedContent.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditedContent(displayContent);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  // 수정 아이콘 SVG
  const EditIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  // 번역 아이콘 SVG
  const TranslateIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
  );

  // 리롤 아이콘 SVG
  const RerollIcon = () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );

  // 유저 메시지 액션 버튼
  const UserActionButtons = () => (
    <div 
      className={`absolute -bottom-1 right-0 flex items-center gap-1 transition-opacity duration-150 ${isHovered && !isEditing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ zIndex: 10 }}
    >
      {/* 수정 버튼 */}
      {onEdit && (
        <button
          onClick={handleEditClick}
          className="p-1 rounded bg-white/80 hover:bg-white text-gray-600 shadow-sm border border-gray-200"
          title="메시지 수정"
        >
          <EditIcon />
        </button>
      )}
      {/* 분기 네비게이션: 분기가 있을 때만 항상 표시 */}
      {hasBranches && !hideBranchNavigation && (
        <div className="flex items-center gap-0.5 bg-white/80 rounded px-1 shadow-sm border border-gray-200">
          <button
            onClick={handlePrevBranch}
            disabled={currentBranchIndex === 0}
            className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed text-gray-600"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-[9px] text-gray-600">{currentBranchIndex + 1}/{totalVersions}</span>
          <button
            onClick={handleNextBranch}
            disabled={currentBranchIndex >= totalVersions - 1}
            className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed text-gray-600"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );

  // 캐릭터 메시지 액션 버튼 (리롤 + 분기 네비게이션)
  const CharacterActionButtons = () => (
    <div 
      className={`absolute -bottom-1 left-0 flex items-center gap-1 transition-opacity duration-150 ${isHovered && !isEditing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ zIndex: 10 }}
    >
      {/* 리롤 버튼 */}
      {onGenerateBranch && (
        <button
          onClick={onGenerateBranch}
          className="p-1 rounded bg-white/80 hover:bg-white text-gray-600 shadow-sm border border-gray-200"
          title="다른 답변 생성"
        >
          <RerollIcon />
        </button>
      )}
      {/* 분기 네비게이션: 분기가 있을 때만 표시 */}
      {hasBranches && !hideBranchNavigation && (
        <div className="flex items-center gap-0.5 bg-white/80 rounded px-1 shadow-sm border border-gray-200">
          <button
            onClick={handlePrevBranch}
            disabled={currentBranchIndex === 0}
            className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed text-gray-600"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-[9px] text-gray-600">{currentBranchIndex + 1}/{totalVersions}</span>
          <button
            onClick={handleNextBranch}
            disabled={currentBranchIndex >= totalVersions - 1}
            className="p-0.5 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed text-gray-600"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );

  // 호버 시 표시되는 번역 버튼 (번역이 있으면 토글, 없으면 번역 요청) + 번역 리롤 버튼
  const TranslateButton = () => (
    <div 
      className={`absolute top-1/2 -translate-y-1/2 ${isUser ? '-left-8' : '-right-8'} transition-opacity duration-150 flex items-center gap-1 ${isHovered && (onTranslate || displayTranslation) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ zIndex: 20 }}
    >
      <button
        onClick={handleToggleTranslation}
        disabled={isTranslating}
        className={`p-1.5 rounded-full hover:bg-gray-100 transition-colors shadow-sm border border-gray-200 ${
          displayTranslation && showTranslation 
            ? 'bg-blue-100 text-blue-600' 
            : 'bg-white text-gray-600'
        }`}
        title={displayTranslation ? (showTranslation ? '번역 숨기기' : '번역 보기') : '번역'}
      >
        <TranslateIcon />
      </button>
      {/* 번역 리롤 버튼 - 번역이 있고 보이는 상태일 때만 표시 */}
      {displayTranslation && showTranslation && onRetranslate && (
        <button
          onClick={onRetranslate}
          disabled={isTranslating}
          className="p-1.5 rounded-full bg-white hover:bg-gray-100 text-gray-600 transition-colors shadow-sm border border-gray-200"
          title="번역 다시하기"
        >
          <RerollIcon />
        </button>
      )}
    </div>
  );

  // 수정 모드 렌더링 (모든 테마 공통)
  const renderEditMode = (borderRadius: string, padding: string) => (
    <div
      className="text-[14px] leading-[1.35] break-all z-10 min-w-[200px]"
      style={{
        backgroundColor: '#ffffff',
        border: '2px solid #3B82F6',
        color: '#000000',
        padding: padding,
        borderRadius: borderRadius,
      }}
    >
      <textarea
        ref={textareaRef}
        value={editedContent}
        onChange={(e) => setEditedContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full bg-transparent resize-none outline-none min-h-[60px] text-black"
        placeholder="메시지를 입력하세요..."
        rows={Math.max(2, editedContent.split('\n').length)}
      />
      <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-gray-200">
        <button 
          onClick={handleEditCancel} 
          className="px-3 py-1 text-[11px] rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium"
        >
          취소
        </button>
        <button 
          onClick={handleEditSave} 
          className="px-3 py-1 text-[11px] rounded-md bg-blue-500 hover:bg-blue-600 text-white font-medium"
        >
          저장
        </button>
      </div>
    </div>
  );

  // 이미지 렌더링 컴포넌트
  const ImageBubble = ({ borderRadius }: { borderRadius: string }) => (
    imageData && imageMimeType ? (
      <div 
        className="overflow-hidden"
        style={{ 
          borderRadius: isSticker ? '0' : borderRadius,
          maxWidth: isSticker ? '100px' : '220px',
          background: isSticker ? 'transparent' : undefined,
        }}
      >
        <img 
          src={`data:${imageMimeType};base64,${imageData}`}
          alt={isSticker ? "스티커" : "첨부 이미지"}
          className={`max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity ${isSticker ? 'hover:scale-105' : ''}`}
          style={{ 
            maxHeight: isSticker ? '100px' : '200px',
            objectFit: 'contain',
          }}
          onClick={() => {
            // 클릭 시 새 창에서 이미지 열기
            const win = window.open();
            if (win) {
              win.document.write(`<img src="data:${imageMimeType};base64,${imageData}" style="max-width: 100%; height: auto;" />`);
            }
          }}
        />
      </div>
    ) : null
  );

  // iMessage 테마 렌더링
  if (effectiveTheme === 'imessage') {
    // imessageColor 설정에 따라 색상 결정 (blue: #007AFF, green: #38DA61)
    const imessageColor = currentChat?.imessageColor || 'blue';
    const bubbleBgColor = isUser 
      ? (imessageColor === 'green' ? '#38DA61' : '#007AFF')
      : '#E9E9EB';
    const textColor = isUser ? '#FFFFFF' : '#000000';
    
    return (
      <div 
        className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
        style={{ marginBottom: '2px' }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`} style={{ maxWidth: '70%' }}>
          <div className={`flex items-end ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-1`}>
            {/* 말풍선들 */}
            <div className={`relative flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`} ref={bubbleRef}>
              {isEditing ? (
                renderEditMode('18px', '10px 14px')
              ) : (
                <>
                  {/* 이미지가 있으면 먼저 표시 */}
                  <ImageBubble borderRadius={isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px'} />
                  
                  {/* 스티커가 아닐 때만 텍스트 말풍선 표시 */}
                  {!isSticker && messageLines.map((line, idx) => {
                    const isFirst = idx === 0;
                    const isLast = idx === messageLines.length - 1;
                    
                    // 말풍선 모양 결정
                    let borderRadius = '18px';
                    if (messageLines.length > 1) {
                      if (isUser) {
                        if (isFirst) borderRadius = '18px 18px 4px 18px';
                        else if (isLast) borderRadius = '18px 4px 18px 18px';
                        else borderRadius = '18px 4px 4px 18px';
                      } else {
                        if (isFirst) borderRadius = '18px 18px 18px 4px';
                        else if (isLast) borderRadius = '4px 18px 18px 18px';
                        else borderRadius = '4px 18px 18px 4px';
                      }
                    } else {
                      borderRadius = isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px';
                    }
                    
                    return (
                      <div
                        key={idx}
                        className="text-[14px] leading-[1.35] break-words inline-block"
                        style={{
                          backgroundColor: isOnlySticker(line) ? 'transparent' : bubbleBgColor,
                          color: textColor,
                          padding: isOnlySticker(line) ? '0' : '7px 14px',
                          borderRadius,
                          maxWidth: '100%',
                        }}
                      >
                        {renderTextWithStickers(line)}
                      </div>
                    );
                  })}
                  
                  {displayTranslation && showTranslation && (
                    <div
                      className="text-[11px] leading-[1.35] break-words inline-block opacity-70"
                      style={{
                        backgroundColor: isUser ? 'rgba(0,122,255,0.5)' : 'rgba(0,0,0,0.05)',
                        color: textColor,
                        padding: '5px 14px',
                        borderRadius: '12px',
                        whiteSpace: 'pre-wrap',
                        alignSelf: isUser ? 'flex-end' : 'flex-start',
                      }}
                    >
                      {displayTranslation}
                    </div>
                  )}
                </>
              )}

              {/* 호버 시 액션 버튼 */}
              {isUser ? <UserActionButtons /> : <CharacterActionButtons />}
              
              {/* 번역 버튼 */}
              <TranslateButton />
            </div>

            {/* 시간 */}
            {showTime && !isEditing && (
              <span className="text-[10px] text-gray-500 mb-1 flex-shrink-0">
                {formatTime(timestamp)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 카카오톡/라인 테마 렌더링 (메시지 각 줄마다 별도 말풍선)
  if (effectiveTheme === 'kakao' || effectiveTheme === 'line') {
    const bubbleBgColor = isUser ? themeConfig.chatBubble.userBgColor : themeConfig.chatBubble.partnerBgColor;
    const textColor = (effectiveTheme === 'line' || !isUser) ? '#222222' : '#000000';
    
    return (
      <div 
        className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
        style={{ marginBottom: themeConfig.messageGap }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* 캐릭터 프로필 이미지 */}
        {showProfileSpace && (
          <div className="flex-shrink-0 mr-[6px]">
            {showProfile ? (
              (character?.fieldProfile?.profileImage || character?.freeProfileImage) ? (
                <img
                  src={character.fieldProfile?.profileImage || character.freeProfileImage}
                  alt=""
                  className="w-[33px] h-[33px] object-cover bg-[#D5E1E9]"
                  style={{ borderRadius: themeConfig.profileRadius }}
                />
              ) : (
                <div 
                  className="w-[33px] h-[33px] bg-[#D5E1E9] flex items-center justify-center"
                  style={{ borderRadius: themeConfig.profileRadius }}
                >
                  <span className="text-gray-500 text-xs font-medium">
                    {(character?.fieldProfile?.name || character?.freeProfileName || '?').charAt(0)}
                  </span>
                </div>
              )
            ) : (
              <div className="w-[33px] h-[33px]" style={{ visibility: 'hidden' }} />
            )}
          </div>
        )}

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`} style={{ maxWidth: '70%' }}>
          {/* 이름 (캐릭터 첫 메시지만) */}
          {!isUser && isFirstInGroup && (
            <span className={themeConfig.senderName.style}>
              {character?.fieldProfile?.name || character?.freeProfileName || ''}
            </span>
          )}

          <div className={`flex items-end ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-1`}>
            {/* 말풍선들 */}
            <div className={`relative flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`} ref={bubbleRef}>
              {isEditing ? (
                renderEditMode(themeConfig.chatBubble.borderRadius, '8px 12px')
              ) : (
                <>
                  {/* 이미지가 있으면 먼저 표시 */}
                  <ImageBubble borderRadius={themeConfig.chatBubble.borderRadius} />
                  
                  {/* 스티커가 아닐 때만 텍스트 말풍선 표시 */}
                  {!isSticker && messageLines.map((line, idx) => {
                    const isFirst = idx === 0;
                    const showTail = isFirst && isFirstInGroup && themeConfig.chatBubble.tailUser && themeConfig.chatBubble.tailPartner;
                    
                    return (
                      <div key={idx} className="relative inline-block">
                        <div
                          className={`${themeConfig.chatBubble.fontSize} ${themeConfig.chatBubble.lineHeight} break-words inline-block`}
                          style={{
                            backgroundColor: isOnlySticker(line) ? 'transparent' : bubbleBgColor,
                            color: textColor,
                            padding: isOnlySticker(line) ? '0' : '5px 9px',
                            borderRadius: themeConfig.chatBubble.borderRadius,
                            boxShadow: isOnlySticker(line) ? 'none' : '0 1px 1px rgba(0,0,0,0.05)',
                            maxWidth: '220px',
                          }}
                        >
                          {renderTextWithStickers(line)}
                        </div>
                        
                        {/* 말풍선 꼬리 (첫 번째 말풍선에만) */}
                        {showTail && idx === 0 && (
                          <div
                            className="absolute top-[6px] w-0 h-0"
                            style={isUser ? {
                              right: '-4px',
                              borderTop: `7px solid ${bubbleBgColor}`,
                              borderRight: '7px solid transparent',
                            } : {
                              left: '-4px',
                              borderTop: `7px solid ${bubbleBgColor}`,
                              borderLeft: '7px solid transparent',
                            }}
                          />
                        )}
                      </div>
                    );
                  })}
                  
                  {displayTranslation && showTranslation && (
                    <div
                      className="text-[11px] leading-[1.35] break-words inline-block opacity-70"
                      style={{
                        backgroundColor: isUser ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.03)',
                        color: textColor,
                        padding: '4px 9px',
                        borderRadius: themeConfig.chatBubble.borderRadius,
                        whiteSpace: 'pre-wrap',
                        maxWidth: '220px',
                      }}
                    >
                      {displayTranslation}
                    </div>
                  )}
                </>
              )}

              {/* 호버 시 액션 버튼 */}
              {isUser ? <UserActionButtons /> : <CharacterActionButtons />}
              
              {/* 번역 버튼 */}
              <TranslateButton />
            </div>

            {/* 시간 */}
            {showTime && !isEditing && (
              <span className={`${themeConfig.time.style} min-w-[40px] mb-0 ${isUser ? 'text-right' : 'text-left'}`}>
                {formatTime(timestamp)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 기본/기타 테마 렌더링
  return (
    <div 
      className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 프로필 이미지 */}
      {showProfileSpace && (
        <div className="flex-shrink-0 self-end mb-1">
          {showProfile ? (
            (character?.fieldProfile?.profileImage || character?.freeProfileImage) ? (
              <img
                src={character.fieldProfile?.profileImage || character.freeProfileImage}
                alt=""
                className={`${themeConfig.profileStyle} object-cover shadow-sm border border-gray-100`}
              />
            ) : (
              <div className={`${themeConfig.profileStyle} bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 text-xs font-medium shadow-sm`}>
                {(character?.fieldProfile?.name || character?.freeProfileName || '?').charAt(0)}
              </div>
            )
          ) : (
            <div className={themeConfig.profileStyle} style={{ visibility: 'hidden' }} />
          )}
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`} style={{ maxWidth: '70%' }}>
        {/* 이름 */}
        {!isUser && isFirstInGroup && themeConfig.showProfilePicture && (
          <span className={themeConfig.senderName.style}>
            {character?.fieldProfile?.name || character?.freeProfileName}
          </span>
        )}

        <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* 말풍선들 */}
          <div className={`relative flex flex-col gap-2 ${isUser ? 'items-end' : 'items-start'}`} ref={bubbleRef}>
            {isEditing ? (
              renderEditMode('0.75rem', '10px 16px')
            ) : (
              <>
                {/* 이미지가 있으면 먼저 표시 */}
                <ImageBubble borderRadius="0.75rem" />
                
                {/* 스티커가 아닐 때만 텍스트 말풍선 표시 */}
                {!isSticker && messageLines.map((line, idx) => (
                  <div 
                    key={idx}
                    className={`px-4 py-2.5 rounded-xl inline-block break-words ${idx === 0 && isUser ? 'rounded-tr-sm' : ''} ${idx === 0 && !isUser ? 'rounded-tl-sm' : ''} ${isUser ? themeConfig.chatBubble.user : themeConfig.chatBubble.partner} ${themeConfig.chatBubble.fontSize} ${themeConfig.chatBubble.lineHeight}`}
                    style={{ 
                      maxWidth: '100%',
                      backgroundColor: isOnlySticker(line) ? 'transparent' : undefined,
                      padding: isOnlySticker(line) ? '0' : undefined,
                    }}
                  >
                    {renderTextWithStickers(line)}
                  </div>
                ))}
                
                {displayTranslation && showTranslation && (
                  <div className="text-xs px-4 py-2 rounded-xl bg-gray-100 opacity-80 inline-block break-words" style={{ maxWidth: '100%', whiteSpace: 'pre-wrap' }}>
                    {displayTranslation}
                  </div>
                )}
              </>
            )}

            {/* 호버 시 액션 버튼 */}
            {isUser ? <UserActionButtons /> : <CharacterActionButtons />}
            
            {/* 번역 버튼 */}
            <TranslateButton />
          </div>

          {/* 시간 */}
          {showTime && !isEditing && (
            <span className={`${themeConfig.time.style} flex-shrink-0`}>
              {formatTime(timestamp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
