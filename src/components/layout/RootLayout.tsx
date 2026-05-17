import { Outlet, useLocation } from 'react-router-dom'

import { OfferAcceptedNotificationCenter } from '@/components/shared/OfferAcceptedNotificationCenter'
import { BlockedAccountScreen } from '@/components/shared/BlockedAccountScreen'
import { useAuthStore } from '@/store/authStore'

import { Toaster } from '@/components/ui/sonner'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { ChatFab } from '@/pages/chat/ChatFab'

export function RootLayout() {
  const accountStatus = useAuthStore((state) => state.accountStatus)
  const location = useLocation()
  const isChatRoute = location.pathname.startsWith('/chat')

  if (accountStatus === 'blocked') {
    return <BlockedAccountScreen />
  }

  return (
    <div
      className={[
        'flex flex-col bg-white',
        isChatRoute ? 'h-dvh overflow-hidden' : 'min-h-screen',
      ].join(' ')}
    >
      <Navbar />
      <main
        className={[
          'flex min-h-0 flex-1 flex-col',
          isChatRoute ? 'overflow-hidden' : '',
        ].join(' ')}
      >
        <Outlet />
      </main>
      {!isChatRoute ? <Footer /> : null}
      <OfferAcceptedNotificationCenter />
      <ChatFab />
      <Toaster position="top-right" richColors />
    </div>
  )
}

export default RootLayout
