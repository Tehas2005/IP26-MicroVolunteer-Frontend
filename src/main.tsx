import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'

import { AuthSessionBootstrap } from '@/components/shared/AuthSessionBootstrap'
import router from '@/router'

import './index.css'

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
