import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="bg-blue-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold tracking-tight">
          🏛️ CivicReport
        </Link>
        <div className="flex gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-blue-200 transition">Home</Link>
          <Link to="/report" className="hover:text-blue-200 transition">Report Issue</Link>
          <Link to="/my-issues" className="hover:text-blue-200 transition">My Issues</Link>
          <Link to="/dashboard" className="hover:text-blue-200 transition">Dashboard</Link>
          <Link to="/login" className="bg-white text-blue-700 px-3 py-1 rounded-full hover:bg-blue-50 transition">
            Login
          </Link>
        </div>
      </div>
    </nav>
  )
}