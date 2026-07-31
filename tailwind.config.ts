import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page:    "#EDEEF0",
        surface: "#FFFFFF",
        ink:     "#16181D",
        muted:   "#6B7079",
        hair:    "#D9DBE0",
        accent:  "#4B4FA6",
      },
      fontFamily: {
        sans:  ["var(--font-ui)", "system-ui", "sans-serif"],
        serif: ["var(--font-display)", "Georgia", "serif"],
      },
    },
  },
} satisfies Config;
