import type { Config } from "tailwindcss";

/**
 * ExamFluent dizayn tizimi.
 *
 * Ranglar CSS o'zgaruvchilari (globals.css ichida) orqali beriladi —
 * shu sababli kelajakda dark mode qo'shish oson bo'ladi.
 *
 * Asosiy rang — to'q ko'k (navy/indigo). Sabab: ko'k rang ishonch,
 * jiddiylik va akademiklikni bildiradi (imtihon platformalari uchun standart).
 */
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brend rangi — to'q ko'k
        brand: {
          50: "#eef4ff",
          100: "#dae6ff",
          200: "#bdd3ff",
          300: "#90b6ff",
          400: "#5c8dff",
          500: "#3665f8",
          600: "#2044ed",
          700: "#1a34d9",
          800: "#1c2eaf",
          900: "#1c2d8a",
          950: "#151d54",
        },
        // Yordamchi (accent) rang — natija/muvaffaqiyat uchun yashil-turkuaz
        accent: {
          50: "#ecfdf6",
          100: "#d1fae9",
          200: "#a7f3d6",
          300: "#6ee7bd",
          400: "#34d39e",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
        },
        // Sof neytral (kulrang) shkala — matn va chegaralar uchun
        ink: {
          50: "#f8fafc",
          100: "#f1f5f9",
          200: "#e2e8f0",
          300: "#cbd5e1",
          400: "#94a3b8",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
          800: "#1e293b",
          900: "#0f172a",
          950: "#020617",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.04), 0 4px 16px -4px rgb(15 23 42 / 0.08)",
        lift: "0 2px 4px 0 rgb(15 23 42 / 0.04), 0 12px 32px -8px rgb(15 23 42 / 0.14)",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
