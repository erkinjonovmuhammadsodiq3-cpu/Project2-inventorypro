/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#080D20', 900: '#0B1530', 800: '#111C3A' },
        mist: { 300: '#8FA3CC', 200: '#B9C9EE', 100: '#E6ECFA' },
        neon: { blue: '#168BFF', cyan: '#00D9FF', violet: '#792BFF', purple: '#A855F7' },
        ok: '#00E5A0',
        warn: '#FFB020',
        danger: '#FF4D67',
      },
      fontFamily: { body: ['Inter', 'system-ui', 'sans-serif'] },
      boxShadow: {
        glow: '0 0 26px rgba(22,139,255,.25)',
        'glow-lg': '0 0 20px rgba(22,139,255,.65)',
      },
    },
  },
  plugins: [],
}
