/**
 * HeadHunter Design System - Global Design Tokens
 * Central source of truth for all UI styling across the platform
 */

export const COLORS = {
  // Primary Palette
  primary: {
    50: '#F3EFFF',
    100: '#E9DEFF',
    200: '#D8C7FF',
    300: '#C4B5FD',
    400: '#A855F7',
    500: '#9333EA',
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#3F0F5C',
  },

  // Secondary Blue Palette
  blue: {
    50: '#EFF6FF',
    100: '#E0F2FE',
    200: '#BAE6FD',
    300: '#7DD3FC',
    400: '#38BDF8',
    500: '#0EA5E9',
    600: '#0284C7',
    700: '#0369A1',
    800: '#075985',
    900: '#0C3D5C',
  },

  // Gradient Accent
  accent: {
    from: '#2FB8FF',
    to: '#6C4DFF',
  },

  // Status Colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Neutral Palette
  neutral: {
    0: '#FFFFFF',
    50: '#F9FAFB',
    100: '#F3F4F6',
    150: '#EEEFF2',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Glass Colors
  glass: {
    bg: 'rgba(255, 255, 255, 0.82)',
    border: 'rgba(221, 235, 255, 0.85)',
    hover: 'rgba(255, 255, 255, 0.95)',
  },

  // Text Colors
  text: {
    primary: '#0F172A',
    secondary: '#64748B',
    tertiary: '#94A3B8',
    muted: '#CBD5E1',
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F7F8FC',
    tertiary: '#F0F4F8',
  },
};

export const TYPOGRAPHY = {
  // Font Family
  fonts: {
    primary: "'Assistant', sans-serif",
    mono: "'Courier New', monospace",
  },

  // Font Sizes & Weights Scale
  scales: {
    'display-xl': {
      size: '58px',
      weight: 900,
      lineHeight: '1.05',
      letterSpacing: '-0.02em',
    },
    'display-lg': {
      size: '48px',
      weight: 900,
      lineHeight: '1.1',
      letterSpacing: '-0.015em',
    },
    'heading-xl': {
      size: '36px',
      weight: 900,
      lineHeight: '1.15',
      letterSpacing: '-0.01em',
    },
    'heading-lg': {
      size: '28px',
      weight: 900,
      lineHeight: '1.2',
      letterSpacing: '0em',
    },
    'heading-md': {
      size: '24px',
      weight: 900,
      lineHeight: '1.25',
      letterSpacing: '0em',
    },
    'heading-sm': {
      size: '20px',
      weight: 900,
      lineHeight: '1.3',
      letterSpacing: '0em',
    },
    'heading-xs': {
      size: '18px',
      weight: 900,
      lineHeight: '1.35',
      letterSpacing: '0em',
    },
    'body-lg': {
      size: '18px',
      weight: 500,
      lineHeight: '1.75',
      letterSpacing: '0em',
    },
    'body-md': {
      size: '15px',
      weight: 500,
      lineHeight: '1.6',
      letterSpacing: '0em',
    },
    'body-sm': {
      size: '14px',
      weight: 500,
      lineHeight: '1.5',
      letterSpacing: '0em',
    },
    'caption': {
      size: '13px',
      weight: 600,
      lineHeight: '1.4',
      letterSpacing: '0.01em',
    },
    'label': {
      size: '12px',
      weight: 700,
      lineHeight: '1.4',
      letterSpacing: '0.02em',
    },
  },

  // Weights
  weights: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
};

export const SPACING = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
};

export const RADIUS = {
  none: '0',
  sm: '10px',
  md: '14px',
  lg: '18px',
  xl: '24px',
  '2xl': '32px',
  pill: '9999px',
  glass: '30px',
};

export const SHADOWS = {
  none: 'none',
  xs: '0 1px 2px rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px rgba(0, 0, 0, 0.15)',
  // Glass shadows
  glass: '0 28px 80px rgba(79, 124, 255, 0.11), 0 3px 12px rgba(15, 23, 42, 0.04)',
  'glass-hover': '0 30px 90px rgba(79, 124, 255, 0.12), 0 4px 24px rgba(79, 124, 255, 0.06)',
  'glass-card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 16px rgba(0, 0, 0, 0.04)',
  'glass-card-hover': '0 8px 32px rgba(124, 58, 237, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06)',
  // Glow effects
  'glow-purple': '0 0 40px rgba(124, 58, 237, 0.3), 0 0 80px rgba(124, 58, 237, 0.1)',
  'glow-blue': '0 0 40px rgba(47, 184, 255, 0.25), 0 0 80px rgba(47, 184, 255, 0.08)',
  'button-primary': '0 18px 42px rgba(108, 77, 255, 0.35)',
  'button-primary-hover': '0 6px 28px rgba(124, 58, 237, 0.4)',
};

export const TRANSITIONS = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
};

export const BREAKPOINTS = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const Z_INDEX = {
  hide: -1,
  auto: 'auto',
  base: 0,
  dropdown: 1000,
  sticky: 1100,
  fixed: 1200,
  modal: 1300,
  popover: 1400,
  tooltip: 1500,
};

export const GLASS_STYLES = {
  card: {
    background: 'rgba(255, 255, 255, 0.78)',
    backdropFilter: 'blur(28px)',
    WebkitBackdropFilter: 'blur(28px)',
    border: '1px solid rgba(221, 235, 255, 0.86)',
    borderRadius: '30px',
    boxShadow: '0 28px 80px rgba(79, 124, 255, 0.11), 0 3px 12px rgba(15, 23, 42, 0.04)',
  },
  panel: {
    background: 'rgba(255, 255, 255, 0.82)',
    backdropFilter: 'blur(26px)',
    WebkitBackdropFilter: 'blur(26px)',
    border: '1px solid rgba(221, 235, 255, 0.85)',
    boxShadow: '0 18px 55px rgba(79, 124, 255, 0.10)',
  },
  input: {
    background: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(221, 235, 255, 0.8)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
};

export const THEME = {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  RADIUS,
  SHADOWS,
  TRANSITIONS,
  BREAKPOINTS,
  Z_INDEX,
  GLASS_STYLES,
};

export default THEME;