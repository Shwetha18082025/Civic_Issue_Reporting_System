import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const STATUS_STYLE = {
  pending:     { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  assigned:    { bg: '#dbeafe', color: '#1e40af', label: 'Assigned' },
  in_progress: { bg: '#e0e7ff', color: '#3730a3', label: 'In Progress' },
  resolved:    { bg: '#dcfce7', color: '#166534', label: 'Resolved' },
  rejected:    { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
}

const PRIORITY_STYLE = {
  low:      { color: '#16a34a', bg: '#dcfce7' },
  medium:   { color: '#d97706', bg: '#fef3c7' },
  high:     { color: '#dc2626', bg: '#fee2e2' },
  critical: { color: '#7c3aed', bg: '#ede9fe' },
}

const STATUSES = ['pending', 'assigned', 'in_progress', 'resolved']

export default function IssueDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()

  const [issue, setIssue] = useState(null)
  const [images, setImages] = useState([])
  const [comments, setComments] = useState([])
  const [hasUpvoted, setHasUpvoted] = useState(false)
  const [upvoteCount, setUpvoteCount] = useState(0)
  const [upvoteLoading, setUpvoteLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    fetchIssue()
    fetchComments()
    if (user) checkUpvote()
  }, [id, user])

  async function fetchIssue() {
    const { data } = await supabase
      .from('issues')
      .select('*, categories(name, icon), issue_images(image_url), reporter:profiles!issues_reported_by_fkey(full_name)')
      .eq('id', id)
      .single()

    if (data) {
      setIssue(data)
      setImages(data.issue_images || [])
      setUpvoteCount(data.upvotes || 0)
    }
    setLoading(false)
  }

  async function fetchComments() {
    const { data } = await supabase
      .from('comments')
      .select('*, profiles(full_name, role)')
      .eq('issue_id', id)
      .order('created_at', { ascending: true })
    setComments(data || [])
  }

  async function checkUpvote() {
    if (!user) return
    const { data } = await supabase
      .from('upvotes')
      .select('id')
      .eq('issue_id', id)
      .eq('user_id', user.id)
      .single()
    setHasUpvoted(!!data)
  }

  async function handleUpvote() {
    if (!user) { navigate('/login'); return }
    setUpvoteLoading(true)

    if (hasUpvoted) {
      await supabase.from('upvotes').delete().eq('issue_id', id).eq('user_id', user.id)
      await supabase.from('issues').update({ upvotes: upvoteCount - 1 }).eq('id', id)
      setUpvoteCount(c => c - 1)
      setHasUpvoted(false)
    } else {
      await supabase.from('upvotes').insert({ issue_id: id, user_id: user.id })
      await supabase.from('issues').update({ upvotes: upvoteCount + 1 }).eq('id', id)
      setUpvoteCount(c => c + 1)
      setHasUpvoted(true)
    }
    setUpvoteLoading(false)
  }

  async function handleComment() {
    if (!newComment.trim() || !user) return
    setCommentLoading(true)
    await supabase.from('comments').insert({
      issue_id:    id,
      user_id:     user.id,
      content:     newComment.trim(),
      is_official: profile?.role !== 'citizen',
    })
    setNewComment('')
    fetchComments()
    setCommentLoading(false)
  }

  if (loading) {
    return (
      <div style={{ paddingTop: '68px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Loading issue...</p>
      </div>
    )
  }

  if (!issue) {
    return (
      <div style={{ paddingTop: '68px', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>😕</div>
          <p style={{ color: '#64748b', marginTop: '1rem' }}>Issue not found.</p>
          <Link to="/" style={{ color: '#f59e0b', fontWeight: 600 }}>Go Home</Link>
        </div>
      </div>
    )
  }

  const status   = STATUS_STYLE[issue.status]    || STATUS_STYLE.pending
  const priority = PRIORITY_STYLE[issue.priority] || PRIORITY_STYLE.medium

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: '#f8f9fc' }}>

      {/* ── Header ── */}
      <div style={{ background: 'linear-gradient(135deg, #0a0f2e, #111a45)', padding: '2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>

          <Link
            to="/my-issues"
            style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-block', marginBottom: '1rem' }}
          >
            ← Back to My Issues
          </Link>

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <span style={{ background: status.bg, color: status.color, fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '9999px' }}>
                  {status.label}
                </span>
                <span style={{ background: priority.bg, color: priority.color, fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '9999px' }}>
                  {issue.priority ? issue.priority.toUpperCase() : 'MEDIUM'} PRIORITY
                </span>
                {issue.ml_category && (
                  <span style={{ background: 'rgba(124,58,237,0.15)', color: '#c4b5fd', fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '9999px' }}>
                    🤖 AI: {issue.ml_category.replace('_', ' ')}
                  </span>
                )}
              </div>

              <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', fontWeight: 700, color: 'white', marginBottom: '0.5rem' }}>
                {issue.title}
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                {issue.categories ? issue.categories.icon : ''} {issue.categories ? issue.categories.name : ''}
                {' · '}Reported by {issue.reporter ? issue.reporter.full_name : 'Anonymous'}
                {' · '}{new Date(issue.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Upvote button */}
            <button
              onClick={handleUpvote}
              disabled={upvoteLoading}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '0.25rem', padding: '0.75rem 1.25rem',
                background: hasUpvoted ? '#f59e0b' : 'rgba(255,255,255,0.08)',
                border: hasUpvoted ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.2)',
                borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s',
                minWidth: '70px', flexShrink: 0,
              }}
            >
              <span style={{ fontSize: '1.5rem' }}>{hasUpvoted ? '👍' : '👆'}</span>
              <span style={{ color: hasUpvoted ? '#0a0f2e' : 'white', fontWeight: 700, fontSize: '1.1rem' }}>
                {upvoteCount}
              </span>
              <span style={{ color: hasUpvoted ? '#0a0f2e' : 'rgba(255,255,255,0.6)', fontSize: '0.7rem', fontWeight: 500 }}>
                {hasUpvoted ? 'Upvoted' : 'Upvote'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '0 1.5rem 4rem', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.5rem' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>

          {/* Photos */}
          {images.length > 0 && (
            <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                Photos
              </h2>
              <img
                src={images[activeImage].image_url}
                alt="Issue"
                style={{ width: '100%', borderRadius: '12px', maxHeight: '320px', objectFit: 'cover' }}
              />
              {images.length > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                  {images.map((img, i) => (
                    <img
                      key={i}
                      src={img.image_url}
                      alt=""
                      onClick={() => setActiveImage(i)}
                      style={{
                        width: '60px', height: '60px', objectFit: 'cover',
                        borderRadius: '8px', cursor: 'pointer',
                        border: activeImage === i ? '2px solid #f59e0b' : '2px solid transparent',
                        opacity: activeImage === i ? 1 : 0.6,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              Description
            </h2>
            <p style={{ color: '#334155', lineHeight: 1.7, fontSize: '0.95rem', margin: 0 }}>
              {issue.description}
            </p>
          </div>

          {/* Comments */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.5rem', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1.25rem' }}>
              Comments ({comments.length})
            </h2>

            {comments.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center', padding: '1rem 0' }}>
                No comments yet.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
                {comments.map(comment => (
                  <div
                    key={comment.id}
                    style={{
                      background: comment.is_official ? '#eff6ff' : '#f8f9fc',
                      border: comment.is_official ? '1px solid #bfdbfe' : '1px solid #e2e8f0',
                      borderRadius: '12px', padding: '1rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        background: comment.is_official ? '#1e40af' : '#0a0f2e',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '0.75rem', fontWeight: 700,
                      }}>
                        {comment.profiles && comment.profiles.full_name ? comment.profiles.full_name[0].toUpperCase() : 'U'}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0a0f2e' }}>
                        {comment.profiles ? comment.profiles.full_name : 'User'}
                      </span>
                      {comment.is_official && (
                        <span style={{ background: '#1e40af', color: 'white', fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '9999px' }}>
                          OFFICIAL
                        </span>
                      )}
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginLeft: 'auto' }}>
                        {new Date(comment.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <p style={{ color: '#334155', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                      {comment.content}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment */}
            {user ? (
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  style={{
                    flex: 1, border: '1.5px solid #e2e8f0', borderRadius: '10px',
                    padding: '0.75rem 1rem', fontSize: '0.875rem', resize: 'none',
                    minHeight: '60px', outline: 'none', fontFamily: 'DM Sans, sans-serif',
                    boxSizing: 'border-box',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#f59e0b' }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0' }}
                />
                <button
                  onClick={handleComment}
                  disabled={!newComment.trim() || commentLoading}
                  style={{
                    background: newComment.trim() ? '#f59e0b' : '#e2e8f0',
                    color: newComment.trim() ? '#0a0f2e' : '#94a3b8',
                    border: 'none', borderRadius: '10px',
                    padding: '0 1.25rem', fontWeight: 700,
                    cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                    fontSize: '0.875rem', alignSelf: 'flex-end', height: '42px',
                    flexShrink: 0,
                  }}
                >
                  {commentLoading ? '...' : 'Post'}
                </button>
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '0.875rem', textAlign: 'center' }}>
                <Link to="/login" style={{ color: '#f59e0b', fontWeight: 600 }}>Sign in</Link> to comment
              </p>
            )}
          </div>
        </div>

        {/* ── Right Sidebar ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Details card */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              Details
            </h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Reported by</span>
              <span style={{ fontSize: '0.8rem', color: '#0a0f2e', fontWeight: 600 }}>{issue.reporter ? issue.reporter.full_name : 'Anonymous'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>City</span>
              <span style={{ fontSize: '0.8rem', color: '#0a0f2e', fontWeight: 600 }}>{issue.city || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Ward / Area</span>
              <span style={{ fontSize: '0.8rem', color: '#0a0f2e', fontWeight: 600 }}>{issue.ward || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Coordinates</span>
              <span style={{ fontSize: '0.8rem', color: '#0a0f2e', fontWeight: 600 }}>
                {issue.latitude ? (issue.latitude.toFixed(4) + ', ' + issue.longitude.toFixed(4)) : '—'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>Issue ID</span>
              <span style={{ fontSize: '0.8rem', color: '#0a0f2e', fontWeight: 600 }}>{issue.id ? issue.id.slice(0, 8) + '...' : '—'}</span>
            </div>
            {issue.latitude && (
              <a
                href={'https://maps.google.com/?q=' + issue.latitude + ',' + issue.longitude}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'block', marginTop: '1rem', textAlign: 'center',
                  background: '#f8f9fc', border: '1px solid #e2e8f0',
                  borderRadius: '8px', padding: '0.6rem',
                  color: '#0a0f2e', textDecoration: 'none',
                  fontSize: '0.82rem', fontWeight: 600,
                }}
              >
                🗺️ View on Google Maps
              </a>
            )}
          </div>

          {/* AI Analysis card */}
          {issue.ml_category && (
            <div style={{ background: 'linear-gradient(135deg, #faf5ff, #ede9fe)', borderRadius: '16px', padding: '1.25rem', border: '1px solid #ddd6fe' }}>
              <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                🤖 AI Analysis
              </h2>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e9d5ff' }}>
                <span style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 500 }}>Detected Category</span>
                <span style={{ fontSize: '0.8rem', color: '#4c1d95', fontWeight: 700 }}>{issue.ml_category.replace('_', ' ')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0' }}>
                <span style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: 500 }}>Confidence</span>
                <span style={{ fontSize: '0.8rem', color: '#4c1d95', fontWeight: 700 }}>
                  {issue.ml_confidence ? (issue.ml_confidence * 100).toFixed(0) + '%' : '—'}
                </span>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          <div style={{ background: 'white', borderRadius: '16px', padding: '1.25rem', border: '1px solid #e2e8f0' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              Status Timeline
            </h2>
            {STATUSES.map((s, i) => {
              const currentIdx = STATUSES.indexOf(issue.status)
              const isDone     = i <= currentIdx
              const isCurrent  = s === issue.status
              const label      = s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)
              return (
                <div key={s} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginBottom: i < STATUSES.length - 1 ? '0.5rem' : 0 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                    <div style={{
                      width: '20px', height: '20px', borderRadius: '50%',
                      background: isDone ? '#f59e0b' : '#e2e8f0',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.6rem', color: isDone ? '#0a0f2e' : '#94a3b8', fontWeight: 700,
                    }}>
                      {isDone ? '✓' : ''}
                    </div>
                    {i < STATUSES.length - 1 && (
                      <div style={{ width: '2px', height: '20px', background: isDone && i < currentIdx ? '#f59e0b' : '#e2e8f0' }} />
                    )}
                  </div>
                  <p style={{ fontSize: '0.8rem', fontWeight: isCurrent ? 700 : 400, color: isCurrent ? '#0a0f2e' : '#94a3b8', margin: '2px 0 0 0' }}>
                    {label}
                  </p>
                </div>
              )
            })}
          </div>

        </div>
      </div>
    </div>
  )
}
