/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
    theme: {
      extend: {
        colors: {
          // Modern Blue palette
          primary: {
            50: '#eff6ff',
            100: '#dbeafe',
            200: '#bfdbfe',
            300: '#93c5fd',
            400: '#60a5fa',
            500: '#3b82f6',
            600: '#2563eb',
            700: '#1d4ed8',
            800: '#1e40af',
            900: '#1e3a8a',
          },
          // Dark mode colors
          dark: {
            bg: '#0f172a',
            surface: '#1e293b',
            card: '#334155',
            border: '#475569',
            text: '#e2e8f0',
            muted: '#94a3b8',
          },
          // Light mode colors
          light: {
            bg: '#f8fafc',
            surface: '#ffffff',
            card: '#ffffff',
            border: '#e2e8f0',
            text: '#1e293b',
            muted: '#64748b',
          },
          background: {
            light: '#ffffff',
            dark: '#18181b',
          },
          text: {
            light: '#222',
            dark: '#e5e7eb',
          },
        },
        backgroundImage: {
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
          'gradient-modern': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          'gradient-blue': 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
        },
        boxShadow: {
          'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
          'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
          'inner-glow': 'inset 0 0 20px rgba(59, 130, 246, 0.1)',
        },
        animation: {
          'gradient': 'gradient 15s ease infinite',
          'float': 'float 6s ease-in-out infinite',
          'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        keyframes: {
          gradient: {
            '0%, 100%': {
              'background-size': '200% 200%',
              'background-position': 'left center'
            },
            '50%': {
              'background-size': '200% 200%',
              'background-position': 'right center'
            }
          },
          float: {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-20px)' },
          }
        },
        fontFamily: {
          'sans': ['Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
        },
      },
    },
    plugins: [],
    darkMode: 'class',
  }