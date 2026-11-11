import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: { exclude: ['@imgly/background-removal', 'onnxruntime-web'] },
  server: {
    proxy: {
      '/api': {
        target: 'https://citanaplayground.my.id',
        changeOrigin: true,
        secure: true
      }
    }
  }

})


