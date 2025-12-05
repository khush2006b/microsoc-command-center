/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          'neon-red': '#FF4D4D',
          'neon-cyan': '#00FFFF',
          'primary-dark': '#0A0E18',
          'secondary-dark': '#141A28',
          'glass-bg': 'rgba(20, 26, 40, 0.6)',
        },
        fontFamily: {
          'sans': ['Orbitron', 'sans-serif'],
          'mono': ['Space Mono', 'monospace'],
        },
        backgroundImage: {
          // Conceptual background. Assumes 'cyber-grid.svg' is a subtle dark pattern.
          'cyber-grid': 'url("./src/assets/cyber-grid.svg")',
        },
        boxShadow: {
          'neon-red': '0 0 15px #FF4D4D',
          'neon-cyan': '0 0 15px #00FFFF',
          'glass-glow': '0 4px 30px rgba(0, 0, 0, 0.1)',
        }
      },
    },
    plugins: [],
  }