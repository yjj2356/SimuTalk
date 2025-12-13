import { useState, useEffect } from 'react';

interface TitleBarProps {
  title?: string;
}

export function TitleBar({ title = 'SimuTalk' }: TitleBarProps) {
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState(true);
  const isElectron = !!window.electronAPI;

  useEffect(() => {
    if (isElectron) {
      window.electronAPI?.isPopupAlwaysOnTop().then(setIsAlwaysOnTop);
    }
  }, [isElectron]);

  const handleMinimize = () => {
    window.electronAPI?.minimizePopupWindow();
  };

  const handleClose = () => {
    window.electronAPI?.closePopupWindow();
  };

  const handleTogglePin = async () => {
    const result = await window.electronAPI?.togglePopupAlwaysOnTop();
    if (result !== undefined) {
      setIsAlwaysOnTop(result);
    }
  };

  if (!isElectron) return null;

  return (
    <div 
      className="h-9 bg-[#1a1a2e] flex items-center justify-between px-3 select-none shrink-0"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* 앱 타이틀 */}
      <div className="flex items-center gap-2">
        <span className="text-white/90 text-sm font-medium truncate max-w-[200px]">{title}</span>
      </div>

      {/* 창 제어 버튼들 */}
      <div 
        className="flex items-center gap-0.5"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* 항상 위 고정 버튼 */}
        <button
          onClick={handleTogglePin}
          className={`w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors ${
            isAlwaysOnTop ? 'text-blue-400' : 'text-white/50'
          }`}
          title={isAlwaysOnTop ? '항상 위 해제' : '항상 위 고정'}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16,12V4H17V2H7V4H8V12L6,14V16H11.2V22H12.8V16H18V14L16,12Z" />
          </svg>
        </button>

        {/* 최소화 버튼 */}
        <button
          onClick={handleMinimize}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-white/70 hover:text-white"
          title="최소화"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19,13H5V11H19V13Z" />
          </svg>
        </button>

        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-500 transition-colors text-white/70 hover:text-white"
          title="닫기"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
