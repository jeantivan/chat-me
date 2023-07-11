/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    maxWidth: {
      "7/10": "70%",
      "8/10": "80%",
      "9/10": "90%",
    },
    minWidth: {
      md: "768px",
    },

    extend: {},
  },
  plugins: [require("tailwindcss-radix")()],
};
