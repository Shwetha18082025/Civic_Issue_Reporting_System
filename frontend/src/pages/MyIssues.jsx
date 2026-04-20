import { useEffect, useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const statusColors = {
  pending:     { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  assigned:    { bg: '#dbeafe', color: '#1e40af', label: 'Assigned' },
  in_progress: { bg: '#e0e7ff', color: '#3730a3', label: 'In Progress' },
  resolved:    { bg: '#dcfce7', color: '#166534', label: 'Resolved' },
  rejected:    { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
  duplicate:   { bg: '#f1f5f9', color: '#475569', label: 'Duplicate' },
}

const priorityColors = {
  low:      '#22c55e',
  medium:   '#f59e0b',
  high:     '#ef4444',
  critical: '#7c3aed',
}

export default function MyIssues() {
  const { user } = useAuth()
  const location = useLocation()
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const successMsg = location.state?.success

  useEffect(() => {
    if (!user) return
    supabase
      .from('issues')
      .select(`*, categories(name, icon), issue_images(image_url)`)
      .eq('reported_by', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setIssues(data || [])
        setLoading(false)
      })
  }, [user])

  if (loading) return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#64748b', fontSize: '1rem' }}>Loading your issues...</p>
    </div>
  )

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: '#f8f9fc' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0a0f2e, #111a45)', padding: '3rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 700, color: 'white' }}>My Issues</h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem' }}>{issues.length} issue{issues.length !== 1 ? 's' : ''} reported</p>
          </div>
          <Link to="/report" style={{
            background: '#f59e0b', color: '#0a0f2e',
            padding: '0.65rem 1.5rem', borderRadius: '9999px',
            textDecoration: 'none', fontWeight: 700, fontSize: '0.9rem',
          }}>
            + Report New
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1.5rem 4rem' }}>

        {/* Success message */}
        {successMsg && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: '12px', padding: '1rem 1.25rem',
            color: '#166534', fontSize: '0.9rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            ✅ {successMsg}
          </div>
        )}

        {/* Empty state */}
        {issues.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 1rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📋</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0a0f2e', marginBottom: '0.5rem' }}>No issues yet</h2>
            <p style={{ color: '#64748b', marginBottom: '2rem' }}>Be the first to report a civic issue in your area.</p>
            <Link to="/report" style={{
              background: '#f59e0b', color: '#0a0f2e',
              padding: '0.75rem 2rem', borderRadius: '9999px',
              textDecoration: 'none', fontWeight: 700,
            }}>
              Report Your First Issue →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {issues.map(issue => {
              const status = statusColors[issue.status] || statusColors.pending
              const thumb = issue.issue_images?.[0]?.image_url
              return (
                <Link
                  key={issue.id}
                  to={`/issues/${issue.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{
                    background: 'white', borderRadius: '16px',
                    border: '1px solid #e2e8f0', padding: '1.25rem 1.5rem',
                    display: 'flex', gap: '1rem', alignItems: 'flex-start',
                    transition: 'all 0.2s', cursor: 'pointer',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(10,15,46,0.08)'; e.currentTarget.style.borderColor = '#f59e0b' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                  >
                    {/* Thumbnail */}
                    {thumb ? (
                      <img src={thumb} alt="" style={{ width: '72px', height: '72px', objectFit: 'cover', borderRadius: '10px', flexShrink: 0 }} />
                    ) : (
                      <div style={{
                        width: '72px', height: '72px', borderRadius: '10px',
                        background: '#f1f5f9', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '1.75rem', flexShrink: 0,
                      }}>
                        {issue.categories?.icon || '📌'}
                      </div>
                    )}

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                        <span style={{
                          background: status.bg, color: status.color,
                          fontSize: '0.75rem', fontWeight: 600,
                          padding: '0.2rem 0.6rem', borderRadius: '9999px',
                        }}>
                          {status.label}
                        </span>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: priorityColors[issue.priority], display: 'inline-block' }} />
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'capitalize' }}>{issue.priority}</span>
                      </div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0a0f2e', marginBottom: '0.25rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {issue.title}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: '#64748b' }}>
                        {issue.categories?.name} · {issue.city || issue.ward || 'Location not set'} · {new Date(issue.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <div style={{ color: '#cbd5e1', fontSize: '1.2rem', flexShrink: 0 }}>→</div>
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