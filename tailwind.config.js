import { COLORS } from './src/theme/colors.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: COLORS.brand,
        status: COLORS.status,
        pikmin: COLORS.pikmin,
        nature: COLORS.nature,
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  safelist: [
    { pattern: /^bg-pikmin-/ },
    { pattern: /^text-pikmin-/ },
    { pattern: /^bg-brand-/ },
    { pattern: /^text-brand-/ },
    { pattern: /^bg-status-/ },
    { pattern: /^text-status-/ },
    { pattern: /^bg-nature-/ },
  ],
  plugins: [],
}

