import { Outlet } from 'react-router-dom'

import { Footer } from './Footer'
import { Navbar } from './Navbar'

export function RootLayout() {
  return (
    <div className="flex h-screen flex-col bg-white">
      <Navbar />
      <main className="flex flex-1 flex-col overflow-y-auto">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default RootLayout
