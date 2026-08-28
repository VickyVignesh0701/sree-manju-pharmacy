import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Application is installed under this URL path.
  base: '/pharmacy/sree-manju-pharmacy/',

  // During development, forward API requests from Vite
  // to Apache/PHP running on localhost:80.
  server: {
    proxy: {
      '/pharmacy/sree-manju-pharmacy/api': {
        target: 'http://127.0.0.1',
        changeOrigin: true,
      },
    },
  },
})
