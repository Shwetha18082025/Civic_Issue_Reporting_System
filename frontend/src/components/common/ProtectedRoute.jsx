// frontend/src/components/common/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth()

  // Still fetching session — don't redirect yet
  if (loading) return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f8f9fc'
    }}>
      <p style={{ color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>
        Loading...
      </p>
    </div>
  )

  // Not logged in → go to login
  if (!user) return <Navigate to="/login" replace />

  // Role-restricted route
  if (allowedRoles) {
    // Profile still fetching → wait
    if (!profile) return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fc'
      }}>
        <p style={{ color: '#64748b', fontFamily: 'DM Sans, sans-serif' }}>
          Checking permissions...
        </p>
      </div>
    )

    // Wrong role → send home
    if (!allowedRoles.includes(profile.role)) {
      return <Navigate to="/home" replace />
    }
  }

  return children
}