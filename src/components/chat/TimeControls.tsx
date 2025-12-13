import { useState, useEffect } from 'react';
import { useChatStore } from '@/stores';
import { TimeSettings } from '@/types';

interface TimeControlsProps {
  chatId: string;
  compact?: boolean; // 창 모드용 컴팩트 스타일
}

export function TimeControls({ chatId, compact = false }: TimeControlsProps) {
  const { getChat, setChatTimeSettings } = useChatStore();
  const chat = getChat(chatId);
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('');
  const [customTimeInput, setCustomTimeInput] = useState('');
  const [currentDisplayTime, setCurrentDisplayTime] = useState('');

  // 현재 채팅방의 시간 설정 가져오기
  const timeSettings = chat?.timeSettings;
  const isCustomMode = timeSettings?.mode === 'custom';

  // 현재 시간 계산 함수
  const getCurrentChatTime = (): Date => {
    if (!timeSettings || timeSettings.mode === 'realtime') {
      return new Date();
    }
    // 커스텀 모드: 설정된 시간 + (현재 시간 - 시작 시점)
    const elapsed = Date.now() - (timeSettings.startedAt || Date.now());
    return new Date((timeSettings.customBaseTime || Date.now()) + elapsed);
  };

  // 시간 표시 업데이트
  useEffect(() => {
    const updateDisplay = () => {
      const time = getCurrentChatTime();
      setCurrentDisplayTime(time.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }));
    };
    updateDisplay();
    const interval = setInterval(updateDisplay, 1000);
    return () => clearInterval(interval);
  }, [timeSettings]);

  // 초기 입력값 설정
  useEffect(() => {
    const now = new Date();
    setCustomDateInput(now.toISOString().slice(0, 10));
    setCustomTimeInput(now.toTimeString().slice(0, 5));
  }, []);

  const handleSetRealtime = () => {
    setChatTimeSettings(chatId, undefined);
    setIsExpanded(false);
  };

  const handleSetCustomTime = () => {
    if (customDateInput && customTimeInput) {
      const dateTime = new Date(`${customDateInput}T${customTimeInput}:00`);
      const newTimeSettings: TimeSettings = {
        mode: 'custom',
        customBaseTime: dateTime.getTime(),
        startedAt: Date.now(),
      };
      setChatTimeSettings(chatId, newTimeSettings);
      setIsExpanded(false);
    }
  };

  if (!chat) return null;

  // Compact 모드 (창 모드용)
  if (compact) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">시간</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${isCustomMode ? 'text-blue-600' : 'text-gray-900'}`}>
            {currentDisplayTime}
          </span>
          {isCustomMode && (
            <span className="text-[9px] bg-blue-100 text-blue-600 px-1 py-0.5 rounded-full font-medium">
              설정
            </span>
          )}
          <button
            onClick={handleSetRealtime}
            disabled={!isCustomMode}
            className={`px-2 py-1 text-[10px] rounded-md transition-colors ${
              !isCustomMode
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            초기화
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur rounded-lg border border-black/[0.08] shadow-sm overflow-hidden">
      {/* 헤더 - 항상 표시 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-black/[0.02] transition-colors"
      >
        <div className="flex items-center text-[10px] font-semibold text-[#8e8e93] uppercase tracking-wider">
          <svg className="w-3.5 h-3.5 mr-1.5 text-[#8e8e93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Time
        </div>
        <div className="flex items-center gap-2">
          <span className={`time-display text-base font-medium ${isCustomMode ? 'text-[#1d1d1f]' : 'text-[#1d1d1f]'}`}>
            {currentDisplayTime}
          </span>
          {isCustomMode && (
            <span className="text-[9px] bg-[#1d1d1f] text-white px-1.5 py-0.5 rounded font-medium">
              설정
            </span>
          )}
          <svg 
            className={`w-3.5 h-3.5 text-[#8e8e93] transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 확장된 설정 영역 */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-black/[0.06] space-y-2">
          {/* 모드 선택 버튼 */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={handleSetRealtime}
              className={`py-1.5 px-2 text-[11px] font-medium rounded-md transition-all ${
                !isCustomMode
                  ? 'bg-[#1d1d1f] text-white'
                  : 'text-[#6e6e73] bg-black/[0.04] hover:bg-black/[0.08]'
              }`}
            >
              현재 시간
            </button>
            <button
              className={`py-1.5 px-2 text-[11px] font-medium rounded-md transition-all ${
                isCustomMode
                  ? 'bg-[#1d1d1f] text-white'
                  : 'text-[#6e6e73] bg-black/[0.04] hover:bg-black/[0.08]'
              }`}
            >
              사용자 설정
            </button>
          </div>

          {/* 커스텀 시간 입력 */}
          <div className="space-y-1.5">
            <div className="flex gap-1.5">
              <input
                type="date"
                value={customDateInput}
                onChange={(e) => setCustomDateInput(e.target.value)}
                className="flex-1 rounded-md border border-black/[0.08] bg-black/[0.02] px-2 py-1.5 text-[11px] focus:bg-white transition-all"
              />
              <input
                type="time"
                value={customTimeInput}
                onChange={(e) => setCustomTimeInput(e.target.value)}
                className="flex-1 rounded-md border border-black/[0.08] bg-black/[0.02] px-2 py-1.5 text-[11px] focus:bg-white transition-all"
              />
            </div>
            <button
              onClick={handleSetCustomTime}
              className="w-full py-1.5 text-[11px] font-medium bg-[#1d1d1f] text-white rounded-md hover:bg-[#3a3a3c] transition-all"
            >
              시간 설정 적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
