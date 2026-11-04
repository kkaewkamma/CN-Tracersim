/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        cisco: {
          blue: '#049fd9',
          dark: '#0b111a',
          panel: '#111827',
          border: '#1f293d',
          accent: '#00bceb'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'Sarabun', 'sans-serif']
      }
    },
  },
  plugins: [],
}

