import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // 开发阶段保留console
        drop_debugger: true
      }
    },
    sourcemap: true,
    target: 'es2020'
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
    hmr: {
      overlay: true
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  optimizeDeps: {
    exclude: ['sqlite3']
  },
  resolve: {
    alias: {
      '@': '/js',
      '@core': '/js/core',
      '@systems': '/js/systems',
      '@rendering': '/js/rendering',
      '@ui': '/js/ui',
      '@data': '/js/data',
      '@utils': '/js/utils'
    }
  },
  esbuild: {
    target: 'es2020'
  }
});