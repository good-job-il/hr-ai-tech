import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const serverConfig = {};
  if (env.VITE_API_PROXY_TARGET) {
    console.log(`[proxy] /api -> ${env.VITE_API_PROXY_TARGET}`);
    serverConfig.proxy = {
      '/api': {
        target: env.VITE_API_PROXY_TARGET,
        changeOrigin: true,
      },
    };
  }

  return {
    logLevel: 'error',
    plugins: [react()],
    resolve: {
      alias: { '@/': '/src/' },
    },
    server: serverConfig,
    optimizeDeps: {
      esbuildOptions: {
        loader: { '.js': 'jsx' },
      },
    },
  };
});
