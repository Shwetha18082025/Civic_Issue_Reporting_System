import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const statusColors = {
  pending:     { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  in_progress: { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  resolved:    { bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
  rejected:    { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
}

const priorityColors = {
  low:      '#64748b',
  medium:   '#f59e0b',
  high:     '#f97316',
  critical: '#ef4444',
}

export default function Dashboard() {
  const { user, profile } = useAuth()
  const [issues, setIssues]   = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState('all')

  const stats = {
    total:       issues.length,
    pending:     issues.filter(i => i.status === 'pending').length,
    in_progress: issues.filter(i => i.status === 'in_progress').length,
    resolved:    issues.filter(i => i.status === 'resolved').length,
  }

  useEffect(() => {
    if (user) fetchIssues()
  }, [user])

  async function fetchIssues() {
    setLoading(true)
    const { data } = await supabase
      .from('issues')
      .select('*, categories(name, icon), issue_images(image_url)')
      .eq('reported_by', user.id)
      .order('created_at', { ascending: false })
    if (data) setIssues(data)
    setLoading(false)
  }

  const filtered = filter === 'all' ? issues : issues.filter(i => i.status === filter)

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: '#f8f9fc' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0a0f2e, #111a45)', padding: '3rem 1.5rem 2.5rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem', marginBottom: '0.35rem' }}>Welcome back</p>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: '2rem' }}>
            {profile?.full_name || user?.email?.split('@')[0] || 'Citizen'} 👋
          </h1>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
            {[
              { label: 'Total Reports', value: stats.total, icon: '📋', color: '#f59e0b' },
              { label: 'Pending', value: stats.pending, icon: '⏳', color: '#fbbf24' },
              { label: 'In Progress', value: stats.in_progress, icon: '🔧', color: '#60a5fa' },
              { label: 'Resolved', value: stats.resolved, icon: '✅', color: '#34d399' },
            ].map(s => (
              <div key={s.label} style={{
                background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '14px', padding: '1.25rem',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{s.icon}</div>
                <div style={{ fontSize: '2rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '0.35rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1100px', margin: '2rem auto', padding: '0 1.5rem 4rem' }}>

        {/* Filter + CTA row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['all', 'pending', 'in_progress', 'resolved'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '0.4rem 1rem', borderRadius: '9999px', fontSize: '0.82rem', fontWeight: 600,
                  border: filter === f ? 'none' : '1.5px solid #e2e8f0',
                  background: filter === f ? '#0a0f2e' : 'white',
                  color: filter === f ? 'white' : '#475569',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                {f === 'all' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                <span style={{ marginLeft: '0.35rem', opacity: 0.6 }}>
                  ({f === 'all' ? stats.total : stats[f] || 0})
                </span>
              </button>
            ))}
          </div>
          <Link
            to="/report"
            style={{
              background: '#f59e0b', color: '#0a0f2e', padding: '0.5rem 1.25rem',
              borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            + Report New Issue
          </Link>
        </div>

        {/* Issue list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>⏳ Loading your issues...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <p style={{ color: '#475569', fontWeight: 600, marginBottom: '0.5rem' }}>No issues found</p>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              {filter === 'all' ? "You haven't reported any issues yet." : `No ${filter.replace('_', ' ')} issues.`}
            </p>
            <Link to="/report" style={{ background: '#f59e0b', color: '#0a0f2e', padding: '0.6rem 1.5rem', borderRadius: '9999px', fontWeight: 700, textDecoration: 'none', fontSize: '0.875rem' }}>
              Report Your First Issue
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filtered.map(issue => {
              const s = statusColors[issue.status] || statusColors.pending
              const thumb = issue.issue_images?.[0]?.image_url
              return (
                <Link
                  key={issue.id}
                  to={`/issues/${issue.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: 'white', borderRadius: '14px', padding: '1.25rem',
                    border: '1px solid #e2e8f0', display: 'flex', gap: '1rem',
                    alignItems: 'center', transition: 'all 0.15s', cursor: 'pointer',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(10,15,46,0.08)'; e.currentTarget.style.borderColor = '#f59e0b' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                  >
                    {/* Thumbnail */}
                    <div style={{
                      width: '72px', height: '72px', borderRadius: '10px', flexShrink: 0,
                      background: '#f1f5f9', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {thumb
                        ? <img src={thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <span style={{ fontSize: '1.75rem' }}>{issue.categories?.icon || '📌'}</span>
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{ background: s.bg, color: s.color, padding: '0.15rem 0.6rem', borderRadius: '9999px', fontSize: '0.72rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
                          {issue.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span style={{ color: priorityColors[issue.priority] || '#f59e0b', fontSize: '0.72rem', fontWeight: 600 }}>
                          ● {issue.priority?.toUpperCase()}
                        </span>
                      </div>
                      <p style={{ fontWeight: 600, color: '#0a0f2e', fontSize: '0.95rem', marginBottom: '0.2rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {issue.title}
                      </p>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                        {issue.categories?.name || 'General'} · {issue.city || 'Location not set'} · {new Date(issue.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Upvotes + arrow */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                      {issue.upvotes > 0 && (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1rem' }}>👆</div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>{issue.upvotes}</div>
                        </div>
                      )}
                      <span style={{ color: '#cbd5e1', fontSize: '1.1rem' }}>→</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
