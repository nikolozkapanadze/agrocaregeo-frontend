/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'rgba(255,255,255,0.10)',
        // Base backgrounds
        base: {
          DEFAULT: '#070b10',
          primary: '#070b10',
          secondary: '#0a1118',
          card: '#0d141c',
          elevated: '#121d27',
          soft: '#172433',
        },
        // Semantic backgrounds
        bg: {
          primary: '#070b10',
          card: '#0d141c',
          elevated: '#121d27',
          border: 'rgba(255,255,255,0.08)',
          'border-accent': 'rgba(34,197,94,0.3)',
        },
        // Text colors
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          muted: '#475569',
          dark: '#1e293b',
        },
        // Primary accent - Satellite Green
        accent: {
          DEFAULT: '#22c55e',
          hover: '#16a34a',
          glow: 'rgba(34,197,94,0.25)',
          dim: 'rgba(34,197,94,0.15)',
        },
        // Secondary accent - Sensor Blue
        sensor: {
          DEFAULT: '#0ea5e9',
          hover: '#0284c7',
          glow: 'rgba(14,165,233,0.25)',
          dim: 'rgba(14,165,233,0.15)',
        },
        // Status colors
        zone: {
          critical: '#ef4444',
          high: '#f59e0b',
          medium: '#eab308',
          ok: '#22c55e',
          info: '#0ea5e9',
        },
        // Alert colors
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#22c55e',
        info: '#0ea5e9',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
        // Enhanced typography scale
        'display-2xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-sm': ['1.875rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-xs': ['1.5rem', { lineHeight: '1.3', letterSpacing: '0', fontWeight: '600' }],
      },
      spacing: {
        // Consistent spacing scale (8px base)
        '4.5': '1.125rem', // 18px
        '13': '3.25rem',   // 52px
        '15': '3.75rem',   // 60px
        '18': '4.5rem',    // 72px
        '22': '5.5rem',    // 88px
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      backdropBlur: {
        'xs': '2px',
        '3xl': '64px',
      },
      boxShadow: {
        // Elevation system
        'elevation-1': '0 1px 2px rgba(0,0,0,0.24), 0 1px 3px rgba(0,0,0,0.12)',
        'elevation-2': '0 4px 8px rgba(0,0,0,0.28), 0 2px 4px rgba(0,0,0,0.16)',
        'elevation-3': '0 12px 24px rgba(0,0,0,0.32), 0 4px 8px rgba(0,0,0,0.20)',
        'elevation-4': '0 24px 48px rgba(0,0,0,0.40), 0 8px 16px rgba(0,0,0,0.24)',
        'elevation-5': '0 32px 64px rgba(0,0,0,0.48), 0 12px 24px rgba(0,0,0,0.28)',
        // Glow effects
        'glow': '0 0 28px rgba(34,197,94,0.28)',
        'glow-sm': '0 0 12px rgba(34,197,94,0.20)',
        'glow-lg': '0 0 48px rgba(34,197,94,0.35)',
        'glow-blue': '0 0 28px rgba(14,165,233,0.28)',
        'glow-blue-sm': '0 0 12px rgba(14,165,233,0.20)',
        'glow-red': '0 0 20px rgba(239,68,68,0.25)',
        'glow-yellow': '0 0 20px rgba(245,158,11,0.25)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.08)',
        'inner-glow-strong': 'inset 0 1px 0 rgba(255,255,255,0.15)',
        'card-hover': '0 22px 70px rgba(0,0,0,0.42), 0 0 34px rgba(34,197,94,0.10)',
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
        'float-soft': 'float-soft 7s ease-in-out infinite',
        'shine': 'shine 1.8s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.3s ease-out',
        'scale-in': 'scale-in 0.2s ease-out',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)' },
          '70%': { boxShadow: '0 0 0 8px rgba(239, 68, 68, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'drop-shadow(0 0 8px currentColor)' },
          '50%': { opacity: '0.5', filter: 'drop-shadow(0 0 16px currentColor)' },
        },
        'scan': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'float-soft': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'shine': {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)' },
          '100%': { transform: 'translateX(220%) skewX(-18deg)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2322c55e' fill-opacity='0.03' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")",
        // Card gradients
        'card-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.075), rgba(255,255,255,0.018))',
        'card-border-gradient': 'linear-gradient(135deg, rgba(34,197,94,0.42), rgba(14,165,233,0.20), transparent 55%)',
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
