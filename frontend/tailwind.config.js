import tokens from "./src/theme/tokens";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        success: tokens.colors.success,
        warning: tokens.colors.warning,
        neutral: tokens.colors.neutral,
      },
    },
  },
  plugins: [],
};
