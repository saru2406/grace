import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: false,
    proxy: {
      '/api/steamgriddb': {
        target: 'https://www.steamgriddb.com/api/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/steamgriddb/, ''),
        headers: {
          'Authorization': 'Bearer 4cfb690f7e0a2aace2617077f4a42aac'
        }
      }
    }
  }
});
