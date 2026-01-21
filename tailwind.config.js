/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Arial Narrow"', 'Arial', 'sans-serif']
      },
      colors: {
        tavern: {
          900: '#0d0a07',
          800: '#17110c',
          700: '#241911'
        },
        ember: {
          400: '#f4a460',
          500: '#e28743',
          600: '#c56a2d'
        }
      },
      boxShadow: {
        glow: '0 0 20px rgba(255, 172, 97, 0.35)'
      }
    }
  },
  plugins: []
};
