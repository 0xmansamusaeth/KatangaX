/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#1B5E20",
          light: "#2E7D32",
          dark: "#145214",
        },
        accent: {
          DEFAULT: "#FFC107",
          light: "#FFD54F",
        },
        background: "#F5F7F5",
        surface: "#FFFFFF",
        foreground: "#1A1A1A",
        "text-primary": "#1A1A1A",
        "text-secondary": "#6B7280",
        error: "#DC2626",
        success: "#16A34A",
        warning: "#D97706",
        border: "#E5E7EB",
      },
      fontFamily: {
        sans: ["var(--font-poppins)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
