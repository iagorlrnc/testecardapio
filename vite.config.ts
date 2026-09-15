import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: 'es2022',
    cssMinify: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-model-viewer': ['@google/model-viewer'],
          'vendor-three': ['three'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-react': ['react', 'react-dom'],
          'vendor-ui': ['lucide-react', 'canvas-confetti', 'clsx', 'tailwind-merge'],
        },
      },
    },
  },
})
