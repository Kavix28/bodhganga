/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 20px 60px -25px rgba(15, 23, 42, 0.25)',
      },
      gradientColorStops: {
        'mint-start': '#d3ffe6',
        'mint-end': '#f5fff8',
      },
    },
  },
  plugins: [],
}

