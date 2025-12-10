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
  isLastCharacterMessage,
  onTranslate,
  isTranslating,
  isFirstInGroup = true,
  showTime = true,
  theme,
}: ChatBubbleProps) {
  // 채팅방 테마 사용 (전달된 theme 또는 현재 채팅방의 theme)
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
  const hasBranches = totalVersions > 1 || (!isUser && onGenerateBranch);

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
    } else if (currentBranchIndex === totalVersions - 1 && onGenerateBranch) {
      onGenerateBranch();
    }
  };

  // iMessage 스타일 렌더링
  if (effectiveTheme === 'imessage') {
    const hasTail = isFirstInGroup; // isFirstInGroup은 실제로 마지막 메시지(꼬리 있는 메시지)를 의미
    const marginBottom = hasTail ? '8px' : '2px';
    
    return (
      <div 
        className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
        style={{ marginBottom }}
      >
        <div className="flex flex-col max-w-[70%]">
          <div className={`flex items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* 말풍선 */}
            <div className="relative">
              <div
                className="text-[14px] leading-[1.35] break-all z-10"
                style={{
                  backgroundColor: isUser ? '#007AFF' : '#E9E9EB',
                  color: isUser ? '#FFFFFF' : '#000000',
                  padding: '7px 14px',
                  borderRadius: hasTail 
                    ? (isUser ? '18px 18px 2px 18px' : '18px 18px 18px 2px')
                    : '18px',
                  marginLeft: isUser ? '0' : '5px',
                  marginRight: isUser ? '5px' : '0',
                }}
              >
                <p className="whitespace-pre-wrap">{displayContent}</p>
                
                {displayTranslation && (
                  <p 
                    className="text-[11px] mt-1.5 pt-1.5 opacity-70"
                    style={{ borderTop: `1px solid ${isUser ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}` }}
                  >
                    {displayTranslation}
                  </p>
                )}

                {/* 분기 네비게이션 */}
                {!isUser && hasBranches && (
                  <div 
                    className="flex items-center justify-center gap-2 mt-2 pt-1.5"
                    style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}
                  >
                    <button
                      onClick={handlePrevBranch}
                      disabled={currentBranchIndex === 0}
                      className="p-0.5 hover:bg-black/5 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-[9px] opacity-60">{currentBranchIndex + 1}/{totalVersions}</span>
                    <button
                      onClick={handleNextBranch}
                      className="p-0.5 hover:bg-black/5 rounded"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* 번역 버튼 */}
                {!isUser && isLastCharacterMessage && onTranslate && !displayTranslation && (
                  <div 
                    className="mt-1.5 pt-1.5"
                    style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}
                  >
                    <button
                      onClick={onTranslate}
                      disabled={isTranslating}
                      className="w-full py-1 text-[10px] opacity-60 hover:opacity-100 disabled:opacity-30"
                    >
                      {isTranslating ? '번역 중...' : '🌐 번역'}
                    </button>
                  </div>
                )}
              </div>

              {/* iMessage 스타일 말풍선 꼬리 */}
              {hasTail && (
                <>
                  {/* 꼬리 본체 */}
                  <div
                    className="absolute bottom-0 w-[10px] h-[16px] z-[-1]"
                    style={{
                      backgroundColor: isUser ? '#007AFF' : '#E9E9EB',
                      ...(isUser 
                        ? { right: '-6px', borderBottomLeftRadius: '10px' }
                        : { left: '-6px', borderBottomRightRadius: '10px' }
                      ),
                    }}
                  />
                  {/* 꼬리 마스크 (배경색으로 덮어서 곡선 효과) */}
                  <div
                    className="absolute bottom-0 w-[10px] h-[16px] bg-white z-0"
                    style={{
                      ...(isUser 
                        ? { right: '-10px', borderBottomLeftRadius: '10px' }
                        : { left: '-10px', borderBottomRightRadius: '10px' }
                      ),
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 카카오톡/라인 스타일 렌더링 (메시지 앱 스타일)
  if (effectiveTheme === 'kakao' || effectiveTheme === 'line') {
    const bubbleBgColor = isUser ? themeConfig.chatBubble.userBgColor : themeConfig.chatBubble.partnerBgColor;
    const textColor = (effectiveTheme === 'line' || !isUser) ? '#222222' : '#000000';
    
    return (
      <div 
        className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
        style={{ marginBottom: themeConfig.messageGap }}
      >
        {/* 상대방: 프로필 이미지 */}
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

        <div className="flex flex-col">
          {/* 이름 (상대방, 첫 메시지만) */}
          {!isUser && isFirstInGroup && (
            <span className={themeConfig.senderName.style}>
              {character?.fieldProfile?.name || character?.freeProfileName || ''}
            </span>
          )}

          <div className={`flex items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* 말풍선 */}
            <div className="relative">
              <div
                className={`${themeConfig.chatBubble.fontSize} ${themeConfig.chatBubble.lineHeight} max-w-[220px] break-all z-10`}
                style={{
                  backgroundColor: bubbleBgColor,
                  color: textColor,
                  padding: '5px 9px',
                  borderRadius: themeConfig.chatBubble.borderRadius,
                  marginLeft: isUser ? '5px' : '0',
                  marginRight: isUser ? '0' : '5px',
                  boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
                }}
              >
                <p className="whitespace-pre-wrap">{displayContent}</p>
                
                {displayTranslation && (
                  <p 
                    className="text-[11px] mt-1.5 pt-1.5 opacity-70"
                    style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}
                  >
                    {displayTranslation}
                  </p>
                )}

                {/* 분기 네비게이션 */}
                {!isUser && hasBranches && (
                  <div 
                    className="flex items-center justify-center gap-2 mt-2 pt-1.5"
                    style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}
                  >
                    <button
                      onClick={handlePrevBranch}
                      disabled={currentBranchIndex === 0}
                      className="p-0.5 hover:bg-black/5 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-[9px] opacity-60">{currentBranchIndex + 1}/{totalVersions}</span>
                    <button
                      onClick={handleNextBranch}
                      className="p-0.5 hover:bg-black/5 rounded"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                )}

                {/* 번역 버튼 */}
                {!isUser && isLastCharacterMessage && onTranslate && !displayTranslation && (
                  <div 
                    className="mt-1.5 pt-1.5"
                    style={{ borderTop: '1px solid rgba(0,0,0,0.1)' }}
                  >
                    <button
                      onClick={onTranslate}
                      disabled={isTranslating}
                      className="w-full py-1 text-[10px] opacity-60 hover:opacity-100 disabled:opacity-30"
                    >
                      {isTranslating ? '번역 중...' : '🌐 번역'}
                    </button>
                  </div>
                )}
              </div>

              {/* 말풍선 꼬리 */}
              {isFirstInGroup && themeConfig.chatBubble.tailUser && themeConfig.chatBubble.tailPartner && (
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

            {/* 시간 */}
            {showTime && (
              <span className={`${themeConfig.time.style} mx-1 min-w-[40px] mb-0 ${isUser ? 'text-right' : 'text-left'}`}>
                {formatTime(timestamp)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 기본/다른 테마 스타일 렌더링
  return (
    <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
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

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} ${themeConfig.chatBubble.maxWidth}`}>
        {/* 이름 */}
        {!isUser && isFirstInGroup && themeConfig.showProfilePicture && (
          <span className={themeConfig.senderName.style}>
            {character?.fieldProfile?.name || character?.freeProfileName}
          </span>
        )}

        <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* 말풍선 */}
          <div className={`px-4 py-2.5 rounded-xl ${isUser ? 'rounded-tr-sm' : 'rounded-tl-sm'} ${isUser ? themeConfig.chatBubble.user : themeConfig.chatBubble.partner} ${themeConfig.chatBubble.fontSize} ${themeConfig.chatBubble.lineHeight}`}>
            <p className="whitespace-pre-wrap">{displayContent}</p>
            
            {displayTranslation && (
              <p className="text-xs mt-2 pt-2 border-t border-current/20 opacity-80">
                {displayTranslation}
              </p>
            )}

            {/* 분기 네비게이션 */}
            {!isUser && hasBranches && (
              <div className="flex items-center justify-center gap-3 mt-3 pt-2 border-t border-current/10">
                <button
                  onClick={handlePrevBranch}
                  disabled={currentBranchIndex === 0}
                  className="p-1 hover:bg-black/5 rounded-full disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-[10px] font-medium opacity-60">
                  {currentBranchIndex + 1} / {totalVersions}
                </span>
                <button
                  onClick={handleNextBranch}
                  className="p-1 hover:bg-black/5 rounded-full transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* 번역 버튼 */}
            {!isUser && isLastCharacterMessage && onTranslate && !displayTranslation && (
              <div className="mt-3 pt-2 border-t border-current/10">
                <button
                  onClick={onTranslate}
                  disabled={isTranslating}
                  className="w-full py-1.5 text-[11px] font-medium opacity-60 hover:opacity-100 transition-opacity disabled:opacity-30"
                >
                  {isTranslating ? '번역 중...' : '🌐 한국어로 번역'}
                </button>
              </div>
            )}
          </div>

          {/* 시간 */}
          {showTime && (
            <span className={`${themeConfig.time.style} flex-shrink-0`}>
              {formatTime(timestamp)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
