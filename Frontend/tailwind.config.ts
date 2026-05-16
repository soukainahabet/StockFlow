import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surfaces
        app: "rgb(var(--color-app) / <alpha-value>)",
        surface: {
          DEFAULT: "rgb(var(--color-surface) / <alpha-value>)",
          muted: "rgb(var(--color-surface-muted) / <alpha-value>)",
          elevated: "rgb(var(--color-surface-elevated) / <alpha-value>)",
        },
        // Borders (use as `border-default`, `border-strong`)
        default: "rgb(var(--color-border-default) / <alpha-value>)",
        strong: "rgb(var(--color-border-strong) / <alpha-value>)",
        // Text (`text-primary`, `text-secondary`, `text-muted`, `text-disabled`)
        primary: "rgb(var(--color-text-primary) / <alpha-value>)",
        secondary: "rgb(var(--color-text-secondary) / <alpha-value>)",
        muted: "rgb(var(--color-text-muted) / <alpha-value>)",
        disabled: "rgb(var(--color-text-disabled) / <alpha-value>)",
        // Accent
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          fg: "rgb(var(--color-accent-fg) / <alpha-value>)",
          hover: "rgb(var(--color-accent-hover) / <alpha-value>)",
          soft: "rgb(var(--color-accent-soft) / <alpha-value>)",
          "soft-fg": "rgb(var(--color-accent-soft-fg) / <alpha-value>)",
          ring: "rgb(var(--color-accent-ring) / <alpha-value>)",
        },
        // Semantic
        success: {
          DEFAULT: "rgb(var(--color-success) / <alpha-value>)",
          fg: "rgb(var(--color-success-fg) / <alpha-value>)",
          soft: "rgb(var(--color-success-soft) / <alpha-value>)",
          "soft-fg": "rgb(var(--color-success-soft-fg) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "rgb(var(--color-warning) / <alpha-value>)",
          fg: "rgb(var(--color-warning-fg) / <alpha-value>)",
          soft: "rgb(var(--color-warning-soft) / <alpha-value>)",
          "soft-fg": "rgb(var(--color-warning-soft-fg) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--color-danger) / <alpha-value>)",
          fg: "rgb(var(--color-danger-fg) / <alpha-value>)",
          soft: "rgb(var(--color-danger-soft) / <alpha-value>)",
          "soft-fg": "rgb(var(--color-danger-soft-fg) / <alpha-value>)",
        },
        info: {
          DEFAULT: "rgb(var(--color-info) / <alpha-value>)",
          fg: "rgb(var(--color-info-fg) / <alpha-value>)",
          soft: "rgb(var(--color-info-soft) / <alpha-value>)",
          "soft-fg": "rgb(var(--color-info-soft-fg) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      fontSize: {
        // Resserrée : pas d'usage de text-3xl+ dans l'UI fonctionnelle
        xs: ["0.75rem", { lineHeight: "1.125rem" }],
        sm: ["0.8125rem", { lineHeight: "1.25rem" }],
        base: ["0.875rem", { lineHeight: "1.375rem" }],
        md: ["0.9375rem", { lineHeight: "1.4rem" }],
        lg: ["1rem", { lineHeight: "1.5rem" }],
        xl: ["1.125rem", { lineHeight: "1.625rem" }],
        "2xl": ["1.375rem", { lineHeight: "1.875rem" }],
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.375rem",
        md: "0.375rem",
        lg: "0.5rem",
        xl: "0.625rem",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        soft: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
        pop: "0 8px 24px -6px rgb(0 0 0 / 0.10), 0 2px 6px -1px rgb(0 0 0 / 0.04)",
        focus: "0 0 0 2px rgb(var(--color-accent-ring) / 0.4)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
        "zoom-in": {
          from: { opacity: "0", transform: "scale(0.97)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        "zoom-out": {
          from: { opacity: "1", transform: "scale(1)" },
          to: { opacity: "0", transform: "scale(0.97)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        "slide-out-right": {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(100%)" },
        },
        "slide-in-top": {
          from: { transform: "translateY(-8px)", opacity: "0" },
          to: { transform: "translateY(0)", opacity: "1" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.15s ease-out",
        "fade-out": "fade-out 0.15s ease-in",
        "zoom-in": "zoom-in 0.15s cubic-bezier(0.16, 1, 0.3, 1)",
        "zoom-out": "zoom-out 0.1s ease-in",
        "slide-in-right": "slide-in-right 0.22s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-out-right": "slide-out-right 0.18s ease-in",
        "slide-in-top": "slide-in-top 0.18s ease-out",
        "accordion-down": "accordion-down 0.18s ease-out",
        "accordion-up": "accordion-up 0.18s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
