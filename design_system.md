# Priora Design Language & Visual Specification

## Design Philosophy

The Priora design system is built specifically for high-throughput executive focus. Unlike traditional web applications or dense email clients, Priora enforces visual calm, high signal-to-noise ratio, and clear priority indicators.

---

## 1. Color System Architecture

### Base Surfaces (Dark Mode First)
- **Background (`#07090e`)**: Deep obsidian dark tone. Prevents eye fatigue during extended executive triage.
- **Surface / Card (`#0f172a` / `rgba(30, 41, 59, 0.4)`)**: Slate background elevated from the primary canvas. Used for threads, action items, and executive summaries.
- **Borders (`rgba(255, 255, 255, 0.08)`)**: Ultra-thin, 1px semi-transparent borders to separate surfaces without heavy visual noise.

### Accent & Semantic Palette
- **Primary Indigo (`#6366f1`)**: Reserved for primary user actions, keyboard focus indicators, and active navigation targets.
- **AI Cyan Glow (`#0ea5e9` / `rgba(14, 165, 233, 0.25)`)**: Distinct signature indicator for AI-synthesized summaries, automated response drafts, and AI status indicators.
- **Urgency Palette**:
  - `Urgent` (`#ef4444` / 12% opacity background): Highlights hard deadlines (<24 hours) or critical executive alerts.
  - `Action Required` (`#f59e0b` / 12% opacity background): Highlights required decisions or requested responses.
  - `Success` (`#10b981` / 12% opacity background): Confirms archived threads, dispatched emails, or zero-inbox completion.

---

## 2. Executive Typography Scale

Priora uses system sans-serif (`Inter`, `-apple-system`, `BlinkMacSystemFont`) for optimal legibility at compact display sizes.

| Token | Size | Line Height | Usage |
| :--- | :--- | :--- | :--- |
| `2xs` | 10px (`0.625rem`) | 14px | Hotkey indicators, tiny metadata tags |
| `xs` | 12px (`0.75rem`) | 16px | Timestamps, urgency badges, secondary tags |
| `sm` | 13px (`0.8125rem`) | 18px | Thread card snippets, sidebar nav labels |
| `base` | 14px (`0.875rem`) | 20px | Standard body text, AI summary paragraphs |
| `lg` | 16px (`1.000rem`) | 24px | Section headers, card titles |
| `xl` | 20px (`1.250rem`) | 28px | Page titles, executive briefing header |
| `2xl` | 24px (`1.500rem`) | 32px | Primary dashboard header |

---

## 3. Geometry & Spacing

- **Baseline Spacing**: 4px grid (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`).
- **Corner Radii**:
  - `4px` (`radius-sm`): Buttons, inputs, badges, keycap hints.
  - `8px` (`radius-md`): Cards, context dropdowns.
  - `12px` (`radius-lg`): Executive panels, main layout containers, modal dialogs.
  - `9999px` (`radius-full`): Avatars, active status dots.

---

## 4. Glassmorphic & Elevation Utilities

- `.glass-panel`: Backdrop blur (`12px`) with semi-transparent slate surface (`rgba(15, 23, 42, 0.75)`). Used for sticky headers, command popovers, and slide-over panels.
- `.glass-card`: Light backdrop blur (`8px`) with subtle border glow on hover (`rgba(255, 255, 255, 0.14)`).
- `.ai-badge`: Distinct cyan backdrop glow indicating AI-synthesized information.
- `.focus-ring`: Accessible 2px indigo outline (`#6366f1`) with 2px offset for seamless keyboard navigation.
- `.custom-scrollbar`: Ultra-thin (6px) semi-transparent scrollbar thumb.

---

## 5. Z-Index & Elevation Scale

- `z-base` (0): Base canvas & thread content.
- `z-above` (10): Floating action bars, card hover badges.
- `z-sticky` (20): Sticky pane headers & top navigation bars.
- `z-dropdown` (30): Select menus, context menus.
- `z-drawer` (40): Slide-over sender context drawer.
- `z-modal` (50): AI Composer overlay, confirmation popups.
- `z-tooltip` (60): Keyboard shortcut tooltips & label hints.
