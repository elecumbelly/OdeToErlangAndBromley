/**
 * Design System Tokens
 *
 * Scientific / Vivid on Black aesthetic.
 * Bloomberg terminal meets synthesizer interface.
 * Pure black canvas with electric accent colors.
 */

export const colors = {
  // Background layers - pure black to near-black
  bg: {
    base: '#000000',      // True black canvas
    surface: '#0a0a0a',   // Card backgrounds
    elevated: '#111111',  // Elevated elements
    hover: '#1a1a1a',     // Hover states
  },

  // Text hierarchy
  text: {
    primary: '#ffffff',   // Main text
    secondary: '#888888', // Secondary info
    muted: '#555555',     // Disabled, hints
    inverse: '#000000',   // On bright backgrounds
  },

  // Border colors
  border: {
    subtle: '#333333',    // Default borders
    muted: '#222222',     // Very subtle
    active: '#00fff7',    // Active/focus states (cyan)
  },

  // VIVID Accent Colors
  cyan: {
    DEFAULT: '#00fff7',   // Primary actions, focus, links
    dim: '#00cccc',       // Hover state
    glow: 'rgba(0, 255, 247, 0.3)', // Glow effect
  },

  magenta: {
    DEFAULT: '#ff00ff',   // Highlights, secondary actions
    dim: '#cc00cc',       // Hover state
    glow: 'rgba(255, 0, 255, 0.3)',
  },

  green: {
    DEFAULT: '#00ff00',   // Success, positive metrics
    dim: '#00cc00',
    glow: 'rgba(0, 255, 0, 0.3)',
  },

  amber: {
    DEFAULT: '#ffaa00',   // Warning, caution
    dim: '#cc8800',
    glow: 'rgba(255, 170, 0, 0.3)',
  },

  red: {
    DEFAULT: '#ff3333',   // Error, critical
    dim: '#cc2929',
    glow: 'rgba(255, 51, 51, 0.3)',
  },

  blue: {
    DEFAULT: '#0088ff',   // Info, secondary
    dim: '#006acc',
    glow: 'rgba(0, 136, 255, 0.3)',
  },
} as const;

export const spacing = {
  0: '0px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
} as const;

export const radii = {
  none: '0px',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

export const shadows = {
  none: 'none',
  sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
  md: '0 4px 12px rgba(0, 0, 0, 0.6)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.7)',
  // Glow shadows for accent colors
  'glow-cyan': '0 0 20px rgba(0, 255, 247, 0.4)',
  'glow-magenta': '0 0 20px rgba(255, 0, 255, 0.4)',
  'glow-green': '0 0 20px rgba(0, 255, 0, 0.4)',
  'glow-amber': '0 0 20px rgba(255, 170, 0, 0.4)',
  'glow-red': '0 0 20px rgba(255, 51, 51, 0.4)',
} as const;

export const transitions = {
  fast: '100ms ease-out',
  normal: '200ms ease-out',
  slow: '300ms ease-out',
  spring: '400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

export const typography = {
  fontFamily: {
    mono: '"JetBrains Mono", "IBM Plex Mono", "Fira Code", "SF Mono", Consolas, monospace',
    // Everything is mono in this design system
    sans: '"JetBrains Mono", "IBM Plex Mono", "Fira Code", monospace',
  },
  fontSize: {
    '2xs': ['10px', { lineHeight: '14px', letterSpacing: '0.05em' }],
    xs: ['11px', { lineHeight: '16px', letterSpacing: '0.04em' }],
    sm: ['12px', { lineHeight: '18px', letterSpacing: '0.02em' }],
    base: ['13px', { lineHeight: '20px', letterSpacing: '0.01em' }],
    lg: ['14px', { lineHeight: '22px' }],
    xl: ['16px', { lineHeight: '24px' }],
    '2xl': ['20px', { lineHeight: '28px' }],
    '3xl': ['24px', { lineHeight: '32px' }],
    '4xl': ['32px', { lineHeight: '40px' }],
    '5xl': ['48px', { lineHeight: '56px' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// Animation timing functions
export const easing = {
  smooth: 'ease-out',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
} as const;

// Semantic color mappings for status indicators
export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export const statusColors: Record<StatusType, { bg: string; text: string; border: string; glow: string }> = {
  success: {
    bg: 'rgba(0, 255, 0, 0.1)',
    text: colors.green.DEFAULT,
    border: colors.green.dim,
    glow: colors.green.glow,
  },
  warning: {
    bg: 'rgba(255, 170, 0, 0.1)',
    text: colors.amber.DEFAULT,
    border: colors.amber.dim,
    glow: colors.amber.glow,
  },
  error: {
    bg: 'rgba(255, 51, 51, 0.1)',
    text: colors.red.DEFAULT,
    border: colors.red.dim,
    glow: colors.red.glow,
  },
  info: {
    bg: 'rgba(0, 136, 255, 0.1)',
    text: colors.blue.DEFAULT,
    border: colors.blue.dim,
    glow: colors.blue.glow,
  },
  neutral: {
    bg: 'rgba(255, 255, 255, 0.05)',
    text: colors.text.secondary,
    border: colors.border.subtle,
    glow: 'transparent',
  },
};

// Z-index scale
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  modal: 1200,
  popover: 1300,
  tooltip: 1400,
  toast: 1500,
} as const;

// Breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// Export all tokens as a single object for Tailwind
export const tokens = {
  colors,
  spacing,
  radii,
  shadows,
  transitions,
  typography,
  easing,
  statusColors,
  zIndex,
  breakpoints,
} as const;

export default tokens;
