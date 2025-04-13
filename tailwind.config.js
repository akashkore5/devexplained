/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
      fontFamily: {
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      typography: {
        DEFAULT: {
          css: {
            strong: {
              fontWeight: '600', // Override 700 to test
            },
            'h1, h2, h3, h4, h5, h6': {
              fontWeight: '600', // Override 700 to test
            },
          },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
