/**
 * Priora Design System Tokens
 * Centralized design token definitions mirroring globals.css for type-safe usage.
 */

export const colors = {
  background: "#07090e",
  surface: "#0f172a",
  surfaceHover: "#1e293b",
  surfaceActive: "#334155",
  
  foreground: "#f8fafc",
  foregroundSecondary: "#94a3b8",
  foregroundMuted: "#64748b",

  border: "rgba(255, 255, 255, 0.08)",
  borderHover: "rgba(255, 255, 255, 0.16)",

  primary: "#6366f1",
  primaryHover: "#4f46e5",
  primarySubtle: "rgba(99, 102, 241, 0.12)",

  ai: "#0ea5e9",
  aiSubtle: "rgba(14, 165, 233, 0.12)",
  aiGlow: "rgba(14, 165, 233, 0.25)",

  status: {
    urgent: "#ef4444",
    urgentSubtle: "rgba(239, 68, 68, 0.12)",
    warning: "#f59e0b",
    warningSubtle: "rgba(245, 158, 11, 0.12)",
    success: "#10b981",
    successSubtle: "rgba(16, 185, 129, 0.12)",
    neutral: "#64748b",
    neutralSubtle: "rgba(100, 116, 139, 0.12)",
  },
} as const;

export const radius = {
  sm: "4px",
  md: "8px",
  lg: "12px",
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
  easingDefault: "cubic-bezier(0.4, 0, 0.2, 1)",
  easingExecutive: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
} as const;
