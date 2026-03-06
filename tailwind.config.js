/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./app.js"
  ],
  darkMode: 'class', // Modo oscuro controlado por clase
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        'funebre-start': '#020617',
        'funebre-middle': '#111827',
        'funebre-end': '#0f172a',
      },
      maxWidth: {
        'gestor': '24rem',
      },
      transitionProperty: {
        'colors-bg': 'background-color, color',
      },
      boxShadow: {
        'ring': '0 0 0 2px rgba(59,130,246,0.5)',
      }
    },
  },
  plugins: [],
}