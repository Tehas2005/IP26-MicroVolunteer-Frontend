import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"

const DEFAULT_PROXY_TARGET = "https://micro-volunteer-backend-service.up.railway.app"

function stripApiSuffix(url: string) {
  return url.replace(/\/+$/, "").replace(/\/api(?:\/auth)?$/, "")
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET ||
    env.VITE_BACKEND_BASE_URL ||
    (env.VITE_API_BASE_URL ? stripApiSuffix(env.VITE_API_BASE_URL) : "") ||
    (env.VITE_AUTH_BASE_URL ? stripApiSuffix(env.VITE_AUTH_BASE_URL) : "") ||
    env.VITE_API_URL ||
    DEFAULT_PROXY_TARGET

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: apiProxyTarget
      ? {
          proxy: {
            "/api": {
              target: apiProxyTarget,
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : undefined,
  }
})
