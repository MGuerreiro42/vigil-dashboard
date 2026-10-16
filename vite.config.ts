/// <reference types="vitest/config" />
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
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
