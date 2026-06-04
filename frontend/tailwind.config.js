// tailwind.config.js
import lineClamp from '@tailwindcss/line-clamp';
import Scrollbar from 'tailwind-scrollbar-hide';

export default {
  darkMode: "class", // ✅ enable class-based dark mode
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "var(--tracker-canvas)",
        "canvas-muted": "var(--tracker-canvas-muted)",
        surface: "var(--tracker-surface)",
        "surface-2": "var(--tracker-surface-2)",
        ink: "var(--tracker-ink)",
        "ink-muted": "var(--tracker-ink-muted)",
        "ink-subtle": "var(--tracker-ink-subtle)",
        hairline: "var(--tracker-hairline)",
        "hairline-soft": "var(--tracker-hairline-soft)",
        accent: "var(--tracker-accent)",
      },
    },
  },
  plugins: [lineClamp, Scrollbar],
};
