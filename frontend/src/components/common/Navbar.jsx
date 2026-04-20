import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="text-xl font-bold tracking-tight">
          🏛️ CivicReport
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-blue-200 transition">Home</Link>
          <Link to="/report" className="hover:text-blue-200 transition">Report Issue</Link>

          {user ? (
            <>
              <Link to="/my-issues" className="hover:text-blue-200 transition">My Issues</Link>

              {/* Show Dashboard only for officers/admins */}
              {profile?.role !== 'citizen' && (
                <Link to="/dashboard" className="hover:text-blue-200 transition">Dashboard</Link>
              )}

              {/* User menu */}
              <div className="flex items-center gap-3">
                <span className="text-blue-200 text-xs">
                  👤 {profile?.full_name?.split(' ')[0] || 'User'}
                </span>
                <button
                  onClick={handleSignOut}
                  className="bg-white text-blue-700 px-3 py-1 rounded-full hover:bg-blue-50 transition text-sm"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-white text-blue-700 px-3 py-1 rounded-full hover:bg-blue-50 transition"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}