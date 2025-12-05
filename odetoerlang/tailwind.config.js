/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Colors - Vivid on Black
      colors: {
        // Background layers
        bg: {
          base: '#000000',
          surface: '#0a0a0a',
          elevated: '#111111',
          hover: '#1a1a1a',
        },
        // Text
        text: {
          primary: '#ffffff',
          secondary: '#888888',
          muted: '#555555',
          inverse: '#000000',
        },
        // Borders
        border: {
          subtle: '#333333',
          muted: '#222222',
          active: '#00fff7',
        },
        // Vivid accent colors
        cyan: {
          DEFAULT: '#00fff7',
          dim: '#00cccc',
        },
        magenta: {
          DEFAULT: '#ff00ff',
          dim: '#cc00cc',
        },
        green: {
          DEFAULT: '#00ff00',
          dim: '#00cc00',
        },
        amber: {
          DEFAULT: '#ffaa00',
          dim: '#cc8800',
        },
        red: {
          DEFAULT: '#ff3333',
          dim: '#cc2929',
        },
        blue: {
          DEFAULT: '#0088ff',
          dim: '#006acc',
        },
      },

      // Typography - Monospace everything
      fontFamily: {
        mono: ['"JetBrains Mono"', '"IBM Plex Mono"', '"Fira Code"', '"SF Mono"', 'Consolas', 'monospace'],
        sans: ['"JetBrains Mono"', '"IBM Plex Mono"', '"Fira Code"', 'monospace'],
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

      // Border radius - sharper than default
      borderRadius: {
        none: '0px',
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        full: '9999px',
        apple: '12px', // Legacy support
      },

      // Shadows - darker + glow variants
      boxShadow: {
        none: 'none',
        sm: '0 1px 2px rgba(0, 0, 0, 0.5)',
        DEFAULT: '0 4px 12px rgba(0, 0, 0, 0.6)',
        md: '0 4px 12px rgba(0, 0, 0, 0.6)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.7)',
        xl: '0 16px 48px rgba(0, 0, 0, 0.8)',
        // Glow effects
        'glow-cyan': '0 0 20px rgba(0, 255, 247, 0.4)',
        'glow-magenta': '0 0 20px rgba(255, 0, 255, 0.4)',
        'glow-green': '0 0 20px rgba(0, 255, 0, 0.4)',
        'glow-amber': '0 0 20px rgba(255, 170, 0, 0.4)',
        'glow-red': '0 0 20px rgba(255, 51, 51, 0.4)',
        'glow-blue': '0 0 20px rgba(0, 136, 255, 0.4)',
        // Legacy support
        apple: '0 4px 12px rgba(0, 0, 0, 0.6)',
        'apple-lg': '0 8px 24px rgba(0, 0, 0, 0.7)',
      },

      // Transitions
      transitionDuration: {
        fast: '100ms',
        DEFAULT: '200ms',
        normal: '200ms',
        slow: '300ms',
      },

      transitionTimingFunction: {
        DEFAULT: 'ease-out',
        smooth: 'ease-out',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        apple: 'cubic-bezier(0.4, 0, 0.2, 1)', // Legacy support
      },

      // Animations
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'fade-out': 'fadeOut 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'slide-down': 'slideDown 200ms ease-out',
        shimmer: 'shimmer 2s linear infinite',
        pulse: 'pulse 2s ease-in-out infinite',
        glow: 'glow 2s ease-in-out infinite alternate',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px currentColor' },
          '100%': { boxShadow: '0 0 20px currentColor' },
        },
      },

      // Grid background pattern
      backgroundImage: {
        'grid-pattern': `
          linear-gradient(rgba(51, 51, 51, 0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(51, 51, 51, 0.3) 1px, transparent 1px)
        `,
        'grid-pattern-dense': `
          linear-gradient(rgba(51, 51, 51, 0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(51, 51, 51, 0.4) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'grid': '20px 20px',
        'grid-dense': '10px 10px',
      },
    },
  },
  plugins: [],
}
