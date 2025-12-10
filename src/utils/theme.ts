import { ThemeType } from '@/types';

export interface ThemeConfig {
  displayName: string;
  showProfilePicture: boolean;
  profileStyle: string;
  profileRadius: string; // 프로필 이미지 라운드 정도
  chatBubble: {
    user: string;
    partner: string;
    userBgColor: string;      // 내 말풍선 배경색 (CSS 값)
    partnerBgColor: string;   // 상대방 말풍선 배경색 (CSS 값)
    fontSize: string;
    lineHeight: string;
    maxWidth: string;
    padding: string;          // 말풍선 패딩
    borderRadius: string;     // 말풍선 라운드
    tailUser: boolean;
    tailPartner: boolean;
  };
  background: string;
  backgroundColor: string;    // CSS 색상값
  header: {
    bg: string;
    textColor: string;
    style: string;
    backgroundColor: string;  // CSS 색상값
  };
  inputArea: {
    bg: string;
    style: string;
  };
  time: {
    style: string;
  };
  senderName: {
    style: string;
    fontSize: string;
  };
  contactList: {
    showProfilePicture: boolean;
    showStatusMessage: boolean;
    style: string;
  };
  messageGap: string;         // 메시지 간 간격
}

export const themeConfigs: Record<ThemeType, ThemeConfig> = {
  kakao: {
    displayName: '카카오톡',
    showProfilePicture: true,
    profileStyle: 'w-[33px] h-[33px] rounded-[13px]',
    profileRadius: '13px',
    chatBubble: {
      user: 'bg-kakao-yellow text-black',
      partner: 'bg-white text-black',
      userBgColor: '#FEE500',
      partnerBgColor: '#FFFFFF',
      fontSize: 'text-[13px]',
      lineHeight: 'leading-[1.35]',
      maxWidth: 'max-w-[220px]',
      padding: 'py-[5px] px-[9px]',
      borderRadius: '12px',
      tailUser: true,
      tailPartner: true,
    },
    background: 'bg-kakao-bg',
    backgroundColor: '#BACEE0',
    header: {
      bg: 'bg-kakao-bg',
      textColor: 'text-black',
      style: 'h-[50px] px-4',
      backgroundColor: '#BACEE0',
    },
    inputArea: {
      bg: 'bg-white',
      style: 'h-[44px] px-2',
    },
    time: {
      style: 'text-[10px] text-gray-600',
    },
    senderName: {
      style: 'text-[11px] text-gray-600 mb-[3px] ml-[2px]',
      fontSize: '11px',
    },
    contactList: {
      showProfilePicture: true,
      showStatusMessage: true,
      style: 'divide-y divide-gray-200',
    },
    messageGap: '5px',
  },
  line: {
    displayName: '라인',
    showProfilePicture: true,
    profileStyle: 'w-[33px] h-[33px] rounded-[13px]',
    profileRadius: '13px',
    chatBubble: {
      user: 'text-black',              // 라인은 내 말풍선도 검정 글자
      partner: 'bg-white text-black',
      userBgColor: '#78e278',          // 라인 그린
      partnerBgColor: '#FFFFFF',
      fontSize: 'text-[13px]',
      lineHeight: 'leading-[1.35]',
      maxWidth: 'max-w-[220px]',
      padding: 'py-[5px] px-[9px]',
      borderRadius: '12px',
      tailUser: true,
      tailPartner: true,
    },
    background: 'bg-line-bg',
    backgroundColor: '#8dabd8',
    header: {
      bg: 'bg-line-bg',
      textColor: 'text-black',
      style: 'h-[50px] px-[15px]',
      backgroundColor: '#8dabd8',
    },
    inputArea: {
      bg: 'bg-white',
      style: 'h-[50px] px-[10px]',
    },
    time: {
      style: 'text-[10px] text-[#555]',
    },
    senderName: {
      style: 'text-[11px] text-[#444] mb-[3px] ml-[2px]',
      fontSize: '11px',
    },
    contactList: {
      showProfilePicture: true,
      showStatusMessage: false,
      style: 'divide-y divide-green-100',
    },
    messageGap: '5px',
  },
  imessage: {
    displayName: 'iMessage',
    showProfilePicture: false,
    profileStyle: 'w-12 h-12 rounded-full',
    profileRadius: '50%',
    chatBubble: {
      user: 'bg-imessage-blue text-white',
      partner: 'bg-imessage-gray text-black',
      userBgColor: '#007AFF',
      partnerBgColor: '#E9E9EB',
      fontSize: 'text-[14px]',
      lineHeight: 'leading-[1.35]',
      maxWidth: 'max-w-[70%]',
      padding: 'py-[7px] px-[14px]',
      borderRadius: '18px',
      tailUser: true,
      tailPartner: true,
    },
    background: 'bg-white',
    backgroundColor: '#FFFFFF',
    header: {
      bg: 'bg-white/85 backdrop-blur-[10px]',
      textColor: 'text-black',
      style: 'h-[90px] px-3',
      backgroundColor: 'rgba(255, 255, 255, 0.85)',
    },
    inputArea: {
      bg: 'bg-white',
      style: 'min-h-[48px] px-3',
    },
    time: {
      style: 'text-[11px] text-[#8e8e93] font-medium',
    },
    senderName: {
      style: 'text-[11px] text-black font-normal',
      fontSize: '11px',
    },
    contactList: {
      showProfilePicture: false,
      showStatusMessage: false,
      style: 'divide-y divide-gray-200',
    },
    messageGap: '2px',
  },
  basic: {
    displayName: '기본',
    showProfilePicture: true,
    profileStyle: 'w-9 h-9 rounded-full',
    profileRadius: '50%',
    chatBubble: {
      user: 'bg-black text-white shadow-sm',
      partner: 'bg-white text-gray-900 border border-gray-200 shadow-sm',
      userBgColor: '#000000',
      partnerBgColor: '#FFFFFF',
      fontSize: 'text-[15px]',
      lineHeight: 'leading-relaxed',
      maxWidth: 'max-w-[70%]',
      padding: 'py-2.5 px-4',
      borderRadius: '12px',
      tailUser: false,
      tailPartner: false,
    },
    background: 'bg-[#F5F5F7]',
    backgroundColor: '#F5F5F7',
    header: {
      bg: 'bg-white/80 backdrop-blur-md border-b border-gray-200/50',
      textColor: 'text-gray-900',
      style: 'h-[56px] px-6',
      backgroundColor: '#FFFFFF',
    },
    inputArea: {
      bg: 'bg-white border-t border-gray-200',
      style: 'h-[60px] px-4',
    },
    time: {
      style: 'text-[10px] text-gray-400',
    },
    senderName: {
      style: 'text-[11px] text-gray-500 mb-1.5 ml-1 font-medium',
      fontSize: '11px',
    },
    contactList: {
      showProfilePicture: true,
      showStatusMessage: true,
      style: '',
    },
    messageGap: '16px',
  },
};

export const getThemeConfig = (theme: ThemeType): ThemeConfig => {
  return themeConfigs[theme];
};
