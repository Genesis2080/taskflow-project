/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./app.js"],
  darkMode: "class", // Modo oscuro controlado por la clase "dark"
  theme: {
    extend: {
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
      colors: {
        dayStart: "#fdf6e3",
        dayMiddle: "#fdd9b5",
        dayEnd: "#f9c5a1",
        nightStart: "#1e293b",
        nightMiddle: "#111827",
        nightEnd: "#0f172a",
      },
      maxWidth: {
        gestor: "24rem",
      },
    },
  },
  plugins: [],
};