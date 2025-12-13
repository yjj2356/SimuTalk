import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ThemeCustomization, BackgroundSettings, BackgroundWidget } from '@/types';

// 기본 테마 설정
export const defaultThemeCustomization: ThemeCustomization = {
  // 포인트 컬러 (기본 검은색)
  accentColor: '#1d1d1f',
  
  // 사이드바
  sidebarBgColor: '#f6f6f6',
  sidebarTextColor: '#1d1d1f',
  sidebarBorderColor: 'rgba(0, 0, 0, 0.1)',
  
  // 패널 (폰 옆 설정창들)
  panelBgColor: 'rgba(255, 255, 255, 0.95)',
  panelTextColor: '#1d1d1f',
  panelBorderColor: 'rgba(0, 0, 0, 0.08)',
  
  // 메인 배경
  mainBackground: {
    type: 'solid',
    solidColor: '#ececec',
  },
  
  // 폰 프레임
  phoneFrameColor: '#000000',
  phoneFrameRingColor: '#000000',
};

// 프리셋 테마들
export const themePresets: Record<string, Partial<ThemeCustomization>> = {
  default: {
    accentColor: '#1d1d1f',
    sidebarBgColor: '#f6f6f6',
    phoneFrameColor: '#000000',
    phoneFrameRingColor: '#000000',
    mainBackground: { type: 'solid', solidColor: '#ececec' },
  },
  ocean: {
    accentColor: '#0077be',
    sidebarBgColor: '#e8f4fc',
    phoneFrameColor: '#1a3a5c',
    phoneFrameRingColor: '#2c5282',
    mainBackground: { 
      type: 'gradient', 
      gradientColors: ['#667eea', '#764ba2'],
      gradientDirection: 'to-br',
    },
  },
  sunset: {
    accentColor: '#e65100',
    sidebarBgColor: '#fff3e0',
    phoneFrameColor: '#4a1e00',
    phoneFrameRingColor: '#6d2c00',
    mainBackground: { 
      type: 'gradient', 
      gradientColors: ['#ff9a9e', '#fecfef'],
      gradientDirection: 'to-r',
    },
  },
  forest: {
    accentColor: '#2e7d32',
    sidebarBgColor: '#e8f5e9',
    phoneFrameColor: '#1b3d1e',
    phoneFrameRingColor: '#2e5931',
    mainBackground: { 
      type: 'gradient', 
      gradientColors: ['#a8e063', '#56ab2f'],
      gradientDirection: 'to-t',
    },
  },
  midnight: {
    accentColor: '#7c4dff',
    sidebarBgColor: '#1e1e2e',
    sidebarTextColor: '#ffffff',
    phoneFrameColor: '#1e1e2e',
    phoneFrameRingColor: '#313244',
    mainBackground: { 
      type: 'gradient', 
      gradientColors: ['#0f0c29', '#302b63'],
      gradientDirection: 'to-br',
    },
    panelBgColor: 'rgba(30, 30, 46, 0.95)',
    panelTextColor: '#ffffff',
  },
  cherry: {
    accentColor: '#d81b60',
    sidebarBgColor: '#fce4ec',
    phoneFrameColor: '#880e4f',
    phoneFrameRingColor: '#ad1457',
    mainBackground: { 
      type: 'gradient', 
      gradientColors: ['#ffecd2', '#fcb69f'],
      gradientDirection: 'to-r',
    },
  },
};

// 패턴 CSS 생성 함수
export const getPatternCSS = (settings: BackgroundSettings): string => {
  if (settings.type !== 'pattern' || !settings.patternType) return '';
  
  const color = settings.patternColor || '#cccccc';
  const bgColor = settings.patternBgColor || '#ececec';
  
  switch (settings.patternType) {
    case 'dots':
      return `radial-gradient(circle, ${color} 1px, transparent 1px)`;
    case 'grid':
      return `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`;
    case 'diagonal':
      return `repeating-linear-gradient(45deg, ${color}, ${color} 1px, ${bgColor} 1px, ${bgColor} 10px)`;
    case 'zigzag':
      return `linear-gradient(135deg, ${color} 25%, transparent 25%) -10px 0, linear-gradient(225deg, ${color} 25%, transparent 25%) -10px 0, linear-gradient(315deg, ${color} 25%, transparent 25%), linear-gradient(45deg, ${color} 25%, transparent 25%)`;
    case 'circles':
      return `radial-gradient(circle at 0% 50%, transparent 9px, ${color} 10px, transparent 11px), radial-gradient(circle at 100% 50%, transparent 9px, ${color} 10px, transparent 11px)`;
    default:
      return '';
  }
};

// 그라데이션 방향을 CSS로 변환
const gradientDirectionMap: Record<string, string> = {
  'to-r': 'to right',
  'to-l': 'to left',
  'to-t': 'to top',
  'to-b': 'to bottom',
  'to-tr': 'to top right',
  'to-tl': 'to top left',
  'to-br': 'to bottom right',
  'to-bl': 'to bottom left',
};

