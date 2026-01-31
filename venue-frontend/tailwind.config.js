export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgPrimary: '#0B0D10',
        bgSecondary: '#12151C',
        bgCard: '#171B24',
        borderSubtle: '#262B36',

        accentOrange: '#F28C28',
        accentHover: '#FF9F43',

        textPrimary: '#FFFFFF',
        textMuted: '#A9B0C2',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
