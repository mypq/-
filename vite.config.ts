import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.5', // أو true حسب دعم النظام، سنتركها true
      host: true,
      port: 3000, // بعض المنصات تفضل بورت محدد مثل 3000 أو تركها افتراضي
      strictPort: true,
      allowedHosts: true,
      cors: true,
      hmr: {
        // اجبار الـ HMR على العمل عبر بروتوكول الأمان والمنطاق الصحيح
        protocol: 'wss',
        host: 'yogurt-paltry-tiger.abasthan.app',
        clientPort: 443
      },
    },
  };
});