// 배경 스타일 생성 함수
export const getBackgroundStyle = (settings: BackgroundSettings): React.CSSProperties => {
  const style: React.CSSProperties = {};
  
  switch (settings.type) {
    case 'solid':
      style.backgroundColor = settings.solidColor || '#ececec';
      break;
    case 'gradient':
      if (settings.gradientColors) {
        const direction = settings.gradientDirection || 'to-br';
        const cssDirection = gradientDirectionMap[direction] || 'to bottom right';
        style.background = `linear-gradient(${cssDirection}, ${settings.gradientColors[0]}, ${settings.gradientColors[1]})`;
      }
      break;
    case 'pattern':
      style.backgroundColor = settings.patternBgColor || '#ececec';
      style.backgroundImage = getPatternCSS(settings);
      style.backgroundSize = settings.patternType === 'dots' ? '20px 20px' : 
                             settings.patternType === 'grid' ? '20px 20px' :
                             settings.patternType === 'zigzag' ? '20px 20px' : '20px 20px';
      break;
    case 'image':
      if (settings.imageUrl) {
        style.backgroundImage = `url(${settings.imageUrl})`;
        style.backgroundSize = 'cover';
        style.backgroundPosition = 'center';
        style.backgroundRepeat = 'no-repeat';
        if (settings.imageOpacity !== undefined && settings.imageOpacity < 1) {
          // opacity는 별도로 처리 필요
        }
      }
      break;
  }
  
  return style;
};

interface ThemeSettingsState {
  themeCustomization: ThemeCustomization;
  
  // 개별 설정 변경
  setAccentColor: (color: string) => void;
  setSidebarBgColor: (color: string) => void;
  setSidebarTextColor: (color: string) => void;
  setSidebarBorderColor: (color: string) => void;
  setPanelBgColor: (color: string) => void;
  setPanelTextColor: (color: string) => void;
  setPanelBorderColor: (color: string) => void;
  setPhoneFrameColor: (color: string) => void;
  setPhoneFrameRingColor: (color: string) => void;
  
  // 배경 설정
  setMainBackground: (settings: BackgroundSettings) => void;
  addWidget: (widget: BackgroundWidget) => void;
  updateWidget: (id: string, widget: Partial<BackgroundWidget>) => void;
  removeWidget: (id: string) => void;
  
  // 프리셋 적용
  applyPreset: (presetName: string) => void;
  
  // 전체 리셋
  resetToDefault: () => void;
}

export const useThemeSettingsStore = create<ThemeSettingsState>()(
  persist(
    (set) => ({
      themeCustomization: defaultThemeCustomization,
      
      setAccentColor: (accentColor) =>
        set((state) => ({
          themeCustomization: { ...state.themeCustomization, accentColor },
        })),
      
      setSidebarBgColor: (sidebarBgColor) =>
        set((state) => ({
          themeCustomization: { ...state.themeCustomization, sidebarBgColor },
        })),
      
      setSidebarTextColor: (sidebarTextColor) =>
        set((state) => ({
          themeCustomization: { ...state.themeCustomization, sidebarTextColor },
        })),
      
      setSidebarBorderColor: (sidebarBorderColor) =>
        set((state) => ({
          themeCustomization: { ...state.themeCustomization, sidebarBorderColor },
        })),
      
      setPanelBgColor: (panelBgColor) =>
        set((state) => ({
          themeCustomization: { ...state.themeCustomization, panelBgColor },
        })),
      
      setPanelTextColor: (panelTextColor) =>
        set((state) => ({
          themeCustomization: { ...state.themeCustomization, panelTextColor },
        })),
      
      setPanelBorderColor: (panelBorderColor) =>
        set((state) => ({
          themeCustomization: { ...state.themeCustomization, panelBorderColor },
        })),
      
      setPhoneFrameColor: (phoneFrameColor) =>
        set((state) => ({
          themeCustomization: { ...state.themeCustomization, phoneFrameColor },
        })),
      
      setPhoneFrameRingColor: (phoneFrameRingColor) =>
        set((state) => ({
          themeCustomization: { ...state.themeCustomization, phoneFrameRingColor },
        })),
      
      setMainBackground: (mainBackground) =>
        set((state) => ({
          themeCustomization: { ...state.themeCustomization, mainBackground },
        })),
      
      addWidget: (widget) =>
        set((state) => ({
          themeCustomization: {
            ...state.themeCustomization,
            mainBackground: {
              ...state.themeCustomization.mainBackground,
              widgets: [...(state.themeCustomization.mainBackground.widgets || []), widget],
            },
          },
        })),
      
      updateWidget: (id, widgetUpdate) =>
        set((state) => ({
          themeCustomization: {
            ...state.themeCustomization,
            mainBackground: {
              ...state.themeCustomization.mainBackground,
              widgets: (state.themeCustomization.mainBackground.widgets || []).map((w) =>
                w.id === id ? { ...w, ...widgetUpdate } : w
              ),
            },
          },
        })),
      
      removeWidget: (id) =>
        set((state) => ({
          themeCustomization: {
            ...state.themeCustomization,
            mainBackground: {
              ...state.themeCustomization.mainBackground,
              widgets: (state.themeCustomization.mainBackground.widgets || []).filter(
                (w) => w.id !== id
              ),
            },
          },
        })),
      
      applyPreset: (presetName) =>
        set((state) => {
          const preset = themePresets[presetName];
          if (!preset) return state;
          return {
            themeCustomization: {
              ...defaultThemeCustomization,
              ...preset,
            },
          };
        }),
      
      resetToDefault: () =>
        set(() => ({
          themeCustomization: defaultThemeCustomization,
        })),
    }),
    {
      name: 'simutalk-theme-settings',
    }
  )
);
