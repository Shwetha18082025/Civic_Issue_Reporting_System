import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const features = [
  { icon: '📍', title: 'Pin & Report', desc: 'Drop a pin on the map and submit civic issues with photos in under 60 seconds.' },
  { icon: '🔔', title: 'Live Tracking', desc: 'Real-time status updates as your issue moves from pending to fully resolved.' },
  { icon: '👆', title: 'Community Votes', desc: 'Upvote existing issues to push critical problems to the top of the queue.' },
  { icon: '🗺️', title: 'Issue Heatmap', desc: 'Visualize problem clusters across your city on an interactive live map.' },
  { icon: '📊', title: 'Officer Dashboard', desc: 'Municipal teams manage assignments, track SLAs and close issues efficiently.' },
  { icon: '🤖', title: 'AI Triage', desc: 'ML models auto-classify issues and predict resolution priority intelligently.' },
]

const categories = [
  ['🕳️', 'Pothole'], ['💡', 'Street Light'], ['🗑️', 'Garbage'],
  ['💧', 'Water Leak'], ['🚧', 'Sewage'], ['🌳', 'Tree Hazard'],
  ['🛣️', 'Road Damage'], ['🚻', 'Public Toilet'], ['🔊', 'Noise'], ['📌', 'Other'],
]

const steps = [
  { n: '01', title: 'Register', desc: 'Create a free citizen account in under a minute.' },
  { n: '02', title: 'Report', desc: 'Describe the issue, upload a photo, pin the location.' },
  { n: '03', title: 'Track', desc: 'Watch your issue get assigned and resolved live.' },
]

const stats = [
  { val: '10+', label: 'Issue categories' },
  { val: '3', label: 'User roles' },
  { val: 'AI', label: 'Powered triage' },
  { val: '24/7', label: 'Always on' },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <div style={{ paddingTop: '68px' }}>

      {/* ── Hero ── */}
      <section style={{
  padding: '7rem 1.5rem 6rem',
  minHeight: '92vh',
  display: 'flex',
  alignItems: 'center',
  background: 'linear-gradient(135deg, #0a0f2e 0%, #111a45 50%, #0f172a 100%)',
}}>
        <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>

          <div className="animate-fade-up" style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
            background: 'rgba(245,158,11,0.12)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: '9999px',
            padding: '0.4rem 1rem',
            marginBottom: '2rem',
          }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
            <span style={{ color: '#fcd34d', fontSize: '0.85rem', fontWeight: 500 }}>Built for Indian Cities</span>
          </div>

          <h1
            className="font-display animate-fade-up-delay-1"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.05, color: 'white', marginBottom: '1.5rem', letterSpacing: '-0.03em' }}
          >
            Report Civic Issues.<br />
            <span className="shimmer-text">Make Cities Better.</span>
          </h1>

          <p className="animate-fade-up-delay-2" style={{
            fontSize: '1.15rem', color: 'rgba(255,255,255,0.6)',
            maxWidth: '560px', margin: '0 auto 2.5rem',
            lineHeight: 1.7, fontWeight: 300,
          }}>
            Connect directly with local authorities to fix potholes, broken streetlights,
            garbage overflow, water leaks — and actually see them get resolved.
          </p>

          <div className="animate-fade-up-delay-3" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {user ? (
              <>
                <Link to="/report" className="btn-primary" style={{ fontSize: '1rem' }}>
                  📍 Report an Issue
                </Link>
                <Link to="/my-issues" className="btn-outline" style={{ fontSize: '1rem' }}>
                  My Issues →
                </Link>
              </>
            ) : (
              <>
                <Link to="/register" className="btn-primary" style={{ fontSize: '1rem' }}>
                  Get Started Free →
                </Link>
                <Link to="/login" className="btn-outline" style={{ fontSize: '1rem' }}>
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Stats row inside hero */}
          <div className="animate-fade-up-delay-4" style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '1rem', marginTop: '5rem', maxWidth: '640px', margin: '5rem auto 0',
          }}>
            {stats.map(s => (
              <div key={s.label} className="stat-card">
                <div className="font-display" style={{ fontSize: '1.75rem', fontWeight: 700, color: '#f59e0b' }}>{s.val}</div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.25rem', fontWeight: 400 }}>{s.label}</div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ── How It Works ── */}
      <section style={{ padding: '6rem 1.5rem', background: 'white' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Simple Process</p>
            <h2 className="font-display" style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0a0f2e', letterSpacing: '-0.03em' }}>
              Three steps to resolution
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem', position: 'relative' }}>
            {/* connector line */}
            <div style={{
              position: 'absolute', top: '28px', left: 'calc(16.6% + 28px)',
              width: 'calc(66.6% - 56px)', height: '2px',
              background: 'linear-gradient(90deg, #f59e0b, #fcd34d)',
              opacity: 0.3,
            }} />
            {steps.map((s) => (
              <div key={s.n} style={{ textAlign: 'center', padding: '0 1rem' }}>
                <div className="step-number">{s.n}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0a0f2e', marginBottom: '0.5rem' }}>{s.title}</h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '6rem 1.5rem', background: '#f8f9fc' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <p style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Platform Features</p>
            <h2 className="font-display" style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0a0f2e', letterSpacing: '-0.03em' }}>
              Everything you need
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
            {features.map((f, i) => (
              <div key={f.title} className="feature-card card-hover" style={{ animationDelay: `${i * 0.05}s` }}>
                <div style={{
                  width: '52px', height: '52px',
                  background: 'linear-gradient(135deg, #0a0f2e08, #0a0f2e14)',
                  borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.5rem', marginBottom: '1.25rem',
                }}>{f.icon}</div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0a0f2e', marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ── */}
      <section style={{ padding: '5rem 1.5rem', background: 'white' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{ color: '#f59e0b', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>What We Cover</p>
          <h2 className="font-display" style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0a0f2e', letterSpacing: '-0.03em', marginBottom: '2.5rem' }}>
            Every civic problem
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', justifyContent: 'center' }}>
            {categories.map(([icon, label]) => (
              <span key={label} className="tag-pill">{icon} {label}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      {!user && (
        <section style={{
  padding: '6rem 1.5rem',
  textAlign: 'center',
  background: 'linear-gradient(135deg, #0a0f2e 0%, #111a45 50%, #0f172a 100%)',
}}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 className="font-display" style={{ fontSize: '2.75rem', fontWeight: 900, color: 'white', letterSpacing: '-0.03em', marginBottom: '1rem' }}>
              Ready to make a<br /><span className="shimmer-text">real difference?</span>
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '1.05rem', marginBottom: '2.5rem', fontWeight: 300 }}>
              Join citizens already using CivicReport to hold local authorities accountable.
            </p>
            <Link to="/register" className="btn-primary" style={{ fontSize: '1rem' }}>
              Create Free Account →
            </Link>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer style={{
        background: '#0a0f2e',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '2rem 1.5rem',
        textAlign: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🏛️</span>
          <span className="font-display" style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>CivicReport</span>
        </div>
        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
          © 2025 CivicReport — Making cities better, one report at a time.
        </p>
      </footer>

    </div>
  )
}