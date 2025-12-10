import { useSettingsStore } from '@/stores';
import { getThemeConfig } from '@/utils/theme';
import { Character, MessageBranch } from '@/types';

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
}: ChatBubbleProps) {
  const { settings } = useSettingsStore();
  const themeConfig = getThemeConfig(settings.theme);

  const bubbleStyle = isUser
    ? themeConfig.chatBubble.user
    : themeConfig.chatBubble.partner;

  const showProfile = !isUser && themeConfig.showProfilePicture;

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
      hour: '2-digit',
      minute: '2-digit',
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

  return (
    <div
      className={`flex gap-3 mb-6 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* 프로필 이미지 */}
      {showProfile && (
        <div className="flex-shrink-0 self-end mb-1">
          {character?.fieldProfile?.profileImage ? (
            <img
              src={character.fieldProfile.profileImage}
              alt={character.fieldProfile.name}
              className="w-9 h-9 rounded-full object-cover shadow-sm border border-gray-100"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 text-xs font-medium shadow-sm">
              {character?.fieldProfile?.name?.charAt(0) || '?'}
            </div>
          )}
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
        {/* 이름 (상대방일 때만, 프로필 표시 테마일 때만) */}
        {showProfile && character?.fieldProfile?.name && (
          <span className="text-[11px] text-gray-500 mb-1.5 ml-1 font-medium">
            {character.fieldProfile.name}
          </span>
        )}

        <div className={`flex items-end gap-2 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* 말풍선 */}
          <div className={`px-5 py-3 shadow-sm ${bubbleStyle}`}>
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{displayContent}</p>
            {displayTranslation && (
              <p className="text-xs mt-2 pt-2 border-t border-current/20 opacity-80 font-light">
                {displayTranslation}
              </p>
            )}
            
            {/* 분기 네비게이션 (캐릭터 메시지일 때만) */}
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
                  title={currentBranchIndex === totalVersions - 1 ? '새 버전 생성' : '다음 버전'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* 시간 */}
          <span className="text-[10px] text-gray-400 font-medium mb-1 flex-shrink-0">{formatTime(timestamp)}</span>
        </div>
      </div>
    </div>
  );
}
