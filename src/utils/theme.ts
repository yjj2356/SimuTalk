import { ThemeType } from '@/types';

export interface ThemeConfig {
  name: string;
  showProfilePicture: boolean;
  chatBubble: {
    user: string;
    partner: string;
  };
  background: string;
  contactList: {
    showProfilePicture: boolean;
    showStatusMessage: boolean;
    style: string;
  };
}

export const themeConfigs: Record<ThemeType, ThemeConfig> = {
  kakao: {
    name: '카카오톡',
    showProfilePicture: true,
    chatBubble: {
      user: 'bg-kakao-bubble text-black rounded-xl rounded-tr-sm',
      partner: 'bg-white text-black rounded-xl rounded-tl-sm',
    },
    background: 'bg-kakao-bg',
    contactList: {
      showProfilePicture: true,
      showStatusMessage: true,
      style: 'divide-y divide-gray-200',
    },
  },
  line: {
    name: '라인',
    showProfilePicture: true,
    chatBubble: {
      user: 'bg-line-green text-white rounded-xl rounded-tr-sm',
      partner: 'bg-white text-black rounded-xl rounded-tl-sm',
    },
    background: 'bg-line-bg',
    contactList: {
      showProfilePicture: true,
      showStatusMessage: false,
      style: 'divide-y divide-green-100',
    },
  },
  imessage: {
    name: 'iMessage',
    showProfilePicture: false,
    chatBubble: {
      user: 'bg-imessage-blue text-white rounded-xl rounded-tr-sm',
      partner: 'bg-imessage-gray text-black rounded-xl rounded-tl-sm',
    },
    background: 'bg-white',
    contactList: {
      showProfilePicture: false,
      showStatusMessage: false,
      style: 'divide-y divide-gray-200',
    },
  },
  basic: {
    name: '기본',
    showProfilePicture: true,
    chatBubble: {
      user: 'bg-black text-white rounded-xl rounded-tr-sm px-4 py-2.5 shadow-sm',
      partner: 'bg-white text-gray-900 border border-gray-200 rounded-xl rounded-tl-sm px-4 py-2.5 shadow-sm',
    },
    background: 'bg-[#F5F5F7]',
    contactList: {
      showProfilePicture: true,
      showStatusMessage: true,
      style: '',
    },
  },
};

export const getThemeConfig = (theme: ThemeType): ThemeConfig => {
  return themeConfigs[theme];
};
