import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import process from 'process';
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    host: true,
    port: 5173,
  },

  preview: {
    host: "0.0.0.0",
    port: process.env.PORT || 4173,

    // 🔥 REQUIRED FOR RENDER (fixes “host not allowed” error)
    allowedHosts: [
      "microsoc-command-center-frontend.onrender.com"
    ]
  }
})
