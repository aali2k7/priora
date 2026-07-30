/**
 * Priora V2 Design System Tokens
 * Centralized design token definitions mirroring globals.css for type-safe usage.
 * Primary Accent: Indigo Dominant
 */

export const colors = {
  // CSS Variables for dynamic theme adaptivity
  background: "var(--bg-canvas)",
  surface: "var(--bg-surface)",
  surfaceHover: "var(--bg-surface-hover)",
  surfaceActive: "var(--bg-surface-active)",
  
  foreground: "var(--text-primary)",
  foregroundSecondary: "var(--text-secondary)",
  foregroundMuted: "var(--text-muted)",

  border: "var(--border-subtle)",
  borderHover: "var(--border-hover)",

  primary: "var(--accent-primary)",
  primaryHover: "var(--accent-primary-hover)",
  primarySubtle: "var(--accent-primary-subtle)",

  status: {
    urgent: "var(--status-danger)",
    urgentSubtle: "var(--status-danger-subtle)",
    urgentBorder: "var(--status-danger-border)",
    
    warning: "var(--status-warning)",
    warningSubtle: "var(--status-warning-subtle)",
    warningBorder: "var(--status-warning-border)",
    
    success: "var(--status-success)",
    successSubtle: "var(--status-success-subtle)",
    successBorder: "var(--status-success-border)",
    
    neutral: "var(--text-muted)",
    neutralSubtle: "var(--border-subtle)",
  },
} as const;

export const radius = {
  sm: "6px",
  md: "10px",
  lg: "16px",
  xl: "24px",
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

export const animation = {
  durationFast: "150ms",
  durationNormal: "200ms",
  easingDefault: "cubic-bezier(0.16, 1, 0.3, 1)",
  easingExecutive: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;
