import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend
} from 'recharts'

const statusColors = {
  pending:     { bg: '#fef3c7', color: '#92400e', dot: '#f59e0b', label: 'Pending' },
  assigned:    { bg: '#e0e7ff', color: '#3730a3', dot: '#6366f1', label: 'Assigned' },
  in_progress: { bg: '#dbeafe', color: '#1e40af', dot: '#3b82f6', label: 'In Progress' },
  resolved:    { bg: '#d1fae5', color: '#065f46', dot: '#10b981', label: 'Resolved' },
  rejected:    { bg: '#fee2e2', color: '#991b1b', dot: '#ef4444', label: 'Rejected' },
}

const priorityColors = {
  low:      { bg: '#f0fdf4', color: '#166534' },
  medium:   { bg: '#fefce8', color: '#854d0e' },
  high:     { bg: '#fff7ed', color: '#9a3412' },
  critical: { bg: '#fef2f2', color: '#991b1b' },
}

const CHART_COLORS = ['#6366f1','#f59e0b','#3b82f6','#10b981','#ef4444','#8b5cf6','#ec4899','#14b8a6']

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div style={{
      position:'fixed',bottom:24,right:24,zIndex:9999,
      background:type==='error'?'#fee2e2':'#d1fae5',
      color:type==='error'?'#991b1b':'#065f46',
      border:`1px solid ${type==='error'?'#fca5a5':'#6ee7b7'}`,
      borderRadius:10,padding:'12px 20px',fontFamily:'sans-serif',
      fontWeight:500,fontSize:14,boxShadow:'0 4px 20px rgba(0,0,0,0.1)',
      display:'flex',alignItems:'center',gap:10,maxWidth:360,
    }}>
      <span>{type==='error'?'✗':'✓'}</span>{message}
    </div>
  )
}

