import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/widget.js',
        chunkFileNames: 'assets/widget.js',
        assetFileNames: 'assets/widget.[ext]',
      }
    }
  }
})
