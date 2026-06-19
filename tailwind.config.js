/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#FDF6EC',
        ocean: '#0EA5C9',
        coral: '#F97316',
        seafoam: '#6EE7B7',
        sky: '#E0F2FE',
        dusk: '#0C4A6E',
        mist: '#F0F9FF',
        shell: '#FFFFFF',
        status: {
          'not-started': '#94A3B8',
          'in-progress': '#F97316',
          'on-hold': '#EF4444',
          completed: '#6EE7B7',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
