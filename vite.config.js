import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiProxyTarget = env.VITE_API_PROXY_TARGET || "http://localhost:3001"

  const serverConfig = {
    proxy: {
      "/api": {
        target: apiProxyTarget,
        changeOrigin: true,
      },
    },
  }

  return {
    logLevel: "error",
    plugins: [react()],
    resolve: {
      alias: { "@/": "/src/" },
    },
    server: serverConfig,
    optimizeDeps: {
      esbuildOptions: {
        loader: { ".js": "jsx" },
      },
    },
  }
})
