import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      colors: {
        night: '#070713',
        panel: '#121329',
        violet: '#ab67ff',
        cyan: '#42d9f5',
        pink: '#fd56cb',
      },
      animation: {
        'slow-pulse': 'pulse 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
export default config;
