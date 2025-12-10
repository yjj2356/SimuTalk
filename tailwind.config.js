/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // KakaoTalk theme (정밀 조정)
        kakao: {
          yellow: '#FEE500',
          brown: '#3C1E1E',
          bg: '#BACEE0',
          bubble: '#FEE500',
          white: '#FFFFFF',
        },
        // LINE theme (라인 공식 스타일)
        line: {
          green: '#78e278',      // 내 말풍선 (연한 그린)
          bg: '#8dabd8',         // 배경 (블루그레이)
          header: '#8dabd8',     // 헤더 배경
          bubble: '#78e278',     // 내 말풍선
          white: '#FFFFFF',      // 상대방 말풍선
        },
        // iMessage theme
        imessage: {
          blue: '#007AFF',
          gray: '#E5E5EA',
          bg: '#FFFFFF',
        },
      },
    },
  },
  plugins: [],
}
