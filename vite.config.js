import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,        // listen on 0.0.0.0 so the browser reaches the container
    port: 5173,
    watch: {
      usePolling: true, // file change detection inside Docker volume mounts
    },
  },
})
