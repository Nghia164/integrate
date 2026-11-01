import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '/src/utils/format.js': fileURLToPath(new URL('./src/lib/formatters.js', import.meta.url)),
      '/src/utils/format': fileURLToPath(new URL('./src/lib/formatters.js', import.meta.url)),
      '/src/utils/dateUtils.js': fileURLToPath(new URL('./src/lib/dateUtils.js', import.meta.url)),
      '/src/utils/dateUtils': fileURLToPath(new URL('./src/lib/dateUtils.js', import.meta.url)),
      '/src/utils/exportExcel.js': fileURLToPath(new URL('./src/lib/exportExcel.js', import.meta.url)),
      '/src/utils/exportExcel': fileURLToPath(new URL('./src/lib/exportExcel.js', import.meta.url)),
      '/src/utils/attendance.js': fileURLToPath(new URL('./src/lib/geoUtils.js', import.meta.url)),
    },
  },
})