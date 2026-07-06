/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1e3a5f', light: '#2d5a9e', dark: '#152b47' }
      }
    }
  },
  plugins: []
}
