import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    port: 8000
  },
  build: {
    // Increase the chunk size warning limit to 1000 kB (1 MB)
    chunkSizeWarningLimit: 1000,
    
    // Configure Rollup options for better chunking
    rollupOptions: {
      output: {
        // Function-based manual chunking
        manualChunks: (id) => {
          // Put Vue and Vuetify in a vendor chunk
          if (id.includes('node_modules/vue/') || id.includes('node_modules/vuetify/')) {
            return 'vendor-vue';
          }
          
          // Put large components in a separate chunk
          if (id.includes('/components/CsvDataTable.vue') || 
              id.includes('/components/CustomTableViewer.vue') || 
              id.includes('/components/TableMinimap.vue')) {
            return 'components';
          }
          
          // Default chunk
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        }
      }
    }
  }
})
