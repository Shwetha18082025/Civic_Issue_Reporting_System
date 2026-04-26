import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
// ADD these two imports at the top
import { useNavigate } from 'react-router-dom'  // ADD this

const STATUS_OPTIONS = ['pending', 'assigned', 'in_progress', 'resolved', 'rejected']

const STATUS_STYLE = {
  pending:     { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  assigned:    { bg: '#dbeafe', color: '#1e40af', label: 'Assigned' },
  in_progress: { bg: '#e0e7ff', color: '#3730a3', label: 'In Progress' },
  resolved:    { bg: '#dcfce7', color: '#166534', label: 'Resolved' },
  rejected:    { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
  duplicate:   { bg: '#f1f5f9', color: '#475569', label: 'Duplicate' },
}

const PRIORITY_STYLE = {
  low:      { color: '#16a34a', bg: '#dcfce7' },
  medium:   { color: '#d97706', bg: '#fef3c7' },
  high:     { color: '#dc2626', bg: '#fee2e2' },
  critical: { color: '#7c3aed', bg: '#ede9fe' },
}

const DEPARTMENTS = [
  'Roads & Infrastructure',
  'Sanitation & Waste',
  'Electrical & Street Lights',
  'Water & Sewage',
  'Parks & Environment',
  'General Administration',
]

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()

  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [filters, setFilters] = useState({ status: 'all', priority: 'all', category: 'all' })
  const [search, setSearch] = useState('')
  const [selectedIssue, setSelectedIssue] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [updateForm, setUpdateForm] = useState({ status: '', note: '', department: '' })
  const [successMsg, setSuccessMsg] = useState('')
  useEffect(() => { fetchIssues() }, [filters])
  const stats = {
    total:       issues.length,
    pending:     issues.filter(i => i.status === 'pending').length,
    in_progress: issues.filter(i => i.status === 'in_progress').length,
    resolved:    issues.filter(i => i.status === 'resolved').length,
  }
const navigate = useNavigate()

// ADD this block — redirect non-citizens away
useEffect(() => {
  if (profile && profile.role && ['admin', 'ngo', 'inspector'].includes(profile.role)) {
    navigate('/authority-dashboard')  // or wherever your authority page is
  }
}, [profile])

  useEffect(() => {
    if (user) fetchIssues()
  }, [user])

  async function fetchIssues() {
    setLoading(true)
    let query = supabase
      .from('issues')
      .select(`
        *,
        categories(name, icon),
        issue_images(image_url),
        reporter:profiles!issues_reported_by_fkey(full_name, phone)
      `)
      .order('created_at', { ascending: false })

    if (filters.status !== 'all')   query = query.eq('status', filters.status)
    if (filters.priority !== 'all') query = query.eq('priority', filters.priority)

    const { data, error } = await query
    if (error) { console.error(error); setLoading(false); return }

    const all = data || []
    setIssues(all)

    // Compute stats
    setStats({
      total:       all.length,
      pending:     all.filter(i => i.status === 'pending').length,
      in_progress: all.filter(i => i.status === 'in_progress').length,
      resolved:    all.filter(i => i.status === 'resolved').length,
      critical:    all.filter(i => i.priority === 'critical').length,
    })
    setLoading(false)
  }

  async function handleStatusUpdate() {
    if (!selectedIssue || !updateForm.status) return
    setActionLoading(true)

    const updates = { status: updateForm.status }
    if (updateForm.status === 'resolved') updates.resolved_at = new Date().toISOString()

    const { error } = await supabase
      .from('issues')
      .update(updates)
      .eq('id', selectedIssue.id)

    if (!error) {
      // Add audit log
      await supabase.from('audit_logs').insert({
        issue_id:   selectedIssue.id,
        changed_by: profile.id,
        old_status: selectedIssue.status,
        new_status: updateForm.status,
        note:       updateForm.note || null,
      })

      // Add comment if note provided
      if (updateForm.note) {
        await supabase.from('comments').insert({
          issue_id:   selectedIssue.id,
          user_id:    profile.id,
          content:    updateForm.note,
          is_official: true,
        })
      }

      // Notify the reporter
      await supabase.from('notifications').insert({
        user_id:  selectedIssue.reported_by,
        issue_id: selectedIssue.id,
        message:  `Your issue "${selectedIssue.title}" status changed to ${updateForm.status}.`,
        type:     'status_update',
      })

      setSuccessMsg(`Status updated to "${updateForm.status}" successfully!`)
      setTimeout(() => setSuccessMsg(''), 3000)
      setSelectedIssue(null)
      setUpdateForm({ status: '', note: '', department: '' })
      fetchIssues()
    }
    setActionLoading(false)
  }

  async function handleAssign() {
    if (!selectedIssue || !updateForm.department) return
    setActionLoading(true)

    const { error } = await supabase
      .from('issues')
      .update({ status: 'assigned', ward: updateForm.department })
      .eq('id', selectedIssue.id)

    if (!error) {
      await supabase.from('audit_logs').insert({
        issue_id:   selectedIssue.id,
        changed_by: profile.id,
        old_status: selectedIssue.status,
        new_status: 'assigned',
        note:       `Assigned to ${updateForm.department}`,
      })

      await supabase.from('notifications').insert({
        user_id:  selectedIssue.reported_by,
        issue_id: selectedIssue.id,
        message:  `Your issue "${selectedIssue.title}" has been assigned to ${updateForm.department}.`,
        type:     'assignment',
      })

      setSuccessMsg(`Issue assigned to ${updateForm.department}!`)
      setTimeout(() => setSuccessMsg(''), 3000)
      setSelectedIssue(null)
      setUpdateForm({ status: '', note: '', department: '' })
      fetchIssues()
    }
    setActionLoading(false)
  }

  // Filter by search
  const filtered = issues.filter(issue => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      issue.title?.toLowerCase().includes(q) ||
      issue.description?.toLowerCase().includes(q) ||
      issue.city?.toLowerCase().includes(q) ||
      issue.categories?.name?.toLowerCase().includes(q)
    )
  })

  const statCards = [
    { label: 'Total Issues',   value: stats.total,       color: '#0a0f2e', bg: '#f1f5f9', icon: '📋' },
    { label: 'Pending',        value: stats.pending,     color: '#92400e', bg: '#fef3c7', icon: '⏳' },
    { label: 'In Progress',    value: stats.in_progress, color: '#3730a3', bg: '#e0e7ff', icon: '🔧' },
    { label: 'Resolved',       value: stats.resolved,    color: '#166534', bg: '#dcfce7', icon: '✅' },
    { label: 'Critical',       value: stats.critical,    color: '#7c3aed', bg: '#ede9fe', icon: '🚨' },
  ]

  return (
    <div style={{ paddingTop: '68px', minHeight: '100vh', background: '#f8f9fc' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0a0f2e, #111a45)', padding: '2.5rem 1.5rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'Fraunces, serif', fontSize: '2rem', fontWeight: 700, color: 'white' }}>
              Officer Dashboard
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '0.25rem', fontSize: '0.9rem' }}>
              Welcome, {profile?.full_name} · {profile?.role}
            </p>
          </div>
          <div style={{
            background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: '9999px', padding: '0.4rem 1rem',
            color: '#fcd34d', fontSize: '0.8rem', fontWeight: 600,
          }}>
            🔒 Authority Access
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>

        {/* Success message */}
        {successMsg && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: '12px', padding: '0.85rem 1.25rem',
            color: '#166534', fontSize: '0.875rem', marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            ✅ {successMsg}
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
          {statCards.map(s => (
            <div key={s.label} style={{
              background: 'white', borderRadius: '16px', padding: '1.25rem',
              border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(10,15,46,0.04)',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{s.icon}</div>
              <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color }}>{s.value ?? '—'}</div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div style={{
          background: 'white', borderRadius: '16px', padding: '1.25rem 1.5rem',
          border: '1px solid #e2e8f0', marginBottom: '1.5rem',
          display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center',
        }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search issues..."
            style={{
              flex: 1, minWidth: '200px', border: '1.5px solid #e2e8f0',
              borderRadius: '8px', padding: '0.6rem 1rem', fontSize: '0.875rem',
              outline: 'none', fontFamily: 'DM Sans, sans-serif',
            }}
          />

          {/* Status filter */}
          <select
            value={filters.status}
            onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
            style={{
              border: '1.5px solid #e2e8f0', borderRadius: '8px',
              padding: '0.6rem 1rem', fontSize: '0.875rem',
              outline: 'none', cursor: 'pointer', background: 'white',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={filters.priority}
            onChange={e => setFilters(f => ({ ...f, priority: e.target.value }))}
            style={{
              border: '1.5px solid #e2e8f0', borderRadius: '8px',
              padding: '0.6rem 1rem', fontSize: '0.875rem',
              outline: 'none', cursor: 'pointer', background: 'white',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            <option value="all">All Priorities</option>
            {['low', 'medium', 'high', 'critical'].map(p => (
              <option key={p} value={p}>{p.toUpperCase()}</option>
            ))}
          </select>

          <span style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
            {filtered.length} issue{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Issues table */}
        <div style={{ background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>Loading issues...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#94a3b8' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
              <p>No issues found matching your filters.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', background: '#f8f9fc' }}>
                  {['Issue', 'Category', 'Location', 'Priority', 'Status', 'ML Category', 'Reported', 'Actions'].map(h => (
                    <th key={h} style={{
                      padding: '0.85rem 1rem', textAlign: 'left',
                      fontSize: '0.75rem', fontWeight: 700, color: '#475569',
                      textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((issue, idx) => {
                  const status = STATUS_STYLE[issue.status] || STATUS_STYLE.pending
                  const priority = PRIORITY_STYLE[issue.priority] || PRIORITY_STYLE.medium
                  const thumb = issue.issue_images?.[0]?.image_url

                  return (
                    <tr key={issue.id} style={{
                      borderBottom: '1px solid #f1f5f9',
                      background: idx % 2 === 0 ? 'white' : '#fafbfc',
                      transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = '#fffbeb'}
                      onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafbfc'}
                    >
                      {/* Issue title + thumb */}
                      <td style={{ padding: '0.85rem 1rem', maxWidth: '220px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {thumb ? (
                            <img src={thumb} alt="" style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div style={{
                              width: '40px', height: '40px', borderRadius: '8px',
                              background: '#f1f5f9', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0,
                            }}>
                              {issue.categories?.icon || '📌'}
                            </div>
                          )}
                          <div>
                            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0a0f2e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '150px' }}>
                              {issue.title}
                            </p>
                            <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                              by {issue.reporter?.full_name || 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                          {issue.categories?.icon} {issue.categories?.name}
                        </span>
                      </td>

                      {/* Location */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.82rem', color: '#475569' }}>
                          {issue.city || issue.ward || '—'}
                        </span>
                      </td>

                      {/* Priority */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          background: priority.bg, color: priority.color,
                          fontSize: '0.72rem', fontWeight: 700,
                          padding: '0.2rem 0.6rem', borderRadius: '9999px',
                          textTransform: 'uppercase',
                        }}>
                          {issue.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{
                          background: status.bg, color: status.color,
                          fontSize: '0.72rem', fontWeight: 600,
                          padding: '0.2rem 0.6rem', borderRadius: '9999px',
                        }}>
                          {status.label}
                        </span>
                      </td>

                      {/* ML Category */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        {issue.ml_category ? (
                          <div>
                            <span style={{ fontSize: '0.78rem', color: '#7c3aed', fontWeight: 600 }}>
                              🤖 {issue.ml_category.replace('_', ' ')}
                            </span>
                            {issue.ml_confidence && (
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.1rem' }}>
                                {(issue.ml_confidence * 100).toFixed(0)}% confidence
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>—</span>
                        )}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                          {new Date(issue.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '0.85rem 1rem' }}>
                        <button
                          onClick={() => {
                            setSelectedIssue(issue)
                            setUpdateForm({ status: issue.status, note: '', department: '' })
                          }}
                          style={{
                            background: '#0a0f2e', color: 'white',
                            border: 'none', borderRadius: '8px',
                            padding: '0.4rem 0.85rem', fontSize: '0.78rem',
                            fontWeight: 600, cursor: 'pointer',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => e.target.style.background = '#1a2760'}
                          onMouseLeave={e => e.target.style.background = '#0a0f2e'}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Issue Management Modal ── */}
      {selectedIssue && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(10,15,46,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 200, padding: '1rem',
        }}
          onClick={e => { if (e.target === e.currentTarget) setSelectedIssue(null) }}
        >
          <div style={{
            background: 'white', borderRadius: '20px', width: '100%', maxWidth: '600px',
            maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(10,15,46,0.25)',
          }}>
            {/* Modal header */}
            <div style={{
              background: 'linear-gradient(135deg, #0a0f2e, #111a45)',
              borderRadius: '20px 20px 0 0', padding: '1.5rem',
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            }}>
              <div>
                <h2 style={{ color: 'white', fontFamily: 'Fraunces, serif', fontSize: '1.25rem', fontWeight: 700 }}>
                  Manage Issue
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', marginTop: '0.25rem' }}>
                  {selectedIssue.categories?.icon} {selectedIssue.categories?.name}
                </p>
              </div>
              <button
                onClick={() => setSelectedIssue(null)}
                style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none',
                  color: 'white', borderRadius: '8px', padding: '0.4rem 0.75rem',
                  cursor: 'pointer', fontSize: '1rem',
                }}
              >✕</button>
            </div>

            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* Issue details */}
              <div style={{ background: '#f8f9fc', borderRadius: '12px', padding: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0a0f2e', marginBottom: '0.5rem' }}>
                  {selectedIssue.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.6 }}>
                  {selectedIssue.description}
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{
                    background: STATUS_STYLE[selectedIssue.status]?.bg,
                    color: STATUS_STYLE[selectedIssue.status]?.color,
                    fontSize: '0.72rem', fontWeight: 600,
                    padding: '0.2rem 0.6rem', borderRadius: '9999px',
                  }}>
                    {STATUS_STYLE[selectedIssue.status]?.label}
                  </span>
                  <span style={{
                    background: PRIORITY_STYLE[selectedIssue.priority]?.bg,
                    color: PRIORITY_STYLE[selectedIssue.priority]?.color,
                    fontSize: '0.72rem', fontWeight: 600,
                    padding: '0.2rem 0.6rem', borderRadius: '9999px',
                  }}>
                    {selectedIssue.priority?.toUpperCase()} PRIORITY
                  </span>
                  {selectedIssue.ml_category && (
                    <span style={{
                      background: '#ede9fe', color: '#7c3aed',
                      fontSize: '0.72rem', fontWeight: 600,
                      padding: '0.2rem 0.6rem', borderRadius: '9999px',
                    }}>
                      🤖 AI: {selectedIssue.ml_category.replace('_', ' ')}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.75rem' }}>
                  📍 {selectedIssue.address || selectedIssue.city || 'Location not specified'}
                  {' · '}Reported by {selectedIssue.reporter?.full_name || 'Unknown'}
                  {selectedIssue.reporter?.phone && ` · 📞 ${selectedIssue.reporter.phone}`}
                </p>
              </div>

              {/* Issue image if any */}
              {selectedIssue.issue_images?.[0]?.image_url && (
                <img
                  src={selectedIssue.issue_images[0].image_url}
                  alt="Issue"
                  style={{ width: '100%', borderRadius: '12px', maxHeight: '200px', objectFit: 'cover' }}
                />
              )}

              {/* Divider */}
              <div style={{ borderTop: '1px solid #f1f5f9' }} />

              {/* Assign to department */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#0a0f2e', marginBottom: '0.5rem' }}>
                  Assign to Department
                </label>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <select
                    value={updateForm.department}
                    onChange={e => setUpdateForm(f => ({ ...f, department: e.target.value }))}
                    style={{
                      flex: 1, border: '1.5px solid #e2e8f0', borderRadius: '10px',
                      padding: '0.7rem 1rem', fontSize: '0.875rem',
                      outline: 'none', background: 'white', fontFamily: 'DM Sans, sans-serif',
                    }}
                  >
                    <option value="">Select department...</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <button
                    onClick={handleAssign}
                    disabled={!updateForm.department || actionLoading}
                    style={{
                      background: updateForm.department ? '#0a0f2e' : '#e2e8f0',
                      color: updateForm.department ? 'white' : '#94a3b8',
                      border: 'none', borderRadius: '10px',
                      padding: '0.7rem 1.25rem', fontSize: '0.875rem',
                      fontWeight: 600, cursor: updateForm.department ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Assign
                  </button>
                </div>
              </div>

              {/* Update status */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#0a0f2e', marginBottom: '0.5rem' }}>
                  Update Status
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {STATUS_OPTIONS.map(s => (
                      <button
                        key={s}
                        onClick={() => setUpdateForm(f => ({ ...f, status: s }))}
                        style={{
                          padding: '0.45rem 0.9rem',
                          background: updateForm.status === s ? '#0a0f2e' : '#f1f5f9',
                          color: updateForm.status === s ? 'white' : '#475569',
                          border: updateForm.status === s ? '2px solid #0a0f2e' : '2px solid transparent',
                          borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.15s',
                          fontFamily: 'DM Sans, sans-serif',
                        }}
                      >
                        {s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>

                  <textarea
                    value={updateForm.note}
                    onChange={e => setUpdateForm(f => ({ ...f, note: e.target.value }))}
                    placeholder="Add a note (optional) — this will be visible as an official comment..."
                    style={{
                      width: '100%', border: '1.5px solid #e2e8f0', borderRadius: '10px',
                      padding: '0.75rem 1rem', fontSize: '0.875rem', resize: 'vertical',
                      minHeight: '80px', outline: 'none', fontFamily: 'DM Sans, sans-serif',
                      boxSizing: 'border-box',
                    }}
                  />

                  <button
                    onClick={handleStatusUpdate}
                    disabled={!updateForm.status || actionLoading}
                    style={{
                      width: '100%', padding: '0.85rem',
                      background: updateForm.status ? '#f59e0b' : '#e2e8f0',
                      color: updateForm.status ? '#0a0f2e' : '#94a3b8',
                      border: 'none', borderRadius: '10px',
                      fontSize: '0.95rem', fontWeight: 700,
                      cursor: updateForm.status ? 'pointer' : 'not-allowed',
                    }}
                  >
                    {actionLoading ? '⏳ Updating...' : '✅ Update Issue Status'}
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  )
}
