import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import process from 'process'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  server: {
    host: true,          // Allow local network access
    port: 5173           // Local dev port
  },

  preview: {
    host: "0.0.0.0",     // REQUIRED: Render needs external binding
    port: process.env.PORT || 4173,   // REQUIRED: Use Render's assigned port
  }
})
