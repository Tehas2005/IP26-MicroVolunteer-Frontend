import { Outlet } from 'react-router-dom'

import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { ChatFab } from '@/pages/chat/ChatFab'

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>
      <Footer />
      <ChatFab />
    </div>
  )
}

export default RootLayout
