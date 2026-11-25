/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nexus: {
          darkest: '#070b14',
          dark: '#0d1527',
          surface: '#131e38',
          card: '#182442',
          border: '#22345e',
          hover: '#1f3056',
          primary: '#0ea5e9',
          accent: '#06b6d4',
          glow: 'rgba(14, 165, 233, 0.15)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
