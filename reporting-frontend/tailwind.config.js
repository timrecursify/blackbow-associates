/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blackbow: {
          DEFAULT: '#1a1a1a',
          light: '#333333',
        }
      }
    },
  },
  plugins: [],
}
