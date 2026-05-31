import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Carbon Design System colors
        background: "var(--background)",
        foreground: "var(--foreground)",
        
        // Background variations
        'background-secondary': 'var(--background-secondary)',
        'background-tertiary': 'var(--background-tertiary)',
        'background-hover': 'var(--background-hover)',
        
        // Border colors
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        
        // Interactive colors
        'interactive-primary': 'var(--interactive-primary)',
        'interactive-hover': 'var(--interactive-hover)',
        
        // Text colors
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-disabled': 'var(--text-disabled)',
        
        // Security severity colors
        'security-critical': 'var(--security-critical)',
        'security-high': 'var(--security-high)',
        'security-medium': 'var(--security-medium)',
        'security-low': 'var(--security-low)',
        'security-info': 'var(--security-info)',
        
        // Agent status colors
        'agent-running': 'var(--agent-running)',
        'agent-complete': 'var(--agent-complete)',
        'agent-pending': 'var(--agent-pending)',
        'agent-error': 'var(--agent-error)',
        'agent-warning': 'var(--agent-warning)',
        
        // Stage colors
        'stage-active': 'var(--stage-active)',
        'stage-complete': 'var(--stage-complete)',
        'stage-pending': 'var(--stage-pending)',
        'stage-error': 'var(--stage-error)',
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        serif: ['IBM Plex Serif', 'Georgia', 'Times New Roman', 'serif'],
      },
      fontSize: {
        // Carbon type scale
        'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
        'sm': ['0.875rem', { lineHeight: '1.125rem' }], // 14px
        'base': ['1rem', { lineHeight: '1.5rem' }],     // 16px
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],      // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],   // 36px
        '5xl': ['3rem', { lineHeight: '3rem' }],        // 48px
      },
      spacing: {
        // Carbon 8px grid system (spacing tokens)
        '0': '0',
        '0.5': '0.125rem',  // 2px
        '1': '0.25rem',     // 4px
        '2': '0.5rem',      // 8px
        '3': '0.75rem',     // 12px
        '4': '1rem',        // 16px
        '5': '1.25rem',     // 20px
        '6': '1.5rem',      // 24px
        '7': '1.75rem',     // 28px
        '8': '2rem',        // 32px
        '9': '2.5rem',      // 40px
        '10': '3rem',       // 48px
        '11': '4rem',       // 64px
        '12': '5rem',       // 80px
        '13': '6rem',       // 96px
      },
      boxShadow: {
        'sm': 'var(--shadow-sm)',
        'md': 'var(--shadow-md)',
        'lg': 'var(--shadow-lg)',
        'xl': 'var(--shadow-xl)',
        'none': 'none',
      },
      borderRadius: {
        'none': '0',
        'sm': '2px',
        'DEFAULT': '4px',
        'md': '4px',
        'lg': '8px',
        'xl': '12px',
        'full': '9999px',
      },
      transitionDuration: {
        'fast': '110ms',
        'moderate': '240ms',
        'slow': '400ms',
      },
      transitionTimingFunction: {
        'standard': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'entrance': 'cubic-bezier(0, 0, 0.2, 1)',
        'exit': 'cubic-bezier(0.4, 0, 1, 1)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;

// Made with Bob
