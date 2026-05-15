/* eslint-disable react-refresh/only-export-components */
import type { ReactNode } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'

import RootLayout from '@/components/layout/RootLayout'
import AboutPage from '@/pages/AboutPage'
import AcceptVolunteerModalPreviewPage from '@/pages/AcceptVolunteerModalPreviewPage'
import AskForHelpPage from '@/pages/AskForHelpPage'
import AuthPage from '@/pages/AuthPage'
import ChatPage from '@/pages/ChatPage'
import HomePage from '@/pages/HomePage'
import ProfilePage from '@/pages/ProfilePage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import { useAuthStore } from '@/store/authStore'

function RequireAuthenticatedUser({ children }: { children: ReactNode }) {
  const isGuest = useAuthStore((state) => state.isGuest)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)

  if (sessionStatus === 'loading') {
    return null
  }

  if (isGuest) {
    return <Navigate to="/auth/login" replace />
  }

  return <>{children}</>
}

export const router = createBrowserRouter([
  { path: '/auth', element: <AuthPage mode="login" /> },
  { path: '/auth/login', element: <AuthPage mode="login" /> },
  { path: '/auth/signup', element: <AuthPage mode="signup" /> },
  { path: '/auth/reset-password', element: <ResetPasswordPage /> },
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'cere-ajutor', element: <AskForHelpPage /> },
      { path: 'dev/fe-008-modal', element: <AcceptVolunteerModalPreviewPage /> },
      {
        path: 'profil',
        element: (
          <RequireAuthenticatedUser>
            <ProfilePage />
          </RequireAuthenticatedUser>
        ),
      },
      { path: 'despre-noi', element: <AboutPage /> },
      { path: 'chat/:conversationId', element: <ChatPage /> },
      { path: 'chat', element: <ChatPage /> },
    ],
  },
])

export default router
