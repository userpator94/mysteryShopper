import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: '0.0.0.0', // Слушать на всех интерфейсах
    port: 5173,
    strictPort: true, // Не менять порт если занят
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
