/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: '420px'
      },
      colors: {
        dental: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          500: '#0284c7',
          600: '#0369a1',
          700: '#075985',
          800: '#07476b',
          900: '#0c3d5d',
        }
      },
      fontFamily: {
        mono: ['Courier New', 'Courier', 'monospace']
      }
    },
  },
  plugins: [],
}
