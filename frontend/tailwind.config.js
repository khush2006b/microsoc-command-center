/** @type {import('tailwindcss').Config} */
export default {
    content: [
      "./index.html",
      "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          // Ranger Colors
          'ranger-red': '#D40000',
          'ranger-neon-red': '#FF1744',
          'ranger-orange': '#FF6F00',
          'ranger-blue': '#2962FF',
          'ranger-black': '#0A0A0A',
          'ranger-steel': '#1C1C1C',
          'ranger-panel': '#151515',
          'ranger-grid': '#2D2D2D',
          'ranger-white': '#F0F0F0',
          
          // Legacy
          'neon-red': '#FF4D4D',
          'neon-cyan': '#00FFFF',
          'primary-dark': '#0A0E18',
          'secondary-dark': '#141A28',
          'glass-bg': 'rgba(20, 26, 40, 0.6)',
        },
        fontFamily: {
          'header': ['Orbitron', 'Space Mono', 'monospace'],
          'body': ['Exo 2', 'sans-serif'],
          'sans': ['Orbitron', 'sans-serif'],
          'mono': ['Roboto Mono', 'Space Mono', 'monospace'],
        },
        backgroundImage: {
          'cyber-grid': 'url("./src/assets/cyber-grid.svg")',
          'ranger-red-pulse': 'linear-gradient(135deg, #D40000 0%, #FF1744 50%, #D40000 100%)',
          'ranger-orange-pulse': 'linear-gradient(135deg, #FF6F00 0%, #FFA726 50%, #FF6F00 100%)',
          'ranger-blue-pulse': 'linear-gradient(135deg, #2962FF 0%, #5E35B1 50%, #2962FF 100%)',
          'ranger-dark-panel': 'linear-gradient(135deg, rgba(20, 20, 20, 0.9) 0%, rgba(28, 28, 28, 0.95) 100%)',
          'ranger-hover-glow': 'linear-gradient(135deg, rgba(212, 0, 0, 0.15) 0%, rgba(255, 23, 68, 0.05) 100%)',
        },
        boxShadow: {
          // Legacy
          'neon-red': '0 0 15px #FF4D4D',
          'neon-cyan': '0 0 15px #00FFFF',
          'glass-glow': '0 4px 30px rgba(0, 0, 0, 0.1)',
          
          // Ranger Glows
          'glow-red': '0 0 20px rgba(212, 0, 0, 0.6), 0 0 40px rgba(255, 23, 68, 0.3)',
          'glow-red-intense': '0 0 30px rgba(255, 23, 68, 0.8), 0 0 60px rgba(212, 0, 0, 0.5)',
          'glow-blue': '0 0 20px rgba(41, 98, 255, 0.5), 0 0 40px rgba(41, 98, 255, 0.2)',
          'glow-orange': '0 0 20px rgba(255, 111, 0, 0.5), 0 0 40px rgba(255, 111, 0, 0.2)',
          'panel': '0 8px 32px rgba(0, 0, 0, 0.6)',
          'panel-glow-red': 'inset 0 0 20px rgba(212, 0, 0, 0.1), 0 0 20px rgba(212, 0, 0, 0.3)',
          'panel-glow-blue': 'inset 0 0 20px rgba(41, 98, 255, 0.1), 0 0 20px rgba(41, 98, 255, 0.2)',
        },
        animation: {
          'slide-in-left': 'slide-in-left 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          'slide-in-right': 'slide-in-right 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          'slide-in-top': 'slide-in-top 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          'fade-in': 'fade-in 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          'hologram': 'hologram-appear 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
          'pulse-critical': 'pulse-critical 1.5s ease-in-out infinite',
          'charge-up': 'charge-up 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          'shake': 'shake 0.4s ease-in-out',
          'screen-flash': 'screen-flash 0.3s ease-out',
        },
        keyframes: {
          'slide-in-left': {
            'from': { opacity: '0', transform: 'translateX(-20px)' },
            'to': { opacity: '1', transform: 'translateX(0)' },
          },
          'slide-in-right': {
            'from': { opacity: '0', transform: 'translateX(20px)' },
            'to': { opacity: '1', transform: 'translateX(0)' },
          },
          'slide-in-top': {
            'from': { opacity: '0', transform: 'translateY(-20px)' },
            'to': { opacity: '1', transform: 'translateY(0)' },
          },
          'fade-in': {
            'from': { opacity: '0' },
            'to': { opacity: '1' },
          },
          'hologram-appear': {
            '0%': { opacity: '0', transform: 'scale(0.95) translateY(10px)' },
            '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
          },
          'glow-pulse': {
            '0%, 100%': { boxShadow: '0 0 10px rgba(212, 0, 0, 0.3)' },
            '50%': { boxShadow: '0 0 30px rgba(212, 0, 0, 0.6)' },
          },
          'pulse-critical': {
            '0%, 100%': { opacity: '1', boxShadow: '0 0 10px rgba(255, 23, 68, 0.4)' },
            '50%': { opacity: '0.7', boxShadow: '0 0 20px rgba(255, 23, 68, 0.7)' },
          },
          'charge-up': {
            '0%': { transform: 'scale(0.95)', boxShadow: '0 0 10px rgba(212, 0, 0, 0.3)' },
            '50%': { transform: 'scale(1.02)' },
            '100%': { transform: 'scale(1)', boxShadow: '0 0 25px rgba(212, 0, 0, 0.6)' },
          },
          'shake': {
            '0%, 100%': { transform: 'translateX(0)' },
            '25%': { transform: 'translateX(-5px)' },
            '75%': { transform: 'translateX(5px)' },
          },
          'screen-flash': {
            '0%, 100%': { opacity: '1' },
            '50%': { opacity: '0.8' },
          },
        },
      },
    },
    plugins: [],
  }