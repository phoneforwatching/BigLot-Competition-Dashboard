import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{html,js,svelte,ts}"],
  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fffcf0',
          100: '#fef7e1',
          200: '#fde9b8',
          300: '#fbd485',
          400: '#f8b646',
          500: '#f39c12', // Main Gold
          600: '#d68910',
          700: '#b7750d',
          800: '#9a630b',
          900: '#7e5109',
        },
        dark: {
          bg: '#000000',
          surface: '#0a0a0a',
          'surface-light': '#121212',
          border: '#1a1a1a',
          'border-gold': '#3d2e00',
        }
      }
    }
  },

  plugins: []
} as Config;
