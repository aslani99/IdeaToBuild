/**
 * Centralized design tokens (see docs/ARCHITECTURE.md, Section 63 of the
 * master spec). Nothing in `presentation/` should hardcode raw color/spacing
 * values — import from here instead.
 */
export const colors = {
  background: "var(--color-background)",
  surface: "var(--color-surface)",
  textPrimary: "var(--color-text-primary)",
  textSecondary: "var(--color-text-secondary)",
  accent: "var(--color-accent)",
  danger: "var(--color-danger)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
} as const;

export const spacing = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
} as const;

export const radius = {
  sm: "4px",
  md: "8px",
  lg: "16px",
  full: "9999px",
} as const;

export type ThemeMode = "light" | "dark" | "system";
