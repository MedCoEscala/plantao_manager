/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './app/(tabs)/**/*.{js,jsx,ts,tsx}',
    './app/(auth)/**/*.{js,jsx,ts,tsx}',
    './app/(root)/**/*.{js,jsx,ts,tsx}',
    './app/components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#18cb96',
        secondary: '#64748b',
        background: '#f8fafc',
        'background-100': '#f1f5f9',
        'background-200': '#e2e8f0',
        'text-dark': '#1e293b',
        'text-light': '#64748b',
        error: '#ef4444',
        success: '#10b981',
        warning: '#f59e0b',
      },
      fontFamily: {
        jakarta: ['Jakarta-Regular'],
        'jakarta-bold': ['Jakarta-Bold'],
        'jakarta-medium': ['Jakarta-Medium'],
        'jakarta-semibold': ['Jakarta-SemiBold'],
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
};
