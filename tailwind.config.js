/** @type {import('tailwindcss').Config} */ 
module.exports = {
  content: [
    "./index.html",
    "./app.js"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        'theme-default-start': '#fda4af',
        'theme-default-middle': '#c084fc',
        'theme-default-end': '#818cf8',

        'theme-warm-start': '#fcd34d',
        'theme-warm-middle': '#fb923c',
        'theme-warm-end': '#f87171',

        'theme-cool-start': '#60a5fa',
        'theme-cool-middle': '#3b82f6',
        'theme-cool-end': '#2563eb',

        'funebre-start': '#1f1f1f',
        'funebre-middle': '#111111',
        'funebre-end': '#2a2a2a',
      },
      maxWidth: {
        gestor: '24rem',
      }
    },
  },
  plugins: [],
}