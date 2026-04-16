import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // Proxy GDACS RSS feed to bypass CORS in dev
      '/api/gdacs': {
        target: 'https://www.gdacs.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/gdacs/, ''),
        secure: false, // gdacs.org has a self-signed cert in the chain
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor-react'
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion'
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) return 'vendor-charts'
          if (id.includes('node_modules/@tanstack')) return 'vendor-query'
          if (id.includes('node_modules/react-globe.gl') || id.includes('node_modules/three-globe') || id.includes('node_modules/three/')) return 'vendor-globe'
          if (id.includes('node_modules/leaflet') || id.includes('node_modules/react-leaflet')) return 'vendor-leaflet'
        },
      },
    },
  },
})
