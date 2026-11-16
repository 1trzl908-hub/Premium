/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      colors: {
        void: {
          950: '#040406',
          900: '#08080c',
          850: '#0b0b10',
          800: '#101016',
          700: '#16161e',
          600: '#1d1d27',
        },
        silver: {
          200: '#c8cad2',
          300: '#9a9daa',
          400: '#6f7280',
          500: '#4b4d59',
          600: '#2e2f3a',
        },
        volt: {
          300: '#8abaff',
          400: '#66a3ff',
          500: '#4d9fff',
          600: '#2f7fe0',
          700: '#1f5fa8',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'fade-in': 'fadeIn 0.4s ease both',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
