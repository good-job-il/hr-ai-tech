import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

const CSP_API_ORIGIN_PLACEHOLDER = "__CSP_API_ORIGIN__"

function getApiOrigin(apiBaseUrl) {
  if (!apiBaseUrl) return ""

  try {
    const url = new URL(apiBaseUrl)
    return url.protocol === "http:" || url.protocol === "https:" ? url.origin : ""
  } catch {
    // Relative URLs such as /api are already covered by connect-src 'self'.
    return ""
  }
}

function cspApiOrigin(apiBaseUrl) {
  const origin = getApiOrigin(apiBaseUrl)

  return {
    name: "csp-api-origin",
    transformIndexHtml(html) {
      return html.replaceAll(CSP_API_ORIGIN_PLACEHOLDER, origin)
    },
  }
}

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
    plugins: [cspApiOrigin(env.VITE_API_BASE_URL), react()],
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
