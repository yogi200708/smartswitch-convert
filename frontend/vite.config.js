import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    cors: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Private-Network': 'true'
    },
    proxy: {
      '/esp-proxy': {
        target: 'http://10.25.191.83',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/esp-proxy/, ''),
        headers: {
          'Access-Control-Allow-Private-Network': 'true'
        }
      }
    }
  }
})
