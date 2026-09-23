import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'

export default function Navbar() {
  const { t } = useTranslation()
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
    }

    window.addEventListener('scroll', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  async function handleSignOut() {
    await signOut()
    setMenuOpen(false)
    navigate('/')
  }

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/'
    }

    return location.pathname === path
  }

  const navLinks = [
    {
      to: '/',
      label: t('nav.home'),
    },

    ...((!user || profile?.role === 'citizen')
      ? [
          {
            to: '/report',
            label: t('nav.report'),
          },
        ]
      : []),

    ...(user && profile?.role === 'citizen'
      ? [
          {
            to: '/my-issues',
            label: t('nav.myIssues'),
          },
        ]
      : []),

    ...(user &&
    (profile?.role === 'officer' ||
      profile?.role === 'admin')
      ? [
          {
            to: '/authority/dashboard',
            label: t('nav.dashboard'),
          },
        ]
      : []),

    {
      to: '/issue-map',
      label: '🗺️ Issue Map',
    },
  ]

  return (
    <nav
      style={{
        background: scrolled
          ? 'rgba(10,15,46,0.97)'
          : '#0a0f2e',

        backdropFilter: scrolled
          ? 'blur(12px)'
          : 'none',

        borderBottom: scrolled
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid transparent',

        position: 'fixed',

        top: 0,
        left: 0,
        right: 0,

        zIndex: 1000,

        transition: 'all 0.3s ease',
      }}
    >
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
            <div
              style={{
                width: '38px',
                height: '38px',

                background:
                  'linear-gradient(135deg, #f59e0b, #fcd34d)',

                borderRadius: '10px',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                fontSize: '19px',

                boxShadow:
                  '0 5px 18px rgba(245,158,11,0.35)',
              }}
            >
              🏛️
            </div>

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
                    ? '#f59e0b'
                    : 'rgba(255,255,255,0.75)',

                  textDecoration: 'none',

                  fontSize: '0.9rem',

                  fontWeight: 500,

                  padding: '0.55rem 0.9rem',

                  borderRadius: '8px',

                  transition: 'all 0.2s ease',

                  background: isActive(to)
                    ? 'rgba(245,158,11,0.12)'
                    : 'transparent',

                  whiteSpace: 'nowrap',
                }}
              >
                {label}
              </Link>
            ))}
          </div>


          {/* ================= RIGHT SIDE ================= */}

          <div
            className="navbar-desktop"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
            }}
          >

            {/* 🌐 LANGUAGE SWITCHER */}

            <LanguageSwitcher />


            {/* ================= AUTH ================= */}

            {user ? (
              <>
                {/* USER PROFILE */}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',

                    background:
                      'rgba(255,255,255,0.08)',

                    border:
                      '1px solid rgba(255,255,255,0.12)',

                    borderRadius: '9999px',

                    padding:
                      '0.35rem 0.9rem 0.35rem 0.5rem',
                  }}
                >

                  <div
                    style={{
                      width: '29px',
                      height: '29px',

                      background:
                        'linear-gradient(135deg,#f59e0b,#fcd34d)',

                      borderRadius: '50%',

                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',

                      fontSize: '13px',

                      fontWeight: 700,

                      color: '#0a0f2e',
                    }}
                  >
                    {profile?.full_name?.[0]?.toUpperCase() ||
                      'U'}
                  </div>

                  <span
                    style={{
                      color:
                        'rgba(255,255,255,0.88)',

                      fontSize: '0.85rem',

                      fontWeight: 500,
                    }}
                  >
                    {profile?.full_name?.split(' ')[0] ||
                      t('nav.user')}
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

                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('nav.signOut')}
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

                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('nav.signIn')}
                </Link>


                {/* GET STARTED */}

                <Link
                  to="/register"
                  className="btn-primary"
                  style={{
                    fontSize: '0.9rem',
                    padding: '0.5rem 1.25rem',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('nav.getStarted')}
                </Link>
              </>
            )}
          </div>


          {/* ================= MOBILE BUTTON ================= */}

          <button
            className="navbar-mobile-button"
            onClick={() => setMenuOpen(!menuOpen)}
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
                '1px solid rgba(245,158,11,0.15)',
            }}
          >

            {/* LANGUAGE SWITCHER MOBILE */}

            <div
              style={{
                padding: '0.5rem 0',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <LanguageSwitcher />
            </div>


            {/* MOBILE LINKS */}

            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'block',

                  color: isActive(to)
                    ? '#f59e0b'
                    : 'rgba(255,255,255,0.82)',

                  textDecoration: 'none',

                  fontSize: '0.95rem',

                  fontWeight: 500,

                  padding:
                    '0.75rem 1rem',

                  borderRadius: '8px',

                  background: isActive(to)
                    ? 'rgba(245,158,11,0.1)'
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

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.5rem 1rem',
                    color: 'white',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',

                      background:
                        'linear-gradient(135deg,#f59e0b,#fcd34d)',

                      borderRadius: '50%',

                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',

                      color: '#0a0f2e',

                      fontWeight: 700,
                    }}
                  >
                    {profile?.full_name?.[0]?.toUpperCase() ||
                      'U'}
                  </div>

                  <span>
                    {profile?.full_name ||
                      t('nav.user')}
                  </span>
                </div>

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
                  {t('nav.signOut')}
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
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
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
                  {t('nav.signIn')}
                </Link>

                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
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
                  {t('nav.getStarted')}
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