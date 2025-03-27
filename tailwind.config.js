/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0077B6",
          light: "#4A95C0",
          dark: "#005F92",
        },
        secondary: {
          DEFAULT: "#F4A261",
          light: "#F8C297",
          dark: "#E58940",
        },
        background: {
          DEFAULT: "#F8F9FA",
          dark: "#343A40",
        },
        text: {
          DEFAULT: "#2B2D42",
          light: "#8D99AE",
          lighter: "#EDF2F4",
          dark: "#212529",
        },
        success: "#2A9D8F",
        warning: "#E9C46A",
        error: "#E76F51",
        info: "#40916C",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};
