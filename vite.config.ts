import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig, loadEnv } from "vite"
import { sentryVitePlugin } from "@sentry/vite-plugin"

const DEFAULT_PROXY_TARGET = "http://localhost:3000"

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
    plugins: [
      react(),
      sentryVitePlugin({
        authToken: process.env.SENTRY_AUTH_TOKEN,
        org: "micro-volunteer",
        project: "micro-volunteer-error-tracking-frontend",
    }),],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      sourcemap: true,
    },
    server: {
      port: 5173,
      strictPort: true,
      proxy: apiProxyTarget
        ? {
            "/api": {
              target: apiProxyTarget,
              changeOrigin: true,
              secure: false,
            },
          }
        : undefined,
    },
  }
})
