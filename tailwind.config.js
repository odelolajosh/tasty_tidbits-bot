const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./public/**/*.{html,js}"],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['Spline Sans Mono', ...defaultTheme.fontFamily.mono],
      }
    }
  },
  plugins: [],
}
