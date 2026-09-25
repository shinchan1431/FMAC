/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#FBF6E9',
          100: '#F5E6C8',
          200: '#E8CD8A',
          300: '#D4AF37',
          400: '#C49E2F',
          500: '#B8901F',
          600: '#9A7818',
          700: '#7C6012',
          800: '#5E480C',
          900: '#403008',
        },
        ink: {
          50: '#E8E9EC',
          100: '#C8CAD0',
          200: '#9A9CA5',
          300: '#6E7079',
          400: '#4A4C54',
          500: '#2E3038',
          600: '#1E2028',
          700: '#15161D',
          800: '#0E0F14',
          900: '#08090C',
        },
        accent: {
          cyan: '#22D3EE',
          emerald: '#34D399',
          rose: '#FB7185',
          amber: '#FBBF24',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'grow-bar': 'growBar 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGold: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        growBar: {
          '0%': { transform: 'scaleY(0)' },
          '100%': { transform: 'scaleY(1)' },
        },
      },
    },
  },
  plugins: [],
};
