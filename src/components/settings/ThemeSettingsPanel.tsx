import { useState, useRef, useCallback } from 'react';
import { useThemeSettingsStore, themePresets, getBackgroundStyle } from '@/stores';
import { BackgroundType, GradientDirection, PatternType, BackgroundWidget } from '@/types';

interface ThemeSettingsPanelProps {
  onClose: () => void;
}

// 색상 입력 컴포넌트
function ColorInput({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: string; 
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[11px] text-[#6e6e73]">{label}</span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value.startsWith('#') ? value : '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-6 h-6 rounded cursor-pointer border border-black/10"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-20 text-[10px] px-2 py-1 rounded border border-black/[0.08] bg-black/[0.02]"
        />
      </div>
    </div>
  );
}

export function ThemeSettingsPanel({ onClose }: ThemeSettingsPanelProps) {
  const {
    themeCustomization,
    setAccentColor,
    setSidebarBgColor,
    setSidebarTextColor,
    setPanelBgColor,
    setPhoneFrameColor,
    setPhoneFrameRingColor,
    setMainBackground,
    addWidget,
    updateWidget,
    removeWidget,
    applyPreset,
    resetToDefault,
  } = useThemeSettingsStore();

  const [activeTab, setActiveTab] = useState<'presets' | 'colors' | 'background' | 'widgets'>('presets');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stickerImageInputRef = useRef<HTMLInputElement>(null);

  const { mainBackground } = themeCustomization;

  // 배경 이미지 업로드
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setMainBackground({
        ...mainBackground,
        type: 'image',
        imageUrl,
        imageOpacity: 1,
      });
    };
    reader.readAsDataURL(file);
  };

  // 위젯 추가
  const handleAddWidget = (type: 'emoji' | 'text' | 'image', content: string) => {
    const widget: BackgroundWidget = {
      id: Date.now().toString(),
      type,
      content,
      x: Math.random() * 60 + 20, // 20-80% 랜덤 위치
      y: Math.random() * 60 + 20,
      size: 1, // 기본 크기 1배
      rotation: Math.random() * 30 - 15, // -15 ~ 15도 랜덤 회전
    };
    addWidget(widget);
  };

  // 스티커 이미지 업로드
  const handleStickerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('스티커 이미지는 15MB 이하여야 합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      handleAddWidget('image', imageUrl);
    };
    reader.readAsDataURL(file);
    
    // 입력 초기화 (같은 파일 다시 선택 가능하게)
    e.target.value = '';
  };

  // 이모지 목록
  const emojiList = ['🌸', '⭐', '💖', '🌙', '☀️', '🌈', '🦋', '🌺', '💫', '✨', '🎀', '🎵', '💝', '🍀', '🌷'];

  // 드래그 상태
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // 헤더 영역에서만 드래그 가능
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        initialX: position.x,
        initialY: position.y,
      };
    }
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !dragRef.current) return;
    
    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;
    
    setPosition({
      x: dragRef.current.initialX + deltaX,
      y: dragRef.current.initialY + deltaY,
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    dragRef.current = null;
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 pointer-events-none"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className="absolute top-1/2 left-1/2 bg-white rounded-xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-xl border border-black/[0.08] pointer-events-auto"
        style={{ 
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        }}
        onMouseDown={handleMouseDown}
      >
        {/* 헤더 - 드래그 핸들 */}
        <div className="drag-handle px-5 py-4 border-b border-black/[0.08] flex items-center justify-between sticky top-0 bg-white z-10 cursor-move select-none">
          <h2 className="text-[15px] font-semibold text-[#1d1d1f]">테마 커스터마이징</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-black/[0.06] transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4 text-[#8e8e93]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-black/[0.08] px-4">
          {[
            { id: 'presets', label: '프리셋' },
            { id: 'colors', label: '색상' },
            { id: 'background', label: '배경' },
            { id: 'widgets', label: '스티커' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-4 py-2.5 text-[12px] font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-[#1d1d1f]'
                  : 'text-[#8e8e93] hover:text-[#6e6e73]'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1d1d1f]" />
              )}
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto max-h-[60vh]">
          {/* 프리셋 탭 */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <p className="text-[11px] text-[#8e8e93]">미리 정의된 테마를 선택하세요</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(themePresets).map(([name, preset]) => (
                  <button
                    key={name}
                    onClick={() => applyPreset(name)}
                    className="p-3 rounded-lg border border-black/[0.08] hover:border-black/[0.15] transition-all text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-5 h-5 rounded-full border border-black/10"
                        style={{ backgroundColor: preset.accentColor }}
                      />
                      <span className="text-[12px] font-medium capitalize">{name === 'default' ? '기본' : name}</span>
                    </div>
                    <div 
                      className="h-12 rounded-md border border-black/10"
                      style={preset.mainBackground ? getBackgroundStyle(preset.mainBackground) : {}}
                    />
                  </button>
                ))}
              </div>
              <button
                onClick={resetToDefault}
                className="w-full py-2 text-[12px] text-[#8e8e93] hover:text-[#1d1d1f] transition-colors"
              >
                기본 설정으로 초기화
              </button>
            </div>
          )}

          {/* 색상 탭 */}
          {activeTab === 'colors' && (
            <div className="space-y-6">
              {/* 포인트 컬러 */}
              <section>
                <h3 className="text-[11px] font-semibold text-[#8e8e93] mb-3 uppercase tracking-wider">포인트 컬러</h3>
                <div className="space-y-2.5 bg-black/[0.02] rounded-lg p-3">
                  <ColorInput
                    label="강조색 (버튼, 토글 등)"
                    value={themeCustomization.accentColor}
                    onChange={setAccentColor}
                  />
                </div>
              </section>

              {/* 사이드바 */}
              <section>
                <h3 className="text-[11px] font-semibold text-[#8e8e93] mb-3 uppercase tracking-wider">사이드바</h3>
                <div className="space-y-2.5 bg-black/[0.02] rounded-lg p-3">
                  <ColorInput
                    label="배경색"
                    value={themeCustomization.sidebarBgColor}
                    onChange={setSidebarBgColor}
                  />
                  <ColorInput
                    label="텍스트색"
                    value={themeCustomization.sidebarTextColor}
                    onChange={setSidebarTextColor}
                  />
                </div>
              </section>

              {/* 패널 */}
              <section>
                <h3 className="text-[11px] font-semibold text-[#8e8e93] mb-3 uppercase tracking-wider">설정 패널</h3>
                <div className="space-y-2.5 bg-black/[0.02] rounded-lg p-3">
                  <ColorInput
                    label="배경색"
                    value={themeCustomization.panelBgColor}
                    onChange={setPanelBgColor}
                  />
                </div>
              </section>

              {/* 폰 프레임 */}
              <section>
                <h3 className="text-[11px] font-semibold text-[#8e8e93] mb-3 uppercase tracking-wider">폰 프레임</h3>
                <div className="space-y-2.5 bg-black/[0.02] rounded-lg p-3">
                  <ColorInput
                    label="프레임 색상"
                    value={themeCustomization.phoneFrameColor}
                    onChange={setPhoneFrameColor}
                  />
                  <ColorInput
                    label="테두리 색상"
                    value={themeCustomization.phoneFrameRingColor}
                    onChange={setPhoneFrameRingColor}
                  />
                </div>
              </section>
            </div>
          )}

          {/* 배경 탭 */}
          {activeTab === 'background' && (
            <div className="space-y-4">
              {/* 배경 타입 선택 */}
              <div className="flex gap-1 p-1 bg-black/[0.04] rounded-lg">
                {[
                  { type: 'solid', label: '단색' },
                  { type: 'gradient', label: '그라데이션' },
                  { type: 'pattern', label: '패턴' },
                  { type: 'image', label: '이미지' },
                ].map((item) => (
                  <button
                    key={item.type}
                    onClick={() => setMainBackground({ ...mainBackground, type: item.type as BackgroundType })}
                    className={`flex-1 py-1.5 text-[11px] font-medium rounded-md transition-all ${
                      mainBackground.type === item.type
                        ? 'bg-white shadow-sm text-[#1d1d1f]'
                        : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* 단색 설정 */}
              {mainBackground.type === 'solid' && (
                <div className="space-y-3">
                  <ColorInput
                    label="배경색"
                    value={mainBackground.solidColor || '#ececec'}
                    onChange={(color) => setMainBackground({ ...mainBackground, solidColor: color })}
                  />
                </div>
              )}

              {/* 그라데이션 설정 */}
              {mainBackground.type === 'gradient' && (
                <div className="space-y-3">
                  <ColorInput
                    label="시작 색상"
                    value={mainBackground.gradientColors?.[0] || '#667eea'}
                    onChange={(color) => setMainBackground({
                      ...mainBackground,
                      gradientColors: [color, mainBackground.gradientColors?.[1] || '#764ba2'],
                    })}
                  />
                  <ColorInput
                    label="끝 색상"
                    value={mainBackground.gradientColors?.[1] || '#764ba2'}
                    onChange={(color) => setMainBackground({
                      ...mainBackground,
                      gradientColors: [mainBackground.gradientColors?.[0] || '#667eea', color],
                    })}
                  />
                  <div>
                    <span className="text-[11px] text-[#6e6e73] block mb-2">방향</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { dir: 'to-r', icon: '→' },
                        { dir: 'to-l', icon: '←' },
                        { dir: 'to-t', icon: '↑' },
                        { dir: 'to-b', icon: '↓' },
                        { dir: 'to-tr', icon: '↗' },
                        { dir: 'to-tl', icon: '↖' },
                        { dir: 'to-br', icon: '↘' },
                        { dir: 'to-bl', icon: '↙' },
                      ].map((item) => (
                        <button
                          key={item.dir}
                          onClick={() => setMainBackground({
                            ...mainBackground,
                            gradientDirection: item.dir as GradientDirection,
                          })}
                          className={`py-1.5 text-[14px] rounded-md border transition-all ${
                            mainBackground.gradientDirection === item.dir
                              ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white'
                              : 'border-black/[0.08] hover:border-black/[0.15]'
                          }`}
                        >
                          {item.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 패턴 설정 */}
              {mainBackground.type === 'pattern' && (
                <div className="space-y-3">
                  <div>
                    <span className="text-[11px] text-[#6e6e73] block mb-2">패턴 유형</span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { type: 'dots', label: '점' },
                        { type: 'grid', label: '격자' },
                        { type: 'diagonal', label: '대각선' },
                        { type: 'zigzag', label: '지그재그' },
                        { type: 'circles', label: '원' },
                      ].map((item) => (
                        <button
                          key={item.type}
                          onClick={() => setMainBackground({
                            ...mainBackground,
                            patternType: item.type as PatternType,
                          })}
                          className={`py-1.5 text-[10px] rounded-md border transition-all ${
                            mainBackground.patternType === item.type
                              ? 'border-[#1d1d1f] bg-[#1d1d1f] text-white'
                              : 'border-black/[0.08] hover:border-black/[0.15]'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <ColorInput
                    label="패턴 색상"
                    value={mainBackground.patternColor || '#cccccc'}
                    onChange={(color) => setMainBackground({ ...mainBackground, patternColor: color })}
                  />
                  <ColorInput
                    label="배경 색상"
                    value={mainBackground.patternBgColor || '#ececec'}
                    onChange={(color) => setMainBackground({ ...mainBackground, patternBgColor: color })}
                  />
                </div>
              )}

              {/* 이미지 설정 */}
              {mainBackground.type === 'image' && (
                <div className="space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-3 border-2 border-dashed border-black/[0.1] rounded-lg text-[12px] text-[#6e6e73] hover:border-black/[0.2] hover:bg-black/[0.02] transition-all"
                  >
                    {mainBackground.imageUrl ? '다른 이미지 선택' : '이미지 업로드'}
                  </button>
                  {mainBackground.imageUrl && (
                    <div className="relative">
                      <img
                        src={mainBackground.imageUrl}
                        alt="배경 미리보기"
                        className="w-full h-32 object-cover rounded-lg border border-black/[0.08]"
                      />
                      <button
                        onClick={() => setMainBackground({ ...mainBackground, imageUrl: undefined })}
                        className="absolute top-2 right-2 w-6 h-6 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {mainBackground.imageUrl && (
                    <div>
                      <span className="text-[11px] text-[#6e6e73] block mb-2">투명도</span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={mainBackground.imageOpacity ?? 1}
                        onChange={(e) => setMainBackground({
                          ...mainBackground,
                          imageOpacity: parseFloat(e.target.value),
                        })}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 미리보기 */}
              <div>
                <span className="text-[11px] text-[#6e6e73] block mb-2">미리보기</span>
                <div
                  className="h-24 rounded-lg border border-black/[0.08] relative overflow-hidden"
                  style={getBackgroundStyle(mainBackground)}
                >
                  {mainBackground.type === 'image' && mainBackground.imageUrl && (
                    <div 
                      className="absolute inset-0"
                      style={{ opacity: mainBackground.imageOpacity ?? 1 }}
                    />
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 스티커/위젯 탭 */}
          {activeTab === 'widgets' && (
            <div className="space-y-4">
              <p className="text-[11px] text-[#8e8e93]">배경에 이모지나 이미지 스티커를 추가하세요</p>
              
              {/* 이미지 스티커 업로드 */}
              <section>
                <h3 className="text-[11px] font-semibold text-[#8e8e93] mb-2 uppercase tracking-wider">이미지 스티커 추가</h3>
                <input
                  ref={stickerImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleStickerImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => stickerImageInputRef.current?.click()}
                  className="w-full py-3 border-2 border-dashed border-black/[0.1] rounded-lg text-[12px] text-[#6e6e73] hover:border-black/[0.2] hover:bg-black/[0.02] transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  이미지 업로드 (2MB 이하)
                </button>
              </section>

              {/* 이모지 선택 */}
              <section>
                <h3 className="text-[11px] font-semibold text-[#8e8e93] mb-2 uppercase tracking-wider">이모지 추가</h3>
                <div className="flex flex-wrap gap-2">
                  {emojiList.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleAddWidget('emoji', emoji)}
                      className="w-10 h-10 text-xl rounded-lg border border-black/[0.08] hover:bg-black/[0.04] transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </section>

              {/* 추가된 위젯 목록 */}
              {mainBackground.widgets && mainBackground.widgets.length > 0 && (
                <section>
                  <h3 className="text-[11px] font-semibold text-[#8e8e93] mb-2 uppercase tracking-wider">
                    추가된 스티커 ({mainBackground.widgets.length})
                  </h3>
                  <div className="space-y-3">
                    {mainBackground.widgets.map((widget) => (
                      <div
                        key={widget.id}
                        className="p-3 bg-black/[0.02] rounded-lg space-y-2"
                      >
                        {/* 스티커 미리보기 및 삭제 */}
                        <div className="flex items-center justify-between">
                          {widget.type === 'image' ? (
                            <img 
                              src={widget.content} 
                              alt="스티커" 
                              className="w-12 h-12 object-contain rounded"
                            />
                          ) : (
                            <span className="text-2xl">{widget.content}</span>
                          )}
                          <button
                            onClick={() => removeWidget(widget.id)}
                            className="w-6 h-6 rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition-colors flex items-center justify-center"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        
                        {/* 위치 조절 */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-[#8e8e93] block mb-1">X 위치 ({Math.round(widget.x)}%)</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={widget.x}
                              onChange={(e) => updateWidget(widget.id, { x: parseFloat(e.target.value) })}
                              className="w-full h-1.5 accent-black"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-[#8e8e93] block mb-1">Y 위치 ({Math.round(widget.y)}%)</label>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={widget.y}
                              onChange={(e) => updateWidget(widget.id, { y: parseFloat(e.target.value) })}
                              className="w-full h-1.5 accent-black"
                            />
                          </div>
                        </div>
                        
                        {/* 크기 및 회전 조절 */}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-[#8e8e93] block mb-1">크기 ({widget.size.toFixed(1)}x)</label>
                            <input
                              type="range"
                              min="0.2"
                              max="5"
                              step="0.1"
                              value={widget.size}
                              onChange={(e) => updateWidget(widget.id, { size: parseFloat(e.target.value) })}
                              className="w-full h-1.5 accent-black"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-[#8e8e93] block mb-1">회전 ({Math.round(widget.rotation)}°)</label>
                            <input
                              type="range"
                              min="-180"
                              max="180"
                              value={widget.rotation}
                              onChange={(e) => updateWidget(widget.id, { rotation: parseFloat(e.target.value) })}
                              className="w-full h-1.5 accent-black"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
