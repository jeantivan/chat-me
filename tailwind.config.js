/** @type {import('tailwindcss').Config} */

module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    maxWidth: {
      "7/10": "70%",
    },
    minWidth: {
      md: "768px",
    },

    extend: {},
  },
  plugins: [require("@tailwindcss/line-clamp"), require("tailwindcss-radix")()],
};
