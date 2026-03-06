/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./app.js"
  ],
  darkMode: 'class', // Modo oscuro controlado por la clase "dark"
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'sans-serif'],
      },
      colors: {
        // Colores de fondo y gradiente
        'day-start': '#fda4af',
        'day-middle': '#c084fc',
        'day-end': '#818cf8',
        'night-start': '#020617',
        'night-middle': '#111827',
        'night-end': '#0f172a',
      },
      maxWidth: {
        'gestor': '24rem',
      },
    },
  },
  plugins: [],
}