// tailwind.config.js
import lineClamp from '@tailwindcss/line-clamp';

export default {
  darkMode: "class", // ✅ enable class-based dark mode
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [lineClamp],
};
