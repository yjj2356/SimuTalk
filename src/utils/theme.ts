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
      user: 'bg-kakao-bubble text-black rounded-2xl rounded-tr-sm',
      partner: 'bg-white text-black rounded-2xl rounded-tl-sm',
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
      user: 'bg-line-green text-white rounded-2xl rounded-tr-sm',
      partner: 'bg-white text-black rounded-2xl rounded-tl-sm',
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
      user: 'bg-imessage-blue text-white rounded-2xl rounded-tr-sm',
      partner: 'bg-imessage-gray text-black rounded-2xl rounded-tl-sm',
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
    showProfilePicture: false,
    chatBubble: {
      user: 'bg-blue-500 text-white rounded-lg',
      partner: 'bg-gray-200 text-black rounded-lg',
    },
    background: 'bg-gray-100',
    contactList: {
      showProfilePicture: false,
      showStatusMessage: false,
      style: '',
    },
  },
};

export const getThemeConfig = (theme: ThemeType): ThemeConfig => {
  return themeConfigs[theme];
};
