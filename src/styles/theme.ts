// Modern Design System for AHRQ Dashboard
// Balances sophistication with government/research professionalism

export const theme = {
  // Modern color palette inspired by healthcare and data visualization
  colors: {
    // Primary - Deep, trustworthy blue
    primary: {
      50: '#EBF5FF',
      100: '#E1EFFE',
      200: '#C3DDFD',
      300: '#A4CAFE',
      400: '#76A9FA',
      500: '#3F83F8',
      600: '#1C64F2',
      700: '#1A56DB',
      800: '#1E429F',
      900: '#233876',
    },
    
    // Secondary - Modern teal for data viz
    secondary: {
      50: '#F0FDFA',
      100: '#CCFBF1',
      200: '#99F6E4',
      300: '#5EEAD4',
      400: '#2DD4BF',
      500: '#14B8A6',
      600: '#0D9488',
      700: '#0F766E',
      800: '#115E59',
      900: '#134E4A',
    },
    
    // Accent colors for data visualization
    accent: {
      purple: '#8B5CF6',
      pink: '#EC4899',
      amber: '#F59E0B',
      emerald: '#10B981',
      rose: '#F43F5E',
      indigo: '#6366F1',
    },
    
    // Neutral grays with slight blue tint
    gray: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    
    // Semantic colors
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  
  // Modern spacing system
  spacing: {
    xs: '0.5rem',
    sm: '0.75rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },
  
  // Typography system
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      mono: 'JetBrains Mono, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  
  // Modern shadows with colored tints
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    
    // Colored shadows for cards
    primary: '0 4px 14px 0 rgba(63, 131, 248, 0.15)',
    secondary: '0 4px 14px 0 rgba(20, 184, 166, 0.15)',
    success: '0 4px 14px 0 rgba(16, 185, 129, 0.15)',
  },
  
  // Border radius system
  borderRadius: {
    none: '0',
    sm: '0.25rem',
    base: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    full: '9999px',
  },
  
  // Animation timings
  transitions: {
    fast: '150ms ease-in-out',
    base: '250ms ease-in-out',
    slow: '350ms ease-in-out',
    
    // Easing functions
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
  },
  
  // Z-index system
  zIndex: {
    dropdown: 1000,
    modal: 1050,
    popover: 1100,
    tooltip: 1150,
  },
};

// Glassmorphism utilities
export const glassmorphism = {
  light: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
  },
  dark: {
    background: 'rgba(17, 25, 40, 0.75)',
    backdropFilter: 'blur(16px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.125)',
  },
  colored: (color: string, opacity: number = 0.1) => ({
    background: `${color}${Math.round(opacity * 255).toString(16)}`,
    backdropFilter: 'blur(10px)',
    border: `1px solid ${color}20`,
  }),
};

// Modern gradient presets
export const gradients = {
  primary: 'linear-gradient(135deg, #3F83F8 0%, #1C64F2 100%)',
  secondary: 'linear-gradient(135deg, #14B8A6 0%, #0D9488 100%)',
  sunset: 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
  ocean: 'linear-gradient(135deg, #3B82F6 0%, #14B8A6 100%)',
  purple: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
  dark: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
  
  // Subtle gradients for backgrounds
  subtle: {
    blue: 'linear-gradient(180deg, #F8FAFC 0%, #EBF5FF 100%)',
    gray: 'linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)',
  },
};

// Chart color schemes
export const chartColors = {
  categorical: [
    '#3F83F8', // Primary blue
    '#14B8A6', // Teal
    '#8B5CF6', // Purple
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#EC4899', // Pink
    '#6366F1', // Indigo
    '#F43F5E', // Rose
  ],
  
  sequential: {
    blue: ['#EBF5FF', '#C3DDFD', '#76A9FA', '#3F83F8', '#1A56DB', '#233876'],
    green: ['#F0FDF4', '#BBF7D0', '#4ADE80', '#10B981', '#047857', '#064E3B'],
    purple: ['#FAF5FF', '#E9D5FF', '#C084FC', '#8B5CF6', '#6B21A8', '#4C1D95'],
  },
  
  diverging: {
    redBlue: ['#EF4444', '#FCA5A5', '#FEE2E2', '#DBEAFE', '#93BBFD', '#3B82F6'],
  },
};