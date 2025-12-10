import { useState, useRef, useEffect } from 'react';
import { useChatStore } from '@/stores';
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
  isLastCharacterMessage?: boolean;
  onTranslate?: () => void;
  isTranslating?: boolean;
  isFirstInGroup?: boolean;
  showTime?: boolean;
  theme?: ThemeType;
  onEdit?: (newContent: string) => void;
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
  onTranslate,
  isTranslating,
  isFirstInGroup = true,
  showTime = true,
  theme,
  onEdit,
}: ChatBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 채팅 테마 사용 (전달된 theme 또는 현재 채팅방의 theme)
  const { chats, currentChatId } = useChatStore();
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

  // 줄바꿈으로 메시지 분리 (각각 다른 말풍선으로 표시)
  const messageLines = displayContent.split('\n').filter(line => line.trim() !== '');

  // 편집 모드 진입 시 textarea에 포커스
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(editedContent.length, editedContent.length);
    }
  }, [isEditing]);

  const formatTime = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleTimeString('ko-KR', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
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
      {hasBranches && (
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
      {hasBranches && (
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

  // 호버 시 표시되는 번역 버튼
  const TranslateButton = () => (
    <div 
      className={`absolute top-1/2 -translate-y-1/2 ${isUser ? '-left-8' : '-right-8'} transition-opacity duration-150 ${isHovered && onTranslate && !displayTranslation ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      style={{ zIndex: 20 }}
    >
      <button
        onClick={onTranslate}
        disabled={isTranslating}
        className="p-1.5 rounded-full bg-white hover:bg-gray-100 text-gray-600 transition-colors shadow-sm border border-gray-200"
        title="번역"
      >
        <TranslateIcon />
      </button>
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

  // iMessage 테마 렌더링
  if (effectiveTheme === 'imessage') {
    const bubbleBgColor = isUser ? '#007AFF' : '#E9E9EB';
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
            <div className={`relative flex flex-col gap-[2px] ${isUser ? 'items-end' : 'items-start'}`} ref={bubbleRef}>
              {isEditing ? (
                renderEditMode('18px', '10px 14px')
              ) : (
                <>
                  {messageLines.map((line, idx) => {
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
                          backgroundColor: bubbleBgColor,
                          color: textColor,
                          padding: '7px 14px',
                          borderRadius,
                          maxWidth: '100%',
                        }}
                      >
                        {line}
                      </div>
                    );
                  })}
                  
                  {displayTranslation && (
                    <div
                      className="text-[11px] leading-[1.35] break-words inline-block opacity-70"
                      style={{
                        backgroundColor: isUser ? 'rgba(0,122,255,0.5)' : 'rgba(0,0,0,0.05)',
                        color: textColor,
                        padding: '5px 14px',
                        borderRadius: '12px',
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
            <div className={`relative flex flex-col gap-[2px] ${isUser ? 'items-end' : 'items-start'}`} ref={bubbleRef}>
              {isEditing ? (
                renderEditMode(themeConfig.chatBubble.borderRadius, '8px 12px')
              ) : (
                <>
                  {messageLines.map((line, idx) => {
                    const isFirst = idx === 0;
                    const showTail = isFirst && isFirstInGroup && themeConfig.chatBubble.tailUser && themeConfig.chatBubble.tailPartner;
                    
                    return (
                      <div key={idx} className="relative inline-block">
                        <div
                          className={`${themeConfig.chatBubble.fontSize} ${themeConfig.chatBubble.lineHeight} break-words inline-block`}
                          style={{
                            backgroundColor: bubbleBgColor,
                            color: textColor,
                            padding: '5px 9px',
                            borderRadius: themeConfig.chatBubble.borderRadius,
                            boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
                            maxWidth: '220px',
                          }}
                        >
                          {line}
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
                  
                  {displayTranslation && (
                    <div
                      className="text-[11px] leading-[1.35] break-words inline-block opacity-70"
                      style={{
                        backgroundColor: isUser ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.03)',
                        color: textColor,
                        padding: '4px 9px',
                        borderRadius: themeConfig.chatBubble.borderRadius,
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
          <div className={`relative flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`} ref={bubbleRef}>
            {isEditing ? (
              renderEditMode('0.75rem', '10px 16px')
            ) : (
              <>
                {messageLines.map((line, idx) => (
                  <div 
                    key={idx}
                    className={`px-4 py-2.5 rounded-xl inline-block break-words ${idx === 0 && isUser ? 'rounded-tr-sm' : ''} ${idx === 0 && !isUser ? 'rounded-tl-sm' : ''} ${isUser ? themeConfig.chatBubble.user : themeConfig.chatBubble.partner} ${themeConfig.chatBubble.fontSize} ${themeConfig.chatBubble.lineHeight}`}
                    style={{ maxWidth: '100%' }}
                  >
                    {line}
                  </div>
                ))}
                
                {displayTranslation && (
                  <div className="text-xs px-4 py-2 rounded-xl bg-gray-100 opacity-80 inline-block break-words" style={{ maxWidth: '100%' }}>
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
