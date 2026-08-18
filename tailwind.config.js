/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        dsh: {
          50: '#EDF3FE',
          100: '#E4EDFD',
          200: '#D3E2FF',
          300: '#B7C8FE',
          400: '#679EFE',
          450: '#5686FE',
          500: '#4176E6',
          600: '#4868B2',
          800: '#34415B',
          900: '#283142',
        },
      },
    },
  },
  plugins: [],
};
