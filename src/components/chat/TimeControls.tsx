import { useState, useEffect } from 'react';
import { useChatStore } from '@/stores';
import { TimeSettings } from '@/types';

interface TimeControlsProps {
  chatId: string;
}

export function TimeControls({ chatId }: TimeControlsProps) {
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

  return (
    <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
      {/* 헤더 - 항상 표시 */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Time</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${isCustomMode ? 'text-blue-600' : 'text-gray-900'}`}>
            {currentDisplayTime}
          </span>
          {isCustomMode && (
            <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-medium">
              설정됨
            </span>
          )}
          <svg 
            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* 확장된 설정 영역 */}
      {isExpanded && (
        <div className="px-5 pb-4 pt-2 border-t border-gray-100 space-y-3">
          {/* 모드 선택 버튼 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleSetRealtime}
              className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                !isCustomMode
                  ? 'bg-black text-white border-black'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              현재 시간
            </button>
            <button
              onClick={() => {}}
              className={`py-2 px-3 rounded-lg border text-xs font-medium transition-all ${
                isCustomMode
                  ? 'bg-black text-white border-black'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              사용자 설정
            </button>
          </div>

          {/* 커스텀 시간 입력 */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="date"
                value={customDateInput}
                onChange={(e) => setCustomDateInput(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5"
              />
              <input
                type="time"
                value={customTimeInput}
                onChange={(e) => setCustomTimeInput(e.target.value)}
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs focus:outline-none focus:bg-white focus:ring-2 focus:ring-black/5"
              />
            </div>
            <button
              onClick={handleSetCustomTime}
              className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 text-xs font-medium transition-all"
            >
              시간 설정 적용
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
