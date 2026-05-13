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
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'glow': '0 0 28px rgba(34,197,94,0.28)',
        'glow-blue': '0 0 28px rgba(14,165,233,0.28)',
        'glow-red': '0 0 20px rgba(239,68,68,0.25)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.08)',
        'card-hover': '0 22px 70px rgba(0,0,0,0.42), 0 0 34px rgba(34,197,94,0.10)',
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'scan': 'scan 2s linear infinite',
        'float-soft': 'float-soft 7s ease-in-out infinite',
        'shine': 'shine 1.8s ease-out',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.4)' },
          '70%': { boxShadow: '0 0 0 8px rgba(239, 68, 68, 0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(239, 68, 68, 0)' },
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
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2322c55e' fill-opacity='0.03' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};
