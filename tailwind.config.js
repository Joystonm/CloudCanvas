/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Spotify design system
        'cc-bg':        '#121212',
        'cc-surface':   '#181818',
        'cc-elevated':  '#1f1f1f',
        'cc-card':      '#252525',
        'cc-border':    '#4d4d4d',
        'cc-border-lt': '#7c7c7c',
        'cc-accent':    '#1ed760',
        'cc-accent-dk': '#1db954',
        'cc-text':      '#ffffff',
        'cc-muted':     '#b3b3b3',
        'cc-error':     '#f3727f',
        'cc-warn':      '#ffa42b',
        'cc-info':      '#539df5',
      },
      fontFamily: {
        sans: ['SpotifyMixUI', 'CircularSp-Arab', 'Helvetica Neue', 'helvetica', 'arial', 'sans-serif'],
      },
      borderRadius: {
        'pill': '9999px',
        'pill-lg': '500px',
      },
      boxShadow: {
        'heavy': 'rgba(0,0,0,0.5) 0px 8px 24px',
        'medium': 'rgba(0,0,0,0.3) 0px 8px 8px',
        'inset-border': 'rgb(18,18,18) 0px 1px 0px, rgb(124,124,124) 0px 0px 0px 1px inset',
      },
    },
  },
  plugins: [],
}
