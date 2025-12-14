/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5A8C27',
          light: '#B8E6A0',
          dark: '#4A7320',
        },
        background: '#F5F5F5',
        danger: '#E31E24',
        warning: '#F39C12',
        link: '#0066CC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
