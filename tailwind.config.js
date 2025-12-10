/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // KakaoTalk theme
        kakao: {
          yellow: '#FEE500',
          brown: '#3C1E1E',
          bg: '#B2C7D9',
          bubble: '#FFEB33',
        },
        // LINE theme
        line: {
          green: '#06C755',
          bg: '#7494A8',
          bubble: '#06C755',
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
