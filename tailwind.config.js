/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/renderer/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-bg-dark': '#151a21',
        'brand-bg': '#1f242b',
        'brand-surface': '#2c3441',
        'brand-border': '#3b4656',
        'brand-text': '#e9eef2',
        'brand-text-secondary': '#cdd5de',
        'brand-primary': '#0a8bd0',
        'brand-primary-hover': '#0b77ba',
        'brand-success': '#2ecc71',
        'brand-warning': '#f39c12',
        'brand-danger': '#e74c3c',
      },
    },
  },
  plugins: [],
};
