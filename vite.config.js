import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { quasar, transformAssetUrls } from '@quasar/vite-plugin';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    vue({
      template: { transformAssetUrls }
    }),
    quasar({
      sassVariables: 'src/quasar-variables.sass'
    })
  ],
  resolve: {
    alias: {
      'src': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: 'modern-compiler',
        loadPaths: ['src']
      }
    }
  },
  server: {
    port: 5173,
    // On force l'hôte pour CodeSandbox
    host: true, 
    // On désactive le HMR comme tu voulais
    hmr: false,
    proxy: {
      // TRÈS IMPORTANT : On vise localhost pour le backend interne
      // sans passer par l'URL publique .csb.app
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  }
});