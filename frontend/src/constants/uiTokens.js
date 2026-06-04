/**
 * JS mirror of Profile/index.jsx section accents — use with Tailwind gradient classes.
 * Reference: frontend/src/pages/Profile/index.jsx (Card component)
 */
export const SECTION_GRADIENTS = {
  indigo: "from-indigo-500 to-indigo-600",
  emerald: "from-emerald-500 to-emerald-600",
  amber: "from-amber-500 to-orange-500",
  rose: "from-rose-500 to-pink-500",
  cyan: "from-cyan-500 to-teal-500",
};

export const PROFILE_PAGE = {
  canvasLight: "bg-gray-50",
  canvasDark: "dark:bg-[#09090b]",
  surfaceDark: "dark:bg-[#111113]",
  borderDark: "dark:border-white/[0.06]",
  heroGradient:
    "bg-gradient-to-br from-indigo-600 via-purple-600 to-cyan-500 dark:from-indigo-900 dark:via-purple-900 dark:to-cyan-800",
  progressBar: "bg-gradient-to-r from-indigo-500 to-cyan-500",
  ringGradient: { start: "#6366f1", end: "#06b6d4" },
  tabActive:
    "bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm",
  tabInactive:
    "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/60 dark:hover:bg-white/5",
};

/** Tailwind class bundles for stat / list cards (replaces raw black borders) */
export const STAT_CARD = {
  root: "bg-surface border border-hairline rounded-tracker-lg p-6 transition-colors",
  iconWrap: "p-2.5 bg-canvas rounded-tracker-md",
  icon: "h-5 w-5 text-ink",
  title: "text-sm font-medium text-ink-muted mb-1",
  value: "text-[28px] font-medium text-ink tracking-tight leading-tight",
  subtitle: "text-xs text-ink-subtle mt-1",
};
