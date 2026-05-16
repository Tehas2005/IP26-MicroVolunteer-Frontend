import { createBrowserRouter } from 'react-router-dom'

import RootLayout from '@/components/layout/RootLayout'
import AboutPage from '@/pages/AboutPage'
import AskForHelpPage from '@/pages/AskForHelpPage'
import AuthPage from '@/pages/AuthPage'
import ChatPage from '@/pages/ChatPage'
import HomePage from '@/pages/HomePage'
import VolunteerProfilePage from '@/pages/VolunteerProfilePage'
import InteractionHistoryPage from '@/pages/InteractionHistoryPage'
import ProfilePage from '@/pages/ProfilePage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import RequireAuthenticatedUser from './RequireAuthenticatedUser'

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
      {
        path: 'profil',
        element: (
          <RequireAuthenticatedUser>
            <VolunteerProfilePage />
          </RequireAuthenticatedUser>
        ),
      },
      {
        path: 'devino-voluntar',
        element: (
          <RequireAuthenticatedUser>
            <ProfilePage />
          </RequireAuthenticatedUser>
        ),
      },
      { path: 'despre-noi', element: <AboutPage /> },
      {
        path: 'istoric-interactiuni',
        element: (
          <RequireAuthenticatedUser>
            <InteractionHistoryPage />
          </RequireAuthenticatedUser>
        ),
      },
      { path: 'chat/:conversationId', element: <ChatPage /> },
      { path: 'chat', element: <ChatPage /> },
    ],
  },
])

export default router
