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
      className={`flex gap-2 mb-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* 프로필 이미지 */}
      {showProfile && (
        <div className="flex-shrink-0">
          {character?.fieldProfile?.profileImage ? (
            <img
              src={character.fieldProfile.profileImage}
              alt={character.fieldProfile.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">
              {character?.fieldProfile?.name?.charAt(0) || '?'}
            </div>
          )}
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        {/* 이름 (상대방일 때만, 프로필 표시 테마일 때만) */}
        {showProfile && character?.fieldProfile?.name && (
          <span className="text-xs text-gray-600 mb-1 ml-1">
            {character.fieldProfile.name}
          </span>
        )}

        <div className={`flex items-end gap-1 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
          {/* 말풍선 */}
          <div className={`max-w-xs px-4 py-2 ${bubbleStyle}`}>
            <p className="text-sm whitespace-pre-wrap">{displayContent}</p>
            {displayTranslation && (
              <p className="text-xs mt-2 pt-2 border-t border-current/20 opacity-70">
                {displayTranslation}
              </p>
            )}
            
            {/* 분기 네비게이션 (캐릭터 메시지일 때만) */}
            {!isUser && hasBranches && (
              <div className="flex items-center justify-center gap-2 mt-2 pt-2 border-t border-current/10">
                <button
                  onClick={handlePrevBranch}
                  disabled={currentBranchIndex === 0}
                  className="p-1 hover:bg-black/10 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className="text-xs">
                  {currentBranchIndex + 1} / {totalVersions}
                </span>
                <button
                  onClick={handleNextBranch}
                  className="p-1 hover:bg-black/10 rounded"
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
          <span className="text-xs text-gray-500">{formatTime(timestamp)}</span>
        </div>
      </div>
    </div>
  );
}
