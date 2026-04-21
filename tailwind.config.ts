import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#7B2FBE',
          'purple-dark': '#5A1F96',
          'purple-light': '#E6DBF7',
          black: '#1A1A1A',
          cream: '#EEF2F7',
          gray: '#C7CFDC',
          'gray-text': '#556070',
          orange: '#E8601A',
          red: '#CC3B27',
          green: '#2D8A4E',
          yellow: '#F5A623',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
