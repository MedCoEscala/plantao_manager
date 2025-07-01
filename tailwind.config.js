/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb',
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        secondary: {
          DEFAULT: '#64748b',
          100: '#f1f5f9',
          700: '#334155',
        },
        background: {
          DEFAULT: '#f8fafc',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
        },
        'text-dark': '#0f172a',
        'text-light': '#64748b',
        success: {
          DEFAULT: '#10b981',
          50: '#ecfdf5',
          100: '#d1fae5',
          700: '#047857',
        },
        error: {
          DEFAULT: '#ef4444',
          50: '#fef2f2',
          100: '#fee2e2',
          700: '#b91c1c',
        },
        warning: {
          DEFAULT: '#f59e0b',
          50: '#fffbeb',
          100: '#fef3c7',
          700: '#b45309',
        },
      },
      fontFamily: {
        jakarta: ['Jakarta-Regular', 'System'],
        'jakarta-medium': ['Jakarta-Medium', 'System'],
        'jakarta-semibold': ['Jakarta-SemiBold', 'System'],
        'jakarta-bold': ['Jakarta-Bold', 'System'],
      },
    },
  },
  plugins: [],
};
