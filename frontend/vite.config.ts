import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // host: true expone el servidor de desarrollo en la red local (no solo localhost),
  // para que otros equipos en la misma red puedan entrar por la IP de este equipo.
  server: {
    host: true,
  },
})
