/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#020617',
        card: '#0F172A',
        primary: '#38BDF8',
        success: '#22C55E',
        danger: '#EF4444',
        text: '#E5E7EB',
        muted: '#94A3B8',
      },
    },
  },
  plugins: [],
}


