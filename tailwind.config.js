/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'wood-light': '#d7ccc8',
        'wood-medium': '#a1887f',
        'wood-dark': '#795548',
        'coffee-light': '#d7ccc8',
        'coffee-medium': '#a1887f',
        'coffee-dark': '#5d4037',
        'cream': '#f5f5f5',
        'latte': '#e0e0e0',
        'consultation': {
          light: '#80F2FF',
          DEFAULT: '#00E5FF',
          dark: '#00B8D4',
        },
      },
      fontFamily: {
        sans: ['Noto Sans JP', 'Poppins', 'sans-serif'],
      },
      backgroundImage: {
        'wood-pattern': "url('/images/wood-pattern.jpg')",
        'cafe-bg': "url('/images/cafe-background.jpg')",
      },
      boxShadow: {
        'card': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'inner-light': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.06)',
      },
    },
  },
  plugins: [],
}
