/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff8ff',
          100: '#dff0ff',
          500: '#1c8dff',
          600: '#0874e8',
          700: '#075bbb',
          900: '#0b2346',
        },
        lilac: {
          50: '#f7f3ff',
          100: '#eee6ff',
          400: '#a98bff',
          600: '#7657de',
        },
        mint: {
          50: '#edfffb',
          500: '#20c7a8',
        },
      },
      boxShadow: {
        soft: '0 18px 45px rgba(13, 64, 122, 0.10)',
        glow: '0 22px 60px rgba(28, 141, 255, 0.24)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        reveal: 'reveal 0.8s ease both',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
