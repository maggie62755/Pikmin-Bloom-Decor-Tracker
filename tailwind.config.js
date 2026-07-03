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
        journal: COLORS.journal,
      },
      fontFamily: {
        display: ['Fredoka', 'Nunito', 'sans-serif'],
        sans: ['Nunito', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'collect-pulse': 'collectPulse 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'uncollect-shake': 'uncollectShake 0.3s ease-out',
        'pop-in': 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        collectPulse: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.15)' },
          '70%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        uncollectShake: {
          '0%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-3px) rotate(-1deg)' },
          '50%': { transform: 'translateX(3px) rotate(1deg)' },
          '75%': { transform: 'translateX(-2px)' },
          '100%': { transform: 'translateX(0)' },
        },
        popIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeInUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
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
    { pattern: /^bg-journal-/ },
    { pattern: /^text-journal-/ },
  ],
  plugins: [],
}
