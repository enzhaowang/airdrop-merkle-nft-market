/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'wagmi-bg': '#0e1116',
        'wagmi-card': '#1a1d24',
        'wagmi-border': '#2d323b',
        'wagmi-primary': '#47a1ff',
        'wagmi-primary-hover': '#2d8dfe',
        'wagmi-text': '#e2e8f0',
        'wagmi-text-muted': '#94a3b8',
      }
    },
  },
  plugins: [],
}
