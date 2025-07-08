// Premium Research Intelligence Design System
// "Research Excellence Visualized" - A sophisticated, $100k-quality theme

export const premiumTheme = {
  // Core Design Tokens
  name: 'Research Excellence Framework',
  
  // Simplified 3-4 Color System for Consistency
  colors: {
    // Primary Brand Color
    primary: {
      base: '#1e3a8a', // Deep blue - main brand color
      light: '#3b82f6',
      lighter: '#60a5fa',
      lightest: '#dbeafe',
      dark: '#1e40af',
      darker: '#1e3a8a',
      contrast: '#ffffff',
    },
    
    // Accent Color for Highlights & Interactions
    accent: {
      base: '#0f766e', // Teal - interactive elements, success states
      light: '#14b8a6',
      lighter: '#2dd4bf',
      lightest: '#ccfbf1',
      dark: '#115e59',
      darker: '#134e4a',
      contrast: '#ffffff',
    },
    
    // Warning Color (Sparingly Used)
    warning: {
      base: '#d97706', // Amber - only for critical alerts
      light: '#f59e0b',
      lighter: '#fbbf24',
      lightest: '#fef3c7',
      dark: '#b45309',
      darker: '#92400e',
      contrast: '#ffffff',
    },
    
    // Sophisticated Neutrals
    neutral: {
      charcoal: '#0f172a', // Primary text, maximum readability
      slate: '#475569', // Secondary elements
      supporting: '#64748b', // Secondary text, metadata
      whisper: '#cbd5e1', // Tertiary text, subtle labels
      boundary: '#e2e8f0', // Borders, dividers, subtle definition
      surface: '#f8fafc', // Page background, subtle separation
      pure: '#ffffff', // Cards, primary surfaces
    },
    
    // Glass & Overlay Colors
    glass: {
      white: 'rgba(255, 255, 255, 0.1)',
      whiteLight: 'rgba(255, 255, 255, 0.05)',
      whiteMedium: 'rgba(255, 255, 255, 0.15)',
      dark: 'rgba(15, 23, 42, 0.1)',
      darkMedium: 'rgba(15, 23, 42, 0.3)',
    },
  },
  
  // Premium Typography System
  typography: {
    // Font Families
    fonts: {
      primary: "'Inter var', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      display: "'Plus Jakarta Sans', 'Inter var', sans-serif",
      mono: "'JetBrains Mono', 'SF Mono', 'Consolas', monospace",
    },
    
    // Sophisticated Scale with Perfect Ratios
    scale: {
      // Display Sizes
      displayLarge: {
        fontSize: '48px',
        lineHeight: '56px',
        fontWeight: 800,
        letterSpacing: '-0.035em',
      },
      displayMedium: {
        fontSize: '36px',
        lineHeight: '44px',
        fontWeight: 700,
        letterSpacing: '-0.03em',
      },
      displaySmall: {
        fontSize: '28px',
        lineHeight: '36px',
        fontWeight: 700,
        letterSpacing: '-0.025em',
      },
      
      // Heading Sizes
      h1: {
        fontSize: '28px',
        lineHeight: '36px',
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontSize: '20px',
        lineHeight: '28px',
        fontWeight: 600,
        letterSpacing: '-0.01em',
      },
      h3: {
        fontSize: '16px',
        lineHeight: '24px',
        fontWeight: 600,
        letterSpacing: '0',
      },
      
      // Body Text
      bodyLarge: {
        fontSize: '16px',
        lineHeight: '24px',
        fontWeight: 400,
        letterSpacing: '0',
      },
      body: {
        fontSize: '14px',
        lineHeight: '21px',
        fontWeight: 400,
        letterSpacing: '0',
      },
      bodySmall: {
        fontSize: '12px',
        lineHeight: '18px',
        fontWeight: 500,
        letterSpacing: '0.01em',
      },
      
      // Supporting Text
      caption: {
        fontSize: '11px',
        lineHeight: '16px',
        fontWeight: 400,
        letterSpacing: '0.02em',
      },
      overline: {
        fontSize: '10px',
        lineHeight: '16px',
        fontWeight: 600,
        letterSpacing: '0.1em',
        textTransform: 'uppercase' as const,
      },
    },
  },
  
  // Sophisticated Spacing System
  spacing: {
    micro: '4px',    // 0.25rem
    tiny: '8px',     // 0.5rem
    small: '12px',   // 0.75rem
    base: '16px',    // 1rem
    medium: '24px',  // 1.5rem
    large: '32px',   // 2rem
    xlarge: '48px',  // 3rem
    huge: '64px',    // 4rem
    giant: '96px',   // 6rem
  },
  
  // Premium Shadow System
  shadows: {
    // Elevation Shadows
    elevation: {
      none: 'none',
      subtle: '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
      small: '0 2px 4px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.08)',
      medium: '0 4px 8px rgba(0, 0, 0, 0.08), 0 4px 16px rgba(0, 0, 0, 0.1)',
      large: '0 8px 16px rgba(0, 0, 0, 0.1), 0 8px 32px rgba(0, 0, 0, 0.12)',
      xlarge: '0 16px 32px rgba(0, 0, 0, 0.12), 0 16px 64px rgba(0, 0, 0, 0.14)',
    },
    
    // Interactive State Shadows
    interactive: {
      rest: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
      hover: '0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22)',
      active: '0 3px 6px rgba(0, 0, 0, 0.16), 0 3px 6px rgba(0, 0, 0, 0.23)',
    },
    
    // Colored Shadows for Premium Effects
    colored: {
      primary: '0 4px 16px rgba(30, 58, 138, 0.15), 0 2px 8px rgba(30, 58, 138, 0.1)',
      accent: '0 4px 16px rgba(15, 118, 110, 0.15), 0 2px 8px rgba(15, 118, 110, 0.1)',
      warning: '0 4px 16px rgba(217, 119, 6, 0.15), 0 2px 8px rgba(217, 119, 6, 0.1)',
    },
    
    // Glow Effects
    glow: {
      primary: '0 0 24px rgba(59, 130, 246, 0.5)',
      accent: '0 0 24px rgba(20, 184, 166, 0.5)',
      warning: '0 0 24px rgba(245, 158, 11, 0.5)',
    },
  },
  
  // Border Radius System
  borderRadius: {
    none: '0',
    micro: '2px',
    small: '4px',
    medium: '8px',
    large: '12px',
    xlarge: '16px',
    xxlarge: '24px',
    full: '9999px',
  },
  
  // Animation & Transition System
  animation: {
    // Timing Functions
    timing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
    
    // Duration
    duration: {
      instant: '100ms',
      fast: '200ms',
      normal: '300ms',
      slow: '400ms',
      slower: '600ms',
      slowest: '800ms',
    },
    
    // Predefined Transitions
    transition: {
      all: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      colors: 'background-color 200ms, border-color 200ms, color 200ms, fill 200ms, stroke 200ms',
      opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      shadow: 'box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  // Layout System
  layout: {
    maxWidth: {
      container: '1440px',
      content: '1200px',
      article: '720px',
      narrow: '480px',
    },
    
    grid: {
      columns: 12,
      gap: '24px',
    },
  },
  
  // Z-Index System
  zIndex: {
    base: 0,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
    notification: 1080,
    debug: 9999,
  },
  
  // Blur Values for Glass Effects
  blur: {
    none: '0',
    small: '8px',
    medium: '16px',
    large: '24px',
    xlarge: '40px',
  },
};

// CSS Variables for Runtime Theme
export const generateCSSVariables = () => {
  const vars: Record<string, string> = {};
  
  // Colors
  Object.entries(premiumTheme.colors).forEach(([category, values]) => {
    if (typeof values === 'object') {
      Object.entries(values).forEach(([key, value]) => {
        if (typeof value === 'string') {
          vars[`--color-${category}-${key}`] = value;
        }
      });
    }
  });
  
  // Spacing
  Object.entries(premiumTheme.spacing).forEach(([key, value]) => {
    vars[`--spacing-${key}`] = value;
  });
  
  // Typography
  vars['--font-primary'] = premiumTheme.typography.fonts.primary;
  vars['--font-display'] = premiumTheme.typography.fonts.display;
  vars['--font-mono'] = premiumTheme.typography.fonts.mono;
  
  // Shadows
  Object.entries(premiumTheme.shadows.elevation).forEach(([key, value]) => {
    vars[`--shadow-${key}`] = value;
  });
  
  // Border Radius
  Object.entries(premiumTheme.borderRadius).forEach(([key, value]) => {
    vars[`--radius-${key}`] = value;
  });
  
  // Animation
  Object.entries(premiumTheme.animation.duration).forEach(([key, value]) => {
    vars[`--duration-${key}`] = value;
  });
  
  return vars;
};

// Utility function to apply theme
export const applyTheme = () => {
  const root = document.documentElement;
  const cssVars = generateCSSVariables();
  
  Object.entries(cssVars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

export default premiumTheme;