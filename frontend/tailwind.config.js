/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        apple: {
          blue:   '#007AFF',
          green:  '#34C759',
          red:    '#FF3B30',
          orange: '#FF9500',
          gray:   '#8E8E93',
          bg:     '#F2F2F7',
          card:   '#FFFFFF',
        },
      },
      borderRadius: {
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        'apple': '0 2px 12px rgba(0,0,0,0.08)',
        'apple-lg': '0 8px 32px rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
}