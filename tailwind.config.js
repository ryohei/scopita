/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'mahjong-green': '#2d5016',
        'mahjong-green-light': '#3a6b1e',
        'mahjong-green-dark': '#1e3a0f',
        'mahjong-red': '#d32f2f',
        'mahjong-table': '#1b4d3e',
        'mahjong-table-light': '#2a6b54',
        'cream': '#f5f2eb',
        'cream-dark': '#ebe6da',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'soft': '0 4px 15px rgba(0, 0, 0, 0.1)',
        'button': '0 4px 8px rgba(0, 0, 0, 0.15)',
        'card': '0 8px 25px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
}
