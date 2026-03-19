import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        page: '#F7F7F7',
        card: '#FFFFFF',
        accent: {
          DEFAULT: '#CF6769',
          hover: '#B85557',
          light: '#CF676910',
        },
        text: {
          primary: '#000000',
          secondary: '#666666',
          meta: '#999999',
        },
        shadow: '#323232',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      boxShadow: {
        card: '0 2px 12px rgba(50, 50, 50, 0.08)',
        'card-hover': '0 4px 20px rgba(50, 50, 50, 0.12)',
        section: '0 4px 20px rgba(50, 50, 50, 0.06)',
      },
    },
  },
  plugins: [],
};

export default config;
