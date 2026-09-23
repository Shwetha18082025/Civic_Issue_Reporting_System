import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  // ================= SCROLL EFFECT =================

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  // ================= SIGN OUT =================

  async function handleSignOut() {
    await signOut()
    setMenuOpen(false)
    navigate('/')
  }

  // ================= ACTIVE LINK =================

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }

    return location.pathname === path
  }

  // ================= NAVIGATION LINKS =================

  const navLinks = [
    {
      to: '/',
      label: 'Home',
    },

    // Citizen can report issues
    ...((!user || profile?.role === 'citizen')
      ? [
          {
            to: '/report',
            label: 'Report Issue',
          },
        ]
      : []),

    // Logged-in users
    ...(user
      ? [
          {
            to: '/my-issues',
            label: 'My Issues',
          },
        ]
      : []),

    // Authority dashboard
    ...(user &&
    (profile?.role === 'officer' ||
      profile?.role === 'admin')
      ? [
          {
            to: '/authority/dashboard',
            label: 'Dashboard',
          },
        ]
      : []),

    // Civic Issue Map
    {
      to: '/issue-map',
      label: '🗺️ Issue Map',
    },
  ]

  return (
    <nav
      style={{
        background: scrolled
          ? 'rgba(10, 15, 46, 0.98)'
          : '#0a0f2e',

        backdropFilter: scrolled
          ? 'blur(14px)'
          : 'none',

        borderBottom: scrolled
          ? '1px solid rgba(239, 68, 68, 0.25)'
          : '1px solid transparent',

        position: 'fixed',

        top: 0,
        left: 0,
        right: 0,

        zIndex: 1000,

        transition: 'all 0.3s ease',
      }}
    >

      {/* ================= CONTAINER ================= */}

      <div
        style={{
          maxWidth: '1250px',
          margin: '0 auto',
          padding: '0 1.5rem',
        }}
      >

        {/* ================= MAIN NAVBAR ================= */}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '68px',
          }}
        >

          {/* ================= LOGO ================= */}

          <Link
            to="/"
            onClick={() => setMenuOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              textDecoration: 'none',
            }}
          >

            {/* Logo Icon */}

            <div
              style={{
                width: '38px',
                height: '38px',

                background:
                  'linear-gradient(135deg, #dc2626, #ef4444)',

                borderRadius: '10px',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                fontSize: '19px',

                boxShadow:
                  '0 5px 18px rgba(239, 68, 68, 0.35)',
              }}
            >
              🏛️
            </div>

            {/* Logo Text */}

            <span
              style={{
                fontFamily: 'Fraunces, serif',

                fontSize: '1.3rem',

                fontWeight: 700,

                color: 'white',

                letterSpacing: '-0.02em',
              }}
            >
              CivicReport
            </span>
          </Link>


          {/* ================= DESKTOP NAV ================= */}

          <div
            className="navbar-desktop"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >

            {navLinks.map(({ to, label }) => (

              <Link
                key={to}
                to={to}

                style={{
                  color: isActive(to)
                    ? '#ef4444'
                    : 'rgba(255,255,255,0.75)',

                  textDecoration: 'none',

                  fontSize: '0.9rem',

                  fontWeight: 500,

                  padding: '0.55rem 0.9rem',

                  borderRadius: '8px',

                  transition:
                    'all 0.2s ease',

                  background: isActive(to)
                    ? 'rgba(239,68,68,0.12)'
                    : 'transparent',
                }}

                onMouseEnter={(e) => {

                  if (!isActive(to)) {

                    e.currentTarget.style.color =
                      '#ffffff'

                    e.currentTarget.style.background =
                      'rgba(239,68,68,0.08)'
                  }

                }}

                onMouseLeave={(e) => {

                  if (!isActive(to)) {

                    e.currentTarget.style.color =
                      'rgba(255,255,255,0.75)'

                    e.currentTarget.style.background =
                      'transparent'
                  }

                }}
              >
                {label}
              </Link>

            ))}

          </div>


          {/* ================= USER / AUTH ================= */}

          <div
            className="navbar-desktop"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
            }}
          >

            {user ? (

              <>

                {/* USER PROFILE */}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',

                    background:
                      'rgba(255,255,255,0.07)',

                    border:
                      '1px solid rgba(255,255,255,0.12)',

                    borderRadius: '9999px',

                    padding:
                      '0.35rem 0.9rem 0.35rem 0.5rem',
                  }}
                >

                  {/* Avatar */}

                  <div
                    style={{
                      width: '29px',
                      height: '29px',

                      background:
                        'linear-gradient(135deg,#dc2626,#ef4444)',

                      borderRadius: '50%',

                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',

                      fontSize: '13px',

                      fontWeight: 700,

                      color: 'white',
                    }}
                  >
                    {profile?.full_name?.[0]?.toUpperCase() ||
                      'U'}
                  </div>

                  {/* Name */}

                  <span
                    style={{
                      color:
                        'rgba(255,255,255,0.88)',

                      fontSize: '0.85rem',

                      fontWeight: 500,
                    }}
                  >
                    {profile?.full_name?.split(' ')[0] ||
                      'User'}
                  </span>

                </div>


                {/* SIGN OUT */}

                <button
                  onClick={handleSignOut}

                  style={{
                    background: 'transparent',

                    border:
                      '1.5px solid rgba(255,255,255,0.25)',

                    color:
                      'rgba(255,255,255,0.75)',

                    padding:
                      '0.42rem 1rem',

                    borderRadius: '9999px',

                    fontSize: '0.85rem',

                    fontWeight: 500,

                    cursor: 'pointer',

                    transition:
                      'all 0.2s ease',
                  }}

                  onMouseEnter={(e) => {

                    e.currentTarget.style.borderColor =
                      '#ef4444'

                    e.currentTarget.style.color =
                      '#ef4444'

                    e.currentTarget.style.background =
                      'rgba(239,68,68,0.08)'
                  }}

                  onMouseLeave={(e) => {

                    e.currentTarget.style.borderColor =
                      'rgba(255,255,255,0.25)'

                    e.currentTarget.style.color =
                      'rgba(255,255,255,0.75)'

                    e.currentTarget.style.background =
                      'transparent'
                  }}
                >
                  Sign out
                </button>

              </>

            ) : (

              <>

                {/* SIGN IN */}

                <Link
                  to="/login"

                  style={{
                    color:
                      'rgba(255,255,255,0.75)',

                    textDecoration: 'none',

                    fontSize: '0.9rem',

                    fontWeight: 500,

                    padding:
                      '0.5rem 0.9rem',

                    transition:
                      'color 0.2s ease',
                  }}

                  onMouseEnter={(e) => {
                    e.currentTarget.style.color =
                      '#ef4444'
                  }}

                  onMouseLeave={(e) => {
                    e.currentTarget.style.color =
                      'rgba(255,255,255,0.75)'
                  }}
                >
                  Sign in
                </Link>


                {/* GET STARTED */}

                <Link
                  to="/register"

                  style={{
                    background:
                      'linear-gradient(135deg,#dc2626,#ef4444)',

                    color: 'white',

                    textDecoration: 'none',

                    fontSize: '0.9rem',

                    fontWeight: 600,

                    padding:
                      '0.55rem 1.25rem',

                    borderRadius:
                      '9999px',

                    boxShadow:
                      '0 4px 14px rgba(239,68,68,0.25)',

                    transition:
                      'all 0.2s ease',
                  }}
                >
                  Get Started
                </Link>

              </>

            )}

          </div>


          {/* ================= MOBILE BUTTON ================= */}

          <button
            className="navbar-mobile-button"

            onClick={() =>
              setMenuOpen(!menuOpen)
            }

            style={{
              display: 'none',

              background: 'transparent',

              border: 'none',

              color: 'white',

              fontSize: '26px',

              cursor: 'pointer',

              padding: '5px',
            }}
          >
            {menuOpen ? '✕' : '☰'}
          </button>

        </div>


        {/* ================= MOBILE MENU ================= */}

        {menuOpen && (

          <div
            style={{
              paddingTop: '0.75rem',

              paddingBottom: '1rem',

              borderTop:
                '1px solid rgba(239,68,68,0.15)',
            }}
          >

            {/* Mobile Links */}

            {navLinks.map(({ to, label }) => (

              <Link
                key={to}

                to={to}

                onClick={() =>
                  setMenuOpen(false)
                }

                style={{
                  display: 'block',

                  color: isActive(to)
                    ? '#ef4444'
                    : 'rgba(255,255,255,0.82)',

                  textDecoration: 'none',

                  fontSize: '0.95rem',

                  fontWeight: 500,

                  padding:
                    '0.75rem 1rem',

                  borderRadius: '8px',

                  background: isActive(to)
                    ? 'rgba(239,68,68,0.1)'
                    : 'transparent',

                  marginBottom: '0.2rem',
                }}
              >
                {label}
              </Link>

            ))}


            {/* MOBILE AUTH */}

            {user ? (

              <div
                style={{
                  marginTop: '0.5rem',

                  paddingTop: '0.75rem',

                  borderTop:
                    '1px solid rgba(255,255,255,0.08)',
                }}
              >

                {/* Mobile Profile */}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',

                    padding:
                      '0.5rem 1rem',

                    color: 'white',
                  }}
                >

                  <div
                    style={{
                      width: '32px',
                      height: '32px',

                      background:
                        'linear-gradient(135deg,#dc2626,#ef4444)',

                      borderRadius: '50%',

                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',

                      color: 'white',

                      fontWeight: 700,
                    }}
                  >
                    {profile?.full_name?.[0]?.toUpperCase() ||
                      'U'}
                  </div>

                  <span>
                    {profile?.full_name ||
                      'User'}
                  </span>

                </div>


                {/* Mobile Sign Out */}

                <button
                  onClick={handleSignOut}

                  style={{
                    width: '100%',

                    marginTop: '0.5rem',

                    background:
                      'rgba(239,68,68,0.08)',

                    border:
                      '1px solid rgba(239,68,68,0.4)',

                    color: '#ef4444',

                    padding: '0.65rem',

                    borderRadius: '8px',

                    cursor: 'pointer',

                    fontSize: '0.9rem',
                  }}
                >
                  Sign out
                </button>

              </div>

            ) : (

              <div
                style={{
                  display: 'flex',

                  gap: '0.5rem',

                  marginTop: '0.5rem',

                  paddingTop: '0.75rem',

                  borderTop:
                    '1px solid rgba(255,255,255,0.08)',
                }}
              >

                {/* Mobile Sign In */}

                <Link
                  to="/login"

                  onClick={() =>
                    setMenuOpen(false)
                  }

                  style={{
                    flex: 1,

                    textAlign: 'center',

                    color: 'white',

                    textDecoration: 'none',

                    padding: '0.65rem',

                    border:
                      '1px solid rgba(255,255,255,0.25)',

                    borderRadius: '8px',
                  }}
                >
                  Sign in
                </Link>


                {/* Mobile Get Started */}

                <Link
                  to="/register"

                  onClick={() =>
                    setMenuOpen(false)
                  }

                  style={{
                    flex: 1,

                    textAlign: 'center',

                    background:
                      'linear-gradient(135deg,#dc2626,#ef4444)',

                    color: 'white',

                    textDecoration: 'none',

                    padding: '0.65rem',

                    borderRadius: '8px',

                    fontWeight: 600,
                  }}
                >
                  Get Started
                </Link>

              </div>

            )}

          </div>

        )}

      </div>


      {/* ================= RESPONSIVE CSS ================= */}

      <style>
        {`
          @media (max-width: 900px) {

            .navbar-desktop {
              display: none !important;
            }

            .navbar-mobile-button {
              display: block !important;
            }

          }

          @media (min-width: 901px) {

            .navbar-mobile-button {
              display: none !important;
            }

          }
        `}
      </style>

    </nav>
  )
}