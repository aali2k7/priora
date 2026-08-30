/**
 * Priora Executive Design System Tokens (Direction C)
 * Centralized design token definitions mirroring globals.css for type-safe usage.
 */

export const colors = {
  background: "var(--bg-canvas)",
  surface: "var(--bg-surface)",
  surfaceHover: "var(--bg-surface-hover)",
  surfaceActive: "var(--bg-surface-active)",
  surfaceSelected: "var(--bg-surface-selected)",

  foreground: "var(--text-primary)",
  foregroundSecondary: "var(--text-secondary)",
  foregroundMuted: "var(--text-muted)",

  border: "var(--border-subtle)",
  borderHover: "var(--border-hover)",
  borderStrong: "var(--border-strong)",

  primary: "var(--accent-primary)",
  primaryHover: "var(--accent-primary-hover)",
  primarySubtle: "var(--accent-primary-subtle)",
  primaryBorder: "var(--accent-primary-border)",

  status: {
    urgent: "var(--status-urgent)",
    urgentSubtle: "var(--status-urgent-subtle)",
    urgentBorder: "var(--status-urgent-border)",

    action: "var(--status-action)",
    actionSubtle: "var(--status-action-subtle)",
    actionBorder: "var(--status-action-border)",

    success: "var(--status-success)",
    successSubtle: "var(--status-success-subtle)",
    successBorder: "var(--status-success-border)",

    ai: "var(--status-ai)",
    aiSubtle: "var(--status-ai-subtle)",
    aiBorder: "var(--status-ai-border)",
  },
} as const;

export const radius = {
  xs: "4px",
  sm: "6px",
  md: "8px",
  lg: "10px",
  full: "9999px",
} as const;

export const zIndex = {
  base: 0,
  above: 10,
  sticky: 20,
  dropdown: 30,
  drawer: 40,
  modal: 50,
  tooltip: 60,
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;
