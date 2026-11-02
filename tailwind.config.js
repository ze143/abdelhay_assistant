/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef3c7',
          100: '#fde68a',
          200: '#fcd34d',
          500: '#f59e0b',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
        },
      },
      fontFamily: {
        tajawal: ['Tajawal', 'sans-serif'],
      },
    },
  },
  plugins: [],
}