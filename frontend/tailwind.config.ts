import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f6f3fe",
          100: "#ede7fd",
          200: "#ded0fc",
          300: "#c5abfa",
          400: "#a67df5",
          500: "#8055E8", // Primary purple
          600: "#6036C9", // Deep purple
          700: "#4f2ba8",
          800: "#412489",
          900: "#271457",
        },
        surface: {
          light: "#F7F6FC",
          dark: "#11101A",
          glass: "rgba(255, 255, 255, 0.75)",
          glassDark: "rgba(24, 21, 40, 0.75)",
        }
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        serif: ["Merriweather", "Georgia", "serif"],
        mono: ["JetBrains Mono", "Menlo", "Courier New", "monospace"],
      },
      boxShadow: {
        "glow-purple": "0 0 30px -5px rgba(128, 85, 232, 0.35)",
        "glow-blue": "0 0 30px -5px rgba(59, 130, 246, 0.35)",
        "glass": "0 8px 32px 0 rgba(96, 54, 201, 0.08)",
        "glass-dark": "0 8px 32px 0 rgba(0, 0, 0, 0.45)",
      }
    },
  },
  plugins: [],
};
export default config;
