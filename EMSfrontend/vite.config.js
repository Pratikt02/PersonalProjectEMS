import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Forward /api requests to local backend
      '/api': {
        target: 'https://emsbackend-1-c3ed.onrender.com',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})