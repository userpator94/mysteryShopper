import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'

/** Короткий хеш текущего коммита — та же группа, что в `git log --oneline`. */
function readShortCommit(): string {
  try {
    const hash = execSync('git rev-parse --short=7 HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
    return /^[0-9a-f]{7,}$/i.test(hash) ? hash.slice(0, 7).toLowerCase() : ''
  } catch {
    return ''
  }
}

export default defineConfig({
  define: {
    'import.meta.env.VITE_COMMIT': JSON.stringify(readShortCommit()),
  },
  server: {
    host: '0.0.0.0', // Слушать на всех интерфейсах
    port: 5173,
    strictPort: true, // Не менять порт если занят
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false // Отключаем sourcemaps в production для уменьшения размера бандла
  }
})
