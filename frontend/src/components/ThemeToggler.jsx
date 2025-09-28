import React, { useContext } from "react";
import { useTheme } from "../context/themeProvider";

const ThemeToggler = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded transition-colors ${
        theme === "dark" ? "bg-gray-800 text-white" : "bg-gray-200 text-black"
      }`}
      aria-label="Toggle theme"
    >
      {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
};

export default ThemeToggler;
