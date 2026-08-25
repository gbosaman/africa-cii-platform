import type { Config } from "tailwindcss";

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
        // Narrow-phone breakpoint — below this, type and grids step down.
        xs: "420px",
      },
      colors: {
        // Institutional dark-navy base (from reference design)
        ink: {
          950: "#070b16",
          900: "#0a1020",
          850: "#0c1428",
          800: "#111a30",
          700: "#16223d",
          600: "#1d2c4d",
          500: "#26375e",
        },
        // Gold / signal-yellow accent
        gold: {
          DEFAULT: "#F5C518",
          400: "#FFD22E",
          500: "#F5C518",
          600: "#D9A700",
        },
        // Emerald "capital" green
        emerald2: {
          DEFAULT: "#16E07A",
          400: "#3DE98F",
          500: "#16E07A",
          600: "#0FB863",
        },
        line: "rgba(148, 163, 184, 0.14)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 8px 30px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(245,197,24,0.25), 0 8px 30px -8px rgba(245,197,24,0.15)",
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
