/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'xs':      '0 1px 2px 0 rgba(0,0,0,0.04)',
        'soft':    '0 2px 8px 0 rgba(0,0,0,0.05), 0 1px 2px 0 rgba(0,0,0,0.03)',
        'card':    '0 4px 16px 0 rgba(0,0,0,0.07), 0 1px 3px 0 rgba(0,0,0,0.04)',
        'elevated':'0 8px 32px 0 rgba(0,0,0,0.10), 0 2px 8px 0 rgba(0,0,0,0.06)',
        'float':   '0 20px 60px 0 rgba(0,0,0,0.14), 0 4px 16px 0 rgba(0,0,0,0.08)',
        'glow':    '0 0 0 3px rgba(99,102,241,0.18)',
        'glow-lg': '0 0 24px 0 rgba(99,102,241,0.20)',
        'inner-sm':'inset 0 1px 2px 0 rgba(0,0,0,0.05)',
        'colored': '0 8px 24px -4px var(--shadow-color, rgba(99,102,241,0.30))',
      },
      borderRadius: {
        'sm':  '0.375rem',
        'md':  '0.5rem',
        'lg':  '0.625rem',
        'xl':  '0.875rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-mesh':   'radial-gradient(at 40% 20%, #818cf8 0px, transparent 50%), radial-gradient(at 80% 0%, #6366f1 0px, transparent 50%), radial-gradient(at 0% 50%, #a5b4fc 0px, transparent 50%)',
        'shimmer':         'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
      },
      animation: {
        'slide-in':    'slideIn 0.2s ease-out',
        'slide-up':    'slideUp 0.2s ease-out',
        'slide-down':  'slideDown 0.18s ease-out',
        'fade-in':     'fadeIn 0.2s ease-out',
        'scale-in':    'scaleIn 0.15s ease-out',
        'spin-slow':   'spin 3s linear infinite',
        'pulse-soft':  'pulseSoft 2s ease-in-out infinite',
        'shimmer':     'shimmer 1.8s ease-in-out infinite',
        'loading':     'loading 1.5s ease-in-out infinite',
        'bounce-sm':   'bounceSm 0.6s ease-out',
        'ping-once':   'ping 0.6s cubic-bezier(0,0,0.2,1) forwards',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateX(-10px)', opacity: '0' },
          to:   { transform: 'translateX(0)',     opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(10px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        slideDown: {
          from: { transform: 'translateY(-6px)', opacity: '0' },
          to:   { transform: 'translateY(0)',    opacity: '1' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        scaleIn: {
          from: { transform: 'scale(0.94)', opacity: '0' },
          to:   { transform: 'scale(1)',    opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.55' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        loading: {
          '0%':   { transform: 'translateX(-100%)' },
          '50%':  { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        bounceSm: {
          '0%':   { transform: 'scale(0.9)' },
          '50%':  { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [],
};
