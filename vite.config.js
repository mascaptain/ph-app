import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Le catalogue et React changent a des rythmes tres differents de l'application :
    // les separer permet au navigateur de garder en cache ce qui ne bouge pas.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('src/catalog.js')) return 'catalogue'
          if (id.includes('node_modules/react') || id.includes('node_modules/scheduler')) return 'react'
          if (id.includes('node_modules/@supabase')) return 'supabase'
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
})
