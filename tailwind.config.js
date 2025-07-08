/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./ahrq-dashboard.tsx"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          base: '#1e3a8a',
          light: '#3b82f6',
          lighter: '#60a5fa',
          lightest: '#dbeafe',
          dark: '#1e40af',
          darker: '#1e3a8a',
          contrast: '#ffffff',
        },
      },
      backgroundColor: theme => ({
        ...theme('colors'),
        'primary-base': '#1e3a8a',
        'primary-light': '#3b82f6',
        'primary-lighter': '#60a5fa',
        'primary-lightest': '#dbeafe',
        'primary-dark': '#1e40af',
        'primary-darker': '#1e3a8a',
      }),
    },
  },
  plugins: [],
}