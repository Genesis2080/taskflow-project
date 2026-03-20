/** @type {import('tailwindcss').Config} */
module.exports = {
  // Apunta a todos los archivos del frontend dentro de client/
  // para que Tailwind sepa qué clases incluir en el build final.
  content: [
    "./client/index.html",
    "./client/app.js",
    "./client/src/**/*.js",   // cubre api/, audio/, services/ y ui/
  ],

  darkMode: "class",

  theme: {
    extend: {
      fontFamily: {
        sans:    ["DM Sans", "sans-serif"],
        display: ["Syne", "sans-serif"],
      },
      colors: {
        day:   { from: "#fdf6e3", mid: "#fdd9b5", to: "#f9c5a1" },
        night: { from: "#0f172a", mid: "#111827", to: "#1e293b" },
      },
    },
  },

  plugins: [],
};