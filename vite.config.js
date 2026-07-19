import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Predisposizione CI/CD: 'hidden' genera le source map senza referenziarle
    // nei bundle. La pipeline le caricherà su Sentry (vite-plugin + auth token
    // via env) senza pubblicarle; in locale restano spente.
    sourcemap: process.env.SOURCE_MAPS === 'hidden' ? 'hidden' : false,
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{js,jsx}'],
  },
})
