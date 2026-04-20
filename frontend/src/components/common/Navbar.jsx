import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  const isActive = (path) => location.pathname === path

  return (
    <nav
      style={{
        background: scrolled ? 'rgba(10,15,46,0.97)' : '#0a0f2e',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 100,
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>

          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div style={{
              width: '36px', height: '36px',
              background: 'linear-gradient(135deg, #f59e0b, #fcd34d)',
              borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px'
            }}>🏛️</div>
            <span style={{
              fontFamily: 'Fraunces, serif',
              fontSize: '1.25rem',
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.02em'
            }}>CivicReport</span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            {[
              { to: '/', label: 'Home' },
              { to: '/report', label: 'Report Issue' },
              ...(user ? [{ to: '/my-issues', label: 'My Issues' }] : []),
              ...(profile?.role !== 'citizen' && user ? [{ to: '/dashboard', label: 'Dashboard' }] : []),
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                style={{
                  color: isActive(to) ? '#f59e0b' : 'rgba(255,255,255,0.75)',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  transition: 'all 0.15s ease',
                  background: isActive(to) ? 'rgba(245,158,11,0.1)' : 'transparent',
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* Auth buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {user ? (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: '9999px',
                  padding: '0.35rem 0.9rem 0.35rem 0.5rem',
                }}>
                  <div style={{
                    width: '28px', height: '28px',
                    background: 'linear-gradient(135deg, #f59e0b, #fcd34d)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 700, color: '#0a0f2e'
                  }}>
                    {profile?.full_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontWeight: 500 }}>
                    {profile?.full_name?.split(' ')[0] || 'User'}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  style={{
                    background: 'transparent',
                    border: '1.5px solid rgba(255,255,255,0.25)',
                    color: 'rgba(255,255,255,0.7)',
                    padding: '0.4rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={e => { e.target.style.borderColor = 'rgba(255,255,255,0.6)'; e.target.style.color = 'white' }}
                  onMouseLeave={e => { e.target.style.borderColor = 'rgba(255,255,255,0.25)'; e.target.style.color = 'rgba(255,255,255,0.7)' }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  style={{
                    color: 'rgba(255,255,255,0.75)',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    padding: '0.5rem 0.9rem',
                  }}
                >
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary" style={{ fontSize: '0.9rem', padding: '0.5rem 1.25rem' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  )
}