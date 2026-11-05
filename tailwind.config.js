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
        sans: [
          'Inter',
          '"Noto Sans Thai"',
          '"IBM Plex Sans Thai"',
          'Sarabun',
          '"Leelawadee UI"',
          '"Segoe UI"',
          'Thonburi',
          '"Sukhumvit Set"',
          'Tahoma',
          'sans-serif'
        ],
        mono: [
          '"JetBrains Mono"',
          '"Fira Code"',
          'Consolas',
          '"SFMono-Regular"',
          'Menlo',
          'Monaco',
          '"Leelawadee UI"',
          '"Noto Sans Thai"',
          'Sarabun',
          'Thonburi',
          'Tahoma',
          'monospace'
        ]
      }
    },
  },
  plugins: [],
}

