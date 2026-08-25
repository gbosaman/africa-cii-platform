import type { Config } from "tailwindcss";

// ---------------------------------------------------------------------------
// Design tokens.
//
// Palette matched to the AGIP reference: a deep navy base with an emerald
// primary and blue / violet / orange / red as categorical accents.
//
// NOTE ON NAMING: `gold` and `emerald2` are retained as ALIASES so the existing
// component tree reskins without a hundred find-and-replaces. They now resolve
// to the emerald primary and the blue accent respectively. Prefer the semantic
// names (`accent`, `info`, `warn`, `danger`) in new code.
// ---------------------------------------------------------------------------

const NAVY = {
  950: "#05070d",
  900: "#070a12", // body
  850: "#0a0f1c",
  800: "#0f1626",
  700: "#16203a",
  600: "#1e2c4c",
  500: "#2a3a60",
};

const EMERALD = { DEFAULT: "#22c55e", 400: "#4ade80", 500: "#22c55e", 600: "#16a34a" };
const BLUE = { DEFAULT: "#38bdf8", 400: "#7dd3fc", 500: "#38bdf8", 600: "#0ea5e9" };
const VIOLET = { DEFAULT: "#a855f7", 400: "#c084fc", 500: "#a855f7", 600: "#9333ea" };
const ORANGE = { DEFAULT: "#f59e0b", 400: "#fbbf24", 500: "#f59e0b", 600: "#d97706" };
const RED = { DEFAULT: "#f43f5e", 400: "#fb7185", 500: "#f43f5e", 600: "#e11d48" };

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        xs: "420px",
      },
      colors: {
        ink: NAVY,
        navy: NAVY,

        // Semantic accents
        accent: EMERALD,
        info: BLUE,
        violet2: VIOLET,
        warn: ORANGE,
        danger: RED,

        // Deprecated aliases — keep the existing tree working.
        gold: EMERALD,
        emerald2: BLUE,

        line: "rgba(255, 255, 255, 0.08)",
        "line-strong": "rgba(255, 255, 255, 0.15)",
        glass: "rgba(20, 33, 56, 0.55)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        card: "18px",
        "card-sm": "12px",
      },
      boxShadow: {
        panel: "0 10px 40px -12px rgba(0, 0, 0, 0.6)",
        lift: "0 24px 70px -20px rgba(0, 0, 0, 0.75)",
        glow: "0 0 0 1px rgba(34, 197, 94, 0.25), 0 8px 30px -8px rgba(34, 197, 94, 0.18)",
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 0 0 rgba(34,197,94,0.5)" },
          "50%": { opacity: "0.5", boxShadow: "0 0 0 5px rgba(34,197,94,0)" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "none" },
        },
        scrollX: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "pulse-dot": "pulseDot 1.6s infinite",
        "fade-up": "fadeUp 0.5s both",
        "scroll-x": "scrollX 40s linear infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
