/**
 * Daily Focus — Unified Motion Design Tokens
 * Adheres strictly to purposeful micro-interaction and animation guidelines.
 */

export const EASE_ENTER = [0.16, 1, 0.3, 1] as const;      // Entering elements — smooth with subtle natural settle
export const EASE_EXIT = [0.4, 0, 1, 1] as const;           // Exiting elements — snappy start, crisp exit
export const EASE_STANDARD = [0.65, 0, 0.35, 1] as const;   // State transitions (hover, toggle, tab switch)

export const DURATION = {
  instant: 0.1,   // Hover, press feedback (100ms)
  fast: 0.18,     // Toggle, checkbox, small state changes (180ms)
  normal: 0.28,   // Cards enter/exit, tab switch (280ms)
  slow: 0.4,      // Modal, page transitions, dark mode switch (400ms)
} as const;

export const SPRING_TACTILE = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
} as const;

export const SPRING_BOUNCE = {
  type: 'spring',
  stiffness: 300,
  damping: 20,
} as const;
