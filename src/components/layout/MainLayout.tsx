import { useState, useEffect } from 'react';
import { ContactList } from '@/components/contacts';
import { ChatWindow, AutopilotControls, TimeControls, PopoutChatWindow } from '@/components/chat';
import { CharacterForm, UserProfileForm } from '@/components/profile';
import { SettingsPanel, ThemeSettingsPanel } from '@/components/settings';
import { StickerManager } from '@/components/sticker';
import { HelpModal } from './HelpModal';
import { useChatStore, useSettingsStore, useThemeSettingsStore, getBackgroundStyle } from '@/stores';
import { Character } from '@/types';

export function MainLayout() {
  const [showCharacterForm, setShowCharacterForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | undefined>(undefined);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [editingUserProfileId, setEditingUserProfileId] = useState<string | undefined>(undefined);
  const [showSettings, setShowSettings] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showStickerManager, setShowStickerManager] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showPopoutWindow, setShowPopoutWindow] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const { currentChatId, getChat, setChatMode } = useChatStore();
  const { settings, setPhoneFrame } = useSettingsStore();
  const { themeCustomization } = useThemeSettingsStore();

  const currentChat = currentChatId ? getChat(currentChatId) : undefined;
  const phoneFrame = settings.phoneFrame || 'iphone';
  
  // 테마 설정에서 가져오기
  const { 
    accentColor, 
    sidebarBgColor, 
    sidebarTextColor, 
    sidebarBorderColor, 
    panelBgColor, 
    panelTextColor,
    phoneFrameColor, 
    phoneFrameRingColor, 
    mainBackground 
  } = themeCustomization;

  // 채팅방별 시간 계산 함수
  const getCurrentChatTime = (): Date => {
    const timeSettings = currentChat?.timeSettings;
    if (!timeSettings || timeSettings.mode === 'realtime') {
      return new Date();
    }
    const elapsed = Date.now() - (timeSettings.startedAt || Date.now());
    return new Date((timeSettings.customBaseTime || Date.now()) + elapsed);
  };

  // 시간 업데이트 (매 초마다)
  useEffect(() => {
    const updateTime = () => {
      const time = getCurrentChatTime();
      setCurrentTime(time.toLocaleTimeString('ko-KR', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: false,
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [currentChat?.timeSettings]);

  const handleAddCharacter = () => {
    setEditingCharacter(undefined);
    setShowCharacterForm(true);
  };

  const handleEditCharacter = (character: Character) => {
    setEditingCharacter(character);
    setShowCharacterForm(true);
  };

  const handleCloseCharacterForm = () => {
    setShowCharacterForm(false);
    setEditingCharacter(undefined);
  };

  const handleEditUserProfile = (profileId?: string) => {
    setEditingUserProfileId(profileId);
    setShowUserProfile(true);
  };

  return (
    <div className="flex h-screen text-[#1d1d1f]" style={getBackgroundStyle(mainBackground)}>
      {/* 사이드바 */}
      <div 
        className="w-72 flex flex-col border-r"
        style={{ 
          backgroundColor: sidebarBgColor, 
          borderColor: sidebarBorderColor,
          color: sidebarTextColor,
        }}
      >
        {/* 연락처 목록 */}
        <div className="flex-1 overflow-hidden">
          <ContactList 
            onAddCharacter={handleAddCharacter}
            onEditCharacter={handleEditCharacter}
            onEditUserProfile={handleEditUserProfile}
          />
        </div>

        {/* 하단 메뉴 */}
        <div className="border-t px-3 py-2 flex justify-center gap-1" style={{ borderColor: sidebarBorderColor }}>
          <button
            onClick={() => setShowStickerManager(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-black/[0.05] rounded-md transition-colors"
            title="이모티콘"
          >
            <svg className="w-4 h-4" style={{ color: sidebarTextColor, opacity: 0.6 }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-4.41 3.59-8 8-8s8 3.59 8 8c0 4.41-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z"/>
            </svg>
            <span className="text-[11px] font-medium" style={{ color: sidebarTextColor, opacity: 0.6 }}>이모티콘</span>
          </button>
          <button
            onClick={() => setShowThemeSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-black/[0.05] rounded-md transition-colors"
            title="테마"
          >
            <svg className="w-4 h-4" style={{ color: sidebarTextColor, opacity: 0.6 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            <span className="text-[11px] font-medium" style={{ color: sidebarTextColor, opacity: 0.6 }}>테마</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-black/[0.05] rounded-md transition-colors"
            title="설정"
          >
            <svg className="w-4 h-4" style={{ color: sidebarTextColor, opacity: 0.6 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-[11px] font-medium" style={{ color: sidebarTextColor, opacity: 0.6 }}>설정</span>
          </button>
          <button
            onClick={() => setShowHelpModal(true)}
            className="flex items-center p-2 hover:bg-black/[0.05] rounded-md transition-colors"
            title="도움말"
          >
            <svg className="w-4 h-4" style={{ color: sidebarTextColor, opacity: 0.6 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 메인 채팅 영역 */}
      <div className="flex-1 relative flex flex-row items-center justify-center p-8 overflow-auto">
        {/* 위젯/스티커 렌더링 */}
        {mainBackground.widgets && mainBackground.widgets.length > 0 && mainBackground.widgets.map((widget) => (
          <div
            key={widget.id}
            className="absolute pointer-events-none select-none z-[1]"
            style={{
              left: `${widget.x}%`,
              top: `${widget.y}%`,
              transform: `translate(-50%, -50%) rotate(${widget.rotation}deg)`,
            }}
          >
            {widget.type === 'image' ? (
              <img 
                src={widget.content} 
                alt="스티커" 
                style={{ 
                  maxWidth: `${600 * widget.size}px`, 
                  maxHeight: `${600 * widget.size}px`, 
                  width: 'auto',
                  height: 'auto',
                  imageRendering: 'auto'
                }}
                draggable={false}
              />
            ) : (
              <span style={{ fontSize: `${6 * widget.size}rem` }}>{widget.content}</span>
            )}
          </div>
        ))}

        {/* Control Panel (Left Side) - 좌측 하단 고정 */}
        {currentChat && (
          <div className="absolute bottom-6 left-6 flex flex-col gap-2 z-20 w-[280px]">
            {/* Autopilot Controls */}
            {currentChat.mode === 'autopilot' && (
              <div 
                className="backdrop-blur rounded-lg border shadow-sm overflow-hidden"
                style={{ 
                  backgroundColor: panelBgColor, 
                  borderColor: themeCustomization.panelBorderColor,
                  color: panelTextColor,
                }}
              >
                <AutopilotControls chatId={currentChat.id} />
              </div>
            )}
            
            {/* Mode Toggles */}
            <div 
              className="backdrop-blur rounded-md p-0.5 flex items-center self-start border shadow-sm"
              style={{ 
                backgroundColor: panelBgColor, 
                borderColor: themeCustomization.panelBorderColor,
              }}
            >
              <button
                onClick={() => setChatMode(currentChat.id, 'immersion')}
                className={`px-3 py-1.5 text-[11px] font-medium rounded transition-all ${
                  currentChat.mode === 'immersion'
                    ? 'shadow-sm text-white'
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: currentChat.mode === 'immersion' ? accentColor : 'transparent',
                  color: currentChat.mode === 'immersion' ? 'white' : panelTextColor,
                  opacity: currentChat.mode === 'immersion' ? 1 : 0.6,
                }}
              >
                직접
              </button>
              <button
                onClick={() => setChatMode(currentChat.id, 'autopilot')}
                className={`px-3 py-1.5 text-[11px] font-medium rounded transition-all ${
                  currentChat.mode === 'autopilot'
                    ? 'shadow-sm text-white'
                    : 'hover:opacity-80'
                }`}
                style={{
                  backgroundColor: currentChat.mode === 'autopilot' ? accentColor : 'transparent',
                  color: currentChat.mode === 'autopilot' ? 'white' : panelTextColor,
                  opacity: currentChat.mode === 'autopilot' ? 1 : 0.6,
                }}
              >
                자동진행
              </button>
            </div>
          </div>
        )}

        {/* Time Controls (Right Side) - 우측 하단 고정 */}
        {currentChat && (
          <div className="absolute bottom-6 right-6 z-20 w-[240px] flex flex-col gap-2">
            <TimeControls chatId={currentChat.id} />
            
            {/* View Options Card */}
            <div 
              className="backdrop-blur rounded-lg border shadow-sm p-3"
              style={{ 
                backgroundColor: panelBgColor, 
                borderColor: themeCustomization.panelBorderColor,
                color: panelTextColor,
              }}
            >
              <div className="text-[10px] font-semibold mb-2 uppercase tracking-wider" style={{ opacity: 0.5 }}>
                View
              </div>
              
              {/* 창 모드 버튼들 */}
              <div className="flex gap-1.5 mb-2">
                {/* Electron 팝업 창 열기 */}
                {window.electronAPI && (
                  <button
                    onClick={() => {
                      window.electronAPI?.openPopupWindow(currentChat.id);
                    }}
                    className="flex-1 px-2 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1 bg-black/[0.04] hover:bg-black/[0.08] rounded-md transition-all"
                    title="별도 팝업 창으로 열기"
                    style={{ color: panelTextColor }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 4h8m-8 4h8M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
                    </svg>
                    팝업
                  </button>
                )}
                
                {/* 앱 내 오버레이 창 모드 */}
                <button
                  onClick={() => setShowPopoutWindow(true)}
                  className="flex-1 px-2 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1 bg-black/[0.04] hover:bg-black/[0.08] rounded-md transition-all"
                  title="오버레이 창 모드"
                  style={{ color: panelTextColor }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  오버레이
                </button>
              </div>
              
              {/* Phone Frame Toggle */}
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPhoneFrame('iphone')}
                  className={`flex-1 px-2 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1 rounded-md transition-all`}
                  style={{
                    backgroundColor: phoneFrame === 'iphone' ? accentColor : 'rgba(0,0,0,0.04)',
                    color: phoneFrame === 'iphone' ? 'white' : panelTextColor,
                    opacity: phoneFrame === 'iphone' ? 1 : 0.6,
                  }}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83"/>
                  </svg>
                  iPhone
                </button>
                <button
                  onClick={() => setPhoneFrame('android')}
                  className={`flex-1 px-2 py-1.5 text-[11px] font-medium flex items-center justify-center gap-1 rounded-md transition-all`}
                  style={{
                    backgroundColor: phoneFrame === 'android' ? accentColor : 'rgba(0,0,0,0.04)',
                    color: phoneFrame === 'android' ? 'white' : panelTextColor,
                    opacity: phoneFrame === 'android' ? 1 : 0.6,
                  }}
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24a11.463 11.463 0 00-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48A10.78 10.78 0 003 18h18a10.78 10.78 0 00-3.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"/>
                  </svg>
                  Android
                </button>
              </div>
            </div>
          </div>
        )}

        <div className={`relative z-10 shrink-0 overflow-hidden ${
          phoneFrame === 'iphone' 
            ? 'w-[375px] h-[812px] rounded-[48px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]'
            : 'w-[360px] h-[780px] rounded-[28px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]'
        }`} style={{ 
          fontFamily: phoneFrame === 'iphone' ? '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' : 'system-ui, -apple-system, sans-serif',
          backgroundColor: phoneFrameColor,
          boxShadow: `0 0 0 ${phoneFrame === 'iphone' ? '10px' : '6px'} ${phoneFrameRingColor}, 0 25px 50px -12px rgba(0,0,0,0.25)`,
        }}>
          
          {/* Screen Content */}
          <div className={`absolute inset-0 bg-white flex flex-col ${
            phoneFrame === 'iphone' ? 'rounded-[38px]' : 'rounded-[22px]'
          }`}>
            
            {/* Status Bar - iPhone은 Notch, Android는 펀치홀 */}
            <div className={`w-full flex items-center justify-between px-6 text-xs font-medium select-none z-50 relative shrink-0 ${
              phoneFrame === 'iphone' ? 'h-[44px]' : 'h-[28px]'
            } ${
              currentChat?.theme === 'kakao' ? 'bg-kakao-bg' : 
              currentChat?.theme === 'line' ? 'bg-line-bg' :
              'bg-white'
            }`}>
                <span className={`text-center ${phoneFrame === 'iphone' ? 'w-10' : 'w-8 text-[10px]'}`}>{currentTime || '9:41'}</span>
                {/* iPhone Notch */}
                {phoneFrame === 'iphone' && (
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[120px] h-[30px] bg-black rounded-b-[18px]"></div>
                )}
                {/* Android Punch Hole */}
                {phoneFrame === 'android' && (
                  <div className="absolute left-1/2 top-[8px] -translate-x-1/2 w-[10px] h-[10px] bg-black rounded-full"></div>
                )}
                <div className={`flex justify-end items-center ${phoneFrame === 'iphone' ? 'gap-1.5' : 'gap-1 w-8'}`}>
                    {phoneFrame === 'iphone' ? (
                      <>
                        {/* Signal */}
                        <svg className="w-[17px] h-[11px]" viewBox="0 0 17 11" fill="currentColor">
                          <path d="M1 7.5C1 7.22386 1.22386 7 1.5 7H2.5C2.77614 7 3 7.22386 3 7.5V10.5C3 10.7761 2.77614 11 2.5 11H1.5C1.22386 11 1 10.7761 1 10.5V7.5Z" />
                          <path d="M5.5 5.5C5.5 5.22386 5.72386 5 6 5H7C7.27614 5 7.5 5.22386 7.5 5.5V10.5C7.5 10.7761 7.27614 11 7 11H6C5.72386 11 5.5 10.7761 5.5 10.5V5.5Z" />
                          <path d="M10 3.5C10 3.22386 10.2239 3 10.5 3H11.5C11.7761 3 12 3.22386 12 3.5V10.5C12 10.7761 11.7761 11 11.5 11H10.5C10.2239 11 10 10.7761 10 10.5V3.5Z" />
                          <path d="M14.5 1.5C14.5 1.22386 14.7239 1 15 1H16C16.2761 1 16.5 1.22386 16.5 1.5V10.5C16.5 10.7761 16.2761 11 16 11H15C14.7239 11 14.5 10.7761 14.5 10.5V1.5Z" />
                        </svg>
                        {/* WiFi */}
                        <svg className="w-[15px] h-[11px]" viewBox="0 0 15 11" fill="currentColor">
                          <path fillRule="evenodd" clipRule="evenodd" d="M7.5 11C8.88071 11 10 9.88071 10 8.5C10 7.11929 8.88071 6 7.5 6C6.11929 6 5 7.11929 5 8.5C5 9.88071 6.11929 11 7.5 11ZM12.9545 6.54545L14.5 4.5C12.5 2 10 1 7.5 1C5 1 2.5 2 0.5 4.5L2.04545 6.54545C3.5 5 5.5 4 7.5 4C9.5 4 11.5 5 12.9545 6.54545Z" />
                        </svg>
                        {/* Battery */}
                        <svg className="w-[25px] h-[12px]" viewBox="0 0 25 12" fill="currentColor">
                          <rect x="1" y="2.5" width="19" height="7" rx="2" stroke="currentColor" strokeWidth="1" fill="none" />
                          <rect x="3" y="4.5" width="15" height="3" rx="0.5" fill="currentColor" />
                          <path d="M22 4.5C22.8284 4.5 23.5 5.17157 23.5 6C23.5 6.82843 22.8284 7.5 22 7.5V4.5Z" fill="currentColor" />
                        </svg>
                      </>
                    ) : (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z"/></svg>
                    )}
                </div>
            </div>

            {/* App Content */}
            <div className="flex-1 flex flex-col relative overflow-hidden bg-[#f5f5f7]">
                <ChatWindow />
            </div>

            {/* Home Indicator - iPhone만 표시 */}
            {phoneFrame === 'iphone' ? (
              <div className={`h-[20px] w-full flex items-center justify-center shrink-0 z-50 ${
                currentChat?.mode === 'immersion'
                  ? 'bg-white'
                  : currentChat?.theme === 'kakao'
                    ? 'bg-kakao-bg'
                    : currentChat?.theme === 'line'
                      ? 'bg-line-bg'
                      : currentChat?.theme === 'imessage'
                        ? 'bg-imessage-bg'
                        : 'bg-white'
              }`}>
                  <div className="w-[120px] h-[4px] bg-gray-300 rounded-full"></div>
              </div>
            ) : (
              /* Android Navigation Bar */
              <div className={`h-[24px] w-full flex items-center justify-center gap-12 shrink-0 z-50 pb-1 ${
                currentChat?.mode === 'immersion'
                  ? 'bg-white'
                  : currentChat?.theme === 'kakao'
                    ? 'bg-kakao-bg'
                    : currentChat?.theme === 'line'
                      ? 'bg-line-bg'
                      : currentChat?.theme === 'imessage'
                        ? 'bg-imessage-bg'
                        : 'bg-white'
              }`}>
                  {/* Back (Triangle pointing left) */}
                  <div className="w-0 h-0 border-r-[8px] border-r-gray-400 border-y-[6px] border-y-transparent"></div>
                  {/* Home (Circle) */}
                  <div className="w-3.5 h-3.5 border-2 border-gray-400 rounded-full"></div>
                  {/* Recents (Square) */}
                  <div className="w-3.5 h-3.5 border-2 border-gray-400 rounded-sm"></div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* 모달들 */}
      {showCharacterForm && (
        <CharacterForm
          character={editingCharacter}
          onSave={handleCloseCharacterForm}
          onCancel={handleCloseCharacterForm}
        />
      )}

      {showUserProfile && (
        <UserProfileForm 
          onClose={() => {
            setShowUserProfile(false);
            setEditingUserProfileId(undefined);
          }}
          editingProfileId={editingUserProfileId}
        />
      )}

      {showSettings && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}

      {showThemeSettings && (
        <ThemeSettingsPanel onClose={() => setShowThemeSettings(false)} />
      )}

      {showStickerManager && (
        <StickerManager onClose={() => setShowStickerManager(false)} />
      )}

      {showHelpModal && (
        <HelpModal onClose={() => setShowHelpModal(false)} />
      )}

      {/* 창 모드 - 팝아웃 윈도우 */}
      {showPopoutWindow && currentChatId && (
        <PopoutChatWindow 
          chatId={currentChatId} 
          onClose={() => setShowPopoutWindow(false)} 
        />
      )}
    </div>
  );
}