export default function AuthorityDashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const [issues, setIssues]           = useState([])
  const [categories, setCategories]   = useState([])
  const [officers, setOfficers]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [selectedIssue, setSelected]  = useState(null)
  const [newStatus, setNewStatus]     = useState('')
  const [assignTo, setAssignTo]       = useState('')
  const [updatingStatus, setUpdating] = useState(false)
  const [toast, setToast]             = useState(null)
  const [activeTab, setActiveTab]     = useState('issues')

  const [search, setSearch]        = useState('')
  const [filterStatus, setFStatus] = useState('all')
  const [filterCat, setFCat]       = useState('all')
  const [filterWard, setFWard]     = useState('all')
  const [filterPriority, setFPri]  = useState('all')

  const showToast = (msg, type='success') => setToast({ message: msg, type })

  useEffect(() => {
    if (profile && profile.role !== 'admin') navigate('/login')
  }, [profile, navigate])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [{ data: issuesData, error: ie }, { data: catsData }, { data: officersData }] =
        await Promise.all([
          supabase.from('issues').select(`
            id, title, description, status, priority, ward, city, address,
            category_id, reported_by, assigned_to, upvotes, created_at, updated_at,
            latitude, longitude, ml_category, ml_confidence,
            categories(name, icon), issue_images(image_url)
          `).order('created_at', { ascending: false }),
          supabase.from('categories').select('*'),
          supabase.from('profiles').select('id, full_name, role').eq('role', 'admin'),
        ])
      if (ie) showToast('Failed to load: ' + ie.message, 'error')
      setIssues(issuesData || [])
      setCategories(catsData || [])
      setOfficers(officersData || [])
    } catch(e) {
      showToast('Error: ' + e.message, 'error')
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  async function handleUpdateIssue() {
    if (!selectedIssue) return
    setUpdating(true)
    try {
      const payload = {
        status: newStatus,
        assigned_to: assignTo || null,
        updated_at: new Date().toISOString(),
      }
      if (newStatus === 'resolved') payload.resolved_at = new Date().toISOString()
      const { error } = await supabase.from('issues').update(payload).eq('id', selectedIssue.id)
      if (error) throw error
      showToast('Issue updated!')
      await fetchAll()
      closeModal()
    } catch(e) { showToast(e.message, 'error') }
    setUpdating(false)
  }

  function openModal(issue) { setSelected(issue); setNewStatus(issue.status); setAssignTo(issue.assigned_to || '') }
  function closeModal() { setSelected(null); setNewStatus(''); setAssignTo('') }

  const wards = [...new Set(issues.map(i => i.ward).filter(Boolean))]
  const filtered = issues.filter(i => {
    const ms = !search || [i.title, i.description, i.address].some(f => f?.toLowerCase().includes(search.toLowerCase()))
    return ms &&
      (filterStatus === 'all' || i.status === filterStatus) &&
      (filterCat === 'all' || String(i.category_id) === filterCat) &&
      (filterWard === 'all' || i.ward === filterWard) &&
      (filterPriority === 'all' || i.priority === filterPriority)
  })

  const stats = {
    total:       issues.length,
    pending:     issues.filter(i => i.status === 'pending').length,
    in_progress: issues.filter(i => i.status === 'in_progress').length,
    resolved:    issues.filter(i => i.status === 'resolved').length,
    critical:    issues.filter(i => i.priority === 'critical').length,
  }
  const resRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0

  const categoryChartData = categories.map(cat => ({
    name: cat.name,
    count: issues.filter(i => i.category_id === cat.id).length,
  })).filter(d => d.count > 0).sort((a,b) => b.count - a.count)

  const statusChartData = Object.entries(statusColors).map(([k,v]) => ({
    name: v.label,
    value: issues.filter(i => i.status === k).length,
    color: v.dot,
  })).filter(d => d.value > 0)

  const wardChartData = wards.map(ward => ({
    ward,
    total:    issues.filter(i => i.ward === ward).length,
    resolved: issues.filter(i => i.ward === ward && i.status === 'resolved').length,
    pending:  issues.filter(i => i.ward === ward && i.status === 'pending').length,
  })).sort((a,b) => b.total - a.total).slice(0, 8)

  const monthlyChartData = (() => {
    const m = {}
    issues.forEach(issue => {
      const key = new Date(issue.created_at).toLocaleString('en-IN', { month: 'short', year: '2-digit' })
      m[key] = (m[key] || 0) + 1
    })
    return Object.entries(m).map(([month, count]) => ({ month, count })).slice(-6)
  })()

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>

      {/* NAV */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
          🏛️ Authority Dashboard
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ background: '#f1f5f9', borderRadius: 20, padding: '4px 12px', fontSize: 13, color: '#475569', fontWeight: 500 }}>
            {profile?.role?.toUpperCase() || 'ADMIN'} · {profile?.full_name || user?.email}
          </span>
          <button onClick={handleSignOut} style={{
            background: 'none', border: '1px solid #e2e8f0', borderRadius: 8,
            padding: '6px 14px', fontSize: 13, color: '#64748b', cursor: 'pointer', fontWeight: 500,
          }}>Sign out</button>
        </div>
      </nav>

      <main style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Issues',  value: stats.total,       color: '#1e293b', accent: '#6366f1', sub: 'All time' },
            { label: 'Pending',       value: stats.pending,     color: '#92400e', accent: '#f59e0b', sub: 'Awaiting action' },
            { label: 'In Progress',   value: stats.in_progress, color: '#1e40af', accent: '#3b82f6', sub: 'Being handled' },
            { label: 'Resolved',      value: stats.resolved,    color: '#065f46', accent: '#10b981', sub: `${resRate}% rate` },
            { label: 'Critical',      value: stats.critical,    color: '#991b1b', accent: '#ef4444', sub: 'High priority' },
          ].map(({ label, value, color, accent, sub }) => (
            <div key={label} style={{
              background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14,
              padding: '18px 20px', borderTop: `3px solid ${accent}`,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
            }}>
              <div style={{ fontSize: 30, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
              <div style={{ fontSize: 13, color: '#64748b', fontWeight: 500, marginTop: 4 }}>{label}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#fff', borderRadius: 12, padding: 4, border: '1px solid #e2e8f0', width: 'fit-content' }}>
          {[{ id: 'issues', label: '📋 Issues Table' }, { id: 'analytics', label: '📊 Analytics' }].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
              padding: '8px 22px', borderRadius: 9, border: 'none',
              background: activeTab === t.id ? '#1e293b' : 'transparent',
              color: activeTab === t.id ? '#fff' : '#64748b',
              fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── ANALYTICS ── */}
        {activeTab === 'analytics' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

              {/* Category Bar */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '22px 24px' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 4 }}>Issues by Category</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>Total reports per category</div>
                {categoryChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={categoryChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="count" name="Issues" radius={[6,6,0,0]}>
                        {categoryChartData.map((_,i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No data yet</div>
                )}
              </div>

              {/* Status Donut */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '22px 24px' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 4 }}>Status Breakdown</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>Distribution across all statuses</div>
                {statusChartData.length > 0 ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <ResponsiveContainer width="55%" height={220}>
                      <PieChart>
                        <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                          {statusChartData.map((entry,i) => <Cell key={i} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {statusChartData.map((item,i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                          <div style={{ flex: 1, fontSize: 13, color: '#475569' }}>{item.name}</div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No data yet</div>
                )}
              </div>

              {/* Monthly Line */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '22px 24px' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 4 }}>Monthly Trend</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>Issues reported over last 6 months</div>
                {monthlyChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={monthlyChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" name="Issues" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No data yet</div>
                )}
              </div>

              {/* Ward Bar */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '22px 24px' }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 4 }}>Ward Leaderboard</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>Issues per ward</div>
                {wardChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={wardChartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="ward" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="total"    name="Total"    fill="#6366f1" radius={[4,4,0,0]} />
                      <Bar dataKey="resolved" name="Resolved" fill="#10b981" radius={[4,4,0,0]} />
                      <Bar dataKey="pending"  name="Pending"  fill="#f59e0b" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>No ward data</div>
                )}
              </div>
            </div>

            {/* Priority cards */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 14, padding: '22px 24px', marginBottom: 20 }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b', marginBottom: 4 }}>Priority Distribution</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20 }}>Breakdown by priority level</div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {['low','medium','high','critical'].map(p => {
                  const pc = priorityColors[p]
                  const count = issues.filter(i => i.priority === p).length
                  const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0
                  return (
                    <div key={p} style={{ flex: '1 1 140px', background: pc.bg, borderRadius: 12, padding: '16px 20px' }}>
                      <div style={{ fontSize: 26, fontWeight: 700, color: pc.color }}>{count}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: pc.color, marginBottom: 8, textTransform: 'capitalize' }}>{p}</div>
                      <div style={{ height: 4, background: 'rgba(0,0,0,0.08)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: pc.color, borderRadius: 4 }} />
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 6 }}>{pct}% of total</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ── ISSUES TABLE ── */}
        {activeTab === 'issues' && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                style={{ flex: '1 1 200px', minWidth: 180, padding: '9px 14px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#fff', color: '#1e293b' }}
                placeholder="🔍  Search issues…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <select value={filterStatus} onChange={e => setFStatus(e.target.value)} style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff', color: '#475569', cursor: 'pointer' }}>
                <option value="all">All Statuses</option>
                {Object.entries(statusColors).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              <select value={filterCat} onChange={e => setFCat(e.target.value)} style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff', color: '#475569', cursor: 'pointer' }}>
                <option value="all">All Categories</option>
                {categories.map(c => <option key={c.id} value={String(c.id)}>{c.icon} {c.name}</option>)}
              </select>
              <select value={filterWard} onChange={e => setFWard(e.target.value)} style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff', color: '#475569', cursor: 'pointer' }}>
                <option value="all">All Wards</option>
                {wards.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <select value={filterPriority} onChange={e => setFPri(e.target.value)} style={{ padding: '9px 12px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 13, outline: 'none', background: '#fff', color: '#475569', cursor: 'pointer' }}>
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>{filtered.length} issue{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>Loading issues…</div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>No issues match your filters
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <thead>
                  <tr>
                    {['Issue','Category','Status','Priority','Ward','Upvotes','Reported','Action'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.07em', background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(issue => {
                    const sc = statusColors[issue.status] || statusColors.pending
                    const pc = priorityColors[issue.priority] || priorityColors.low
                    return (
                      <tr key={issue.id} style={{ cursor: 'pointer' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                        onClick={() => openModal(issue)}>
                        <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f1f5f9', maxWidth: 220 }}>
                          <div style={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{issue.title}</div>
                          <div style={{ fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{issue.address || issue.city || '—'}</div>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f1f5f9' }}>
                          {issue.categories ? `${issue.categories.icon || ''} ${issue.categories.name}` : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: sc.bg, color: sc.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot }} />{sc.label}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', background: pc.bg, color: pc.color, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 500 }}>{issue.priority || 'low'}</span>
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f1f5f9' }}>{issue.ward || '—'}</td>
                        <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f1f5f9' }}>👍 {issue.upvotes || 0}</td>
                        <td style={{ padding: '14px 16px', fontSize: 14, color: '#374151', borderBottom: '1px solid #f1f5f9' }}>
                          {issue.created_at ? new Date(issue.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', borderBottom: '1px solid #f1f5f9' }}>
                          <button onClick={e => { e.stopPropagation(); openModal(issue) }} style={{ padding: '5px 14px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', fontSize: 12, cursor: 'pointer', color: '#3b82f6', fontWeight: 600 }}>
                            Update
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </>
        )}
      </main>

      {/* MODAL */}
      {selectedIssue && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && closeModal()}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.25)', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{selectedIssue.title}</div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
              Reported {new Date(selectedIssue.created_at).toLocaleString('en-IN')}
              {selectedIssue.ward ? ` · Ward: ${selectedIssue.ward}` : ''}
              {selectedIssue.city ? ` · ${selectedIssue.city}` : ''}
            </div>

            {selectedIssue.issue_images?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {selectedIssue.issue_images.map((img,i) => (
                  <img key={i} src={img.image_url} alt="Issue" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '1px solid #e2e8f0' }} />
                ))}
              </div>
            )}

            {selectedIssue.description && (
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, marginBottom: 16, background: '#f8fafc', borderRadius: 8, padding: 12 }}>{selectedIssue.description}</p>
            )}

            <div style={{ borderBottom: '1px solid #f1f5f9', marginBottom: 16, paddingBottom: 16 }} />

            {selectedIssue.ml_category && (
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 16, background: '#f0f4ff', borderRadius: 8, padding: '8px 12px' }}>
                🤖 ML: <strong>{selectedIssue.ml_category}</strong>
                {selectedIssue.ml_confidence && ` (${Math.round(selectedIssue.ml_confidence * 100)}%)`}
              </div>
            )}

            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>Update Status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', color: '#1e293b', marginBottom: 16 }}>
              {Object.entries(statusColors).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>

            <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6, display: 'block' }}>Assign Officer</label>
            <select value={assignTo} onChange={e => setAssignTo(e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', color: '#1e293b', marginBottom: 16 }}>
              <option value="">— Unassigned —</option>
              {officers.map(o => <option key={o.id} value={o.id}>{o.full_name} ({o.role})</option>)}
            </select>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={closeModal} style={{ padding: '10px 20px', borderRadius: 8, border: '1.5px solid #e2e8f0', background: '#fff', fontSize: 14, cursor: 'pointer', color: '#64748b', fontWeight: 500 }}>Cancel</button>
              <button onClick={handleUpdateIssue} disabled={updatingStatus} style={{ padding: '10px 24px', borderRadius: 8, border: 'none', background: updatingStatus ? '#94a3b8' : '#1e293b', fontSize: 14, cursor: updatingStatus ? 'not-allowed' : 'pointer', color: '#fff', fontWeight: 600 }}>
                {updatingStatus ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
