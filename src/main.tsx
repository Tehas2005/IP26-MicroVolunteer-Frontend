import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider, useLocation, useNavigationType, createRoutesFromChildren, matchRoutes } from 'react-router-dom'
import * as Sentry from "@sentry/react"
import { createAuthClient } from 'better-auth/client'
import { emailOTPClient } from 'better-auth/client/plugins'

import { AuthSessionBootstrap } from '@/components/shared/AuthSessionBootstrap'
import router from '@/router'

import './index.css'

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  sendDefaultPii: true,
  tracesSampleRate: 1.0,
  integrations: [
    Sentry.reactRouterV6BrowserTracingIntegration({
      useEffect: React.useEffect,
      useLocation,
      useNavigationType,
      createRoutesFromChildren,
      matchRoutes,
    }),
    Sentry.replayIntegration(),
  ],

  // Session Replay
  replaysSessionSampleRate: 0.1, 
  replaysOnErrorSampleRate: 1.0,

  // Activează log-urile interne Sentry pentru debugging
  debug: true,
});
export const authClient = createAuthClient({
  baseURL: import.meta.env.SERVER_URL,
  plugins: [emailOTPClient()]
})
const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthSessionBootstrap>
        <RouterProvider router={router} />
      </AuthSessionBootstrap>
    </QueryClientProvider>
  </React.StrictMode>,
)
