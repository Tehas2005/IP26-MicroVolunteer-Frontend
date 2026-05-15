import path from "path"
import react from "@vitejs/plugin-react"
import { sentryVitePlugin } from "@sentry/vite-plugin"
import { loadEnv } from "vite"
import { defineConfig } from "vitest/config"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")
  const apiProxyTarget = env.VITE_SERVER_URL || "http://localhost:3000"

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
    test: {
      environment: "jsdom",
      globals: true,
      setupFiles: ["./src/test/setup.ts"],
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
