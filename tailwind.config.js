module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  theme: {
    maxWidth: {
      "7/10": "70%",
    },
    extend: {},
  },
  plugins: [require("@tailwindcss/line-clamp"), require("tailwindcss-radix")()],
};
