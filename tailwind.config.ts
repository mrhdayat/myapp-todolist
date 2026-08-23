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
        base: "rgb(var(--base-rgb) / <alpha-value>)",
        "surface-raised": "rgb(var(--surface-raised-rgb) / <alpha-value>)",
        "text-primary": "rgb(var(--text-primary-rgb) / <alpha-value>)",
        "text-secondary": "rgb(var(--text-secondary-rgb) / <alpha-value>)",
        accent: "rgb(var(--accent-rgb) / <alpha-value>)",
        "accent-text": "rgb(var(--accent-text-rgb) / <alpha-value>)",
        "status-done": "rgb(var(--status-done-rgb) / <alpha-value>)",
        "status-urgent": "rgb(var(--status-urgent-rgb) / <alpha-value>)",
        "shadow-light": "var(--shadow-light)",
        "shadow-dark": "var(--shadow-dark)",
        "border-subtle": "var(--border-subtle)",
      },
      borderRadius: {
        "neu-lg": "24px",
        "neu-md": "16px",
        "neu-sm": "12px",
      },
      fontFamily: {
        display: ["'Clash Display'", "'ClashDisplay-Variable'", "'ClashDisplay-Bold'", "-apple-system", "sans-serif"],
        body: ["'General Sans'", "'GeneralSans-Variable'", "-apple-system", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      spacing: {
        "gap-desktop": "20px",
        "gap-mobile": "12px",
        "pad-card-lg": "24px",
        "pad-card-sm": "16px",
      },
      transitionTimingFunction: {
        "neu-smooth": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
