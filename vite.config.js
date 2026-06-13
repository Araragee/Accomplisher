import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Honor a PORT injected by tooling (e.g. preview/CI); fall back to Vite's default.
  server: { port: process.env.PORT ? Number(process.env.PORT) : undefined },
})
