/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./content/**/*.{html,md}", "./layouts/**/*.html"],
  theme: {
    extend: {},
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("daisyui"),
    require("@tailwindcss/aspect-ratio"),
    require("@tailwindcss/forms"),
  ],
  daisyui: {
    themes: ["retro", "night"],
  },
};
