import { createBrowserRouter } from 'react-router-dom'

import RootLayout from '@/components/layout/RootLayout'
import AboutPage from '@/pages/AboutPage'
import AskForHelpPage from '@/pages/AskForHelpPage'
import AuthPage from '@/pages/AuthPage'
import HomePage from '@/pages/HomePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'cere-ajutor', element: <AskForHelpPage /> },
      { path: 'despre-noi', element: <AboutPage /> },
      { path: 'auth', element: <AuthPage mode="login" /> },
      { path: 'auth/login', element: <AuthPage mode="login" /> },
      { path: 'auth/signup', element: <AuthPage mode="signup" /> },
    ],
  },
])

export default router
