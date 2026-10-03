import { Outlet } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import NotificationBell from '../components/NotificationBell'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      
      <Navbar />

      {/* Notification Bell */}
      <div className="fixed top-20 right-6 z-50">
        <NotificationBell />
      </div>

      <main className="flex-1">
        <Outlet />
      </main>

      <Footer />

    </div>
  )
}