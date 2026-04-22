import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const statusColors = {
  pending:     { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  in_progress: { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6' },
  resolved:    { bg: '#dcfce7', color: '#166534', dot: '#22c55e' },
  rejected:    { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
}

const priorityColors = {
  low:      { bg: '#f1f5f9', color: '#475569' },
  medium:   { bg: '#fef3c7', color: '#92400e' },
  high:     { bg: '#ffedd5', color: '#9a3412' },
  critical: { bg: '#fee2e2', color: '#991b1b' },
}

export default function IssueDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [issue, setIssue]       = useState(null)
  const [images, setImages]     = useState([])
  const [category, setCategory] = useState(null)
  const [reporter, setReporter] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [activeImg, setActiveImg] = useState(0)
  const [upvoted, setUpvoted]   = useState(false)
  const [upvoteCount, setUpvoteCount] = useState(0)

  useEffect(() => {
    if (id) fetchIssue()
  }, [id])

  async function fetchIssue() {
    setLoading(true)
    try {
      const { data: issueData, error } = await supabase
        .from('issues')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !issueData) { navigate('/my-issues'); return }
      setIssue(issueData)
      setUpvoteCount(issueData.upvotes || 0)

      // Fetch related data in parallel
      const [imagesRes, categoryRes, reporterRes] = await Promise.all([
        supabase.from('issue_images').select('*').eq('issue_id', id),
        issueData.category_id
          ? supabase.from('categories').select('*').eq('id', issueData.category_id).single()
          : Promise.resolve({ data: null }),
        issueData.reported_by
          ? supabase.from('profiles').select('full_name, email').eq('id', issueData.reported_by).single()
          : Promise.resolve({ data: null }),
      ])

      if (imagesRes.data) setImages(imagesRes.data)
      if (categoryRes.data) setCategory(categoryRes.data)
      if (reporterRes.data) setReporter(reporterRes.data)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function handleUpvote() {
    if (!user || upvoted) return
    setUpvoted(true)
    setUpvoteCount(c => c + 1)
    await supabase.from('issues').update({ upvotes: upvoteCount + 1 }).eq('id', id)
  }

  if (loading) return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: '#f8f9fc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#64748b' }}>Loading issue...</p>
      </div>
    </div>
  )

  if (!issue) return null

  const status   = statusColors[issue.status]  || statusColors.pending
  const priority = priorityColors[issue.priority] || priorityColors.medium
  const isOwner  = user?.id === issue.reported_by

  const allImages = images.map(i => i.image_url)

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: '#f8f9fc' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0a0f2e, #111a45)', padding: '2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <Link to="/my-issues" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.25rem' }}>
            ← Back to My Issues
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ background: status.bg, color: status.color, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: status.dot, display: 'inline-block' }} />
                  {issue.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span style={{ background: priority.bg, color: priority.color, padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 600 }}>
                  {issue.priority?.toUpperCase()} Priority
                </span>
                {category && (
                  <span style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.78rem' }}>
                    {category.icon} {category.name}
                  </span>
                )}
              </div>
              <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 700, color: 'white', marginBottom: '0.4rem', lineHeight: 1.2 }}>
                {issue.title}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.85rem' }}>
                📍 {issue.address || issue.city || 'Location not specified'} · {new Date(issue.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>

            {/* Upvote */}
            <button
              onClick={handleUpvote}
              disabled={!user || upvoted}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                background: upvoted ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.08)',
                border: upvoted ? '1.5px solid rgba(245,158,11,0.5)' : '1.5px solid rgba(255,255,255,0.15)',
                borderRadius: '12px', padding: '0.75rem 1.25rem',
                cursor: user && !upvoted ? 'pointer' : 'default',
                transition: 'all 0.2s', minWidth: '72px',
              }}
            >
              <span style={{ fontSize: '1.4rem' }}>👆</span>
              <span style={{ color: upvoted ? '#f59e0b' : 'white', fontWeight: 700, fontSize: '1.1rem' }}>{upvoteCount}</span>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>upvotes</span>
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1.5rem 4rem', display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Images */}
          {allImages.length > 0 && (
            <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <img
                src={allImages[activeImg]}
                alt="Issue"
                style={{ width: '100%', height: '320px', objectFit: 'cover', display: 'block' }}
              />
              {allImages.length > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem' }}>
                  {allImages.map((src, i) => (
                    <img
                      key={i} src={src} alt={`thumb-${i}`}
                      onClick={() => setActiveImg(i)}
                      style={{
                        width: '64px', height: '64px', objectFit: 'cover', borderRadius: '8px',
                        cursor: 'pointer', border: i === activeImg ? '2.5px solid #f59e0b' : '2px solid #e2e8f0',
                        transition: 'border-color 0.2s',
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.75rem' }}>Description</h3>
            <p style={{ color: '#334155', lineHeight: 1.75, fontSize: '0.95rem' }}>{issue.description}</p>
          </div>

          {/* ML Analysis */}
          {issue.ml_category && (
            <div style={{ background: 'linear-gradient(135deg, #0a0f2e08, #111a4514)', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>🤖 AI Analysis</h3>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Detected Category</p>
                  <p style={{ fontWeight: 600, color: '#0a0f2e', textTransform: 'capitalize' }}>{issue.ml_category.replace('_', ' ')}</p>
                </div>
                <div style={{ flex: 1, minWidth: '140px' }}>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.25rem' }}>Confidence</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.round((issue.ml_confidence || 0) * 100)}%`, background: '#f59e0b', borderRadius: '9999px' }} />
                    </div>
                    <span style={{ fontWeight: 600, color: '#0a0f2e', fontSize: '0.9rem' }}>{Math.round((issue.ml_confidence || 0) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right column — meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Status timeline */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1.25rem' }}>Status Timeline</h3>
            {[
              { label: 'Reported', done: true,  date: issue.created_at },
              { label: 'Under Review', done: ['in_progress','resolved'].includes(issue.status), date: null },
              { label: 'In Progress', done: ['in_progress','resolved'].includes(issue.status), date: null },
              { label: 'Resolved', done: issue.status === 'resolved', date: issue.resolved_at },
            ].map((step, i) => (
              <div key={step.label} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: i < 3 ? '1rem' : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    background: step.done ? '#f59e0b' : '#e2e8f0',
                    border: step.done ? '2px solid #f59e0b' : '2px solid #e2e8f0',
                    flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.6rem', color: step.done ? '#0a0f2e' : 'transparent',
                    fontWeight: 700,
                  }}>✓</div>
                  {i < 3 && <div style={{ width: '2px', height: '24px', background: step.done ? '#fcd34d' : '#e2e8f0', marginTop: '2px' }} />}
                </div>
                <div style={{ paddingTop: '1px' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: step.done ? '#0a0f2e' : '#94a3b8' }}>{step.label}</p>
                  {step.date && <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{new Date(step.date).toLocaleDateString('en-IN')}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Details card */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1rem' }}>Details</h3>
            {[
              { label: 'Reported by', value: reporter?.full_name || 'Anonymous' },
              { label: 'City', value: issue.city || '—' },
              { label: 'Ward / Area', value: issue.ward || '—' },
              { label: 'Coordinates', value: issue.latitude ? `${Number(issue.latitude).toFixed(4)}, ${Number(issue.longitude).toFixed(4)}` : '—' },
              { label: 'Issue ID', value: issue.id?.slice(0, 8) + '...' },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{row.label}</span>
                <span style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 500, textAlign: 'right', maxWidth: '160px' }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Map link */}
          {issue.latitude && issue.longitude && (
            <a
              href={`https://maps.google.com/?q=${issue.latitude},${issue.longitude}`}
              target="_blank" rel="noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: '#0a0f2e', color: 'white', borderRadius: '10px',
                padding: '0.75rem', fontSize: '0.875rem', fontWeight: 600,
                textDecoration: 'none', transition: 'opacity 0.2s',
              }}
            >
              🗺️ View on Google Maps
            </a>
          )}

          {isOwner && (
            <Link
              to="/report"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                background: 'white', color: '#475569', border: '1.5px solid #e2e8f0',
                borderRadius: '10px', padding: '0.75rem', fontSize: '0.875rem',
                fontWeight: 600, textDecoration: 'none',
              }}
            >
              + Report Another Issue
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
