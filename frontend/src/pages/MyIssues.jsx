import { useEffect, useState } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useTranslation } from 'react-i18next'

const statusColors = {
  pending: {
    bg: '#fef3c7',
    color: '#92400e',
    label: 'Pending',
  },
  assigned: {
    bg: '#dbeafe',
    color: '#1e40af',
    label: 'Assigned',
  },
  in_progress: {
    bg: '#e0e7ff',
    color: '#3730a3',
    label: 'In Progress',
  },
  resolved: {
    bg: '#dcfce7',
    color: '#166534',
    label: 'Resolved',
  },
  rejected: {
    bg: '#fee2e2',
    color: '#991b1b',
    label: 'Rejected',
  },
  duplicate: {
    bg: '#f1f5f9',
    color: '#475569',
    label: 'Duplicate',
  },
}

const priorityColors = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
  critical: '#7c3aed',
}

export default function MyIssues() {
  const { user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState(null)

  const successMsg = location.state?.success

  // ---------------------------------------------------------
  // Load citizen's issues
  // ---------------------------------------------------------
  useEffect(() => {
    if (!user) {
      setLoading(false)
      navigate('/login')
      return
    }

    async function fetchIssues() {
      setLoading(true)

      const { data, error } = await supabase
        .from('issues')
        .select(`
          *,
          categories(name, icon),
          issue_images(image_url)
        `)
        .eq('reported_by', user.id)
        .order('created_at', {
          ascending: false,
        })

      if (error) {
        console.error('Error loading issues:', error)
      }

      setIssues(data || [])
      setLoading(false)
    }

    fetchIssues()
  }, [user, navigate])

  // ---------------------------------------------------------
  // Delete issue
  // ---------------------------------------------------------
  async function handleDeleteIssue(issueId) {
    if (!user) {
      navigate('/login')
      return
    }

    const issue = issues.find(
      item => item.id === issueId
    )

    if (!issue) {
      return
    }

    const confirmed = window.confirm(
      `${t('issues.deleteConfirmTitle', {
        title: issue.title,
      })}\n\n${t('issues.deleteConfirmWarning')}`
    )

    if (!confirmed) {
      return
    }

    try {
      setDeletingId(issueId)

      // ---------------------------------------------------
      // 1. Delete issue image records
      // ---------------------------------------------------
      const {
        error: imageRowsError,
      } = await supabase
        .from('issue_images')
        .delete()
        .eq('issue_id', issueId)

      if (imageRowsError) {
        console.warn(
          'Could not delete image records:',
          imageRowsError.message
        )
      }

      // ---------------------------------------------------
      // 2. Delete comments belonging to the issue
      // ---------------------------------------------------
      const {
        error: commentsError,
      } = await supabase
        .from('comments')
        .delete()
        .eq('issue_id', issueId)

      if (commentsError) {
        console.warn(
          'Could not delete comments:',
          commentsError.message
        )
      }

      // ---------------------------------------------------
      // 3. Delete notifications for the issue
      // ---------------------------------------------------
      const {
        error: notificationsError,
      } = await supabase
        .from('notifications')
        .delete()
        .eq('issue_id', issueId)
        .eq('user_id', user.id)

      if (notificationsError) {
        console.warn(
          'Could not delete notifications:',
          notificationsError.message
        )
      }

      // ---------------------------------------------------
      // 4. Delete the issue itself
      // ---------------------------------------------------
      const {
        error: issueError,
      } = await supabase
        .from('issues')
        .delete()
        .eq('id', issueId)
        .eq('reported_by', user.id)

      if (issueError) {
        throw issueError
      }

      // ---------------------------------------------------
      // 5. Remove from UI immediately
      // ---------------------------------------------------
      setIssues(prev =>
        prev.filter(
          issue => issue.id !== issueId
        )
      )

    } catch (error) {
      console.error(
        'Delete issue error:',
        error
      )

      alert(
        error.message ||
        t('issues.deleteError')
      )
    } finally {
      setDeletingId(null)
    }
  }

  // ---------------------------------------------------------
  // Loading
  // ---------------------------------------------------------
  if (loading) {
    return (
      <div
        style={{
          paddingTop: '68px',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p
          style={{
            color: '#64748b',
            fontSize: '1rem',
          }}
        >
          {t('issues.loading')}
        </p>
      </div>
    )
  }

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------
  return (
    <div
      style={{
        paddingTop: '68px',
        minHeight: '100vh',
        background: '#f8f9fc',
      }}
    >

      {/* Header */}
      <div
        style={{
          background:
            'linear-gradient(135deg, #0a0f2e, #111a45)',
          padding:
            '3rem 1.5rem 2rem',
        }}
      >
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily:
                  'Fraunces, serif',
                fontSize: '2rem',
                fontWeight: 700,
                color: 'white',
              }}
            >
              {t('issues.myIssues')}
            </h1>

            <p
              style={{
                color:
                  'rgba(255,255,255,0.5)',
                marginTop:
                  '0.25rem',
              }}
            >
              {issues.length}{' '}
              {issues.length !== 1
                ? t('issues.issues')
                : t('issues.issue')}{' '}
              {t('issues.reported')}
            </p>
          </div>

          <Link
            to="/report"
            style={{
              background: '#f59e0b',
              color: '#0a0f2e',
              padding:
                '0.65rem 1.5rem',
              borderRadius:
                '9999px',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.9rem',
              whiteSpace:
                'nowrap',
            }}
          >
            + {t('issues.reportNew')}
          </Link>
        </div>
      </div>

      <div
        style={{
          maxWidth: '900px',
          margin: '2rem auto',
          padding:
            '0 1.5rem 4rem',
        }}
      >

        {/* Success message */}
        {successMsg && (
          <div
            style={{
              background: '#f0fdf4',
              border:
                '1px solid #bbf7d0',
              borderRadius: '12px',
              padding:
                '1rem 1.25rem',
              color: '#166534',
              fontSize: '0.9rem',
              marginBottom:
                '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            ✅ {successMsg}
          </div>
        )}

        {/* Empty state */}
        {issues.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '5rem 1rem',
            }}
          >
            <div
              style={{
                fontSize: '4rem',
                marginBottom:
                  '1rem',
              }}
            >
              📋
            </div>

            <h2
              style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                color: '#0a0f2e',
                marginBottom:
                  '0.5rem',
              }}
            >
              {t('issues.noIssues')}
            </h2>

            <p
              style={{
                color: '#64748b',
                marginBottom:
                  '2rem',
              }}
            >
              {t('issues.beFirst')}
            </p>

            <Link
              to="/report"
              style={{
                background:
                  '#f59e0b',
                color: '#0a0f2e',
                padding:
                  '0.75rem 2rem',
                borderRadius:
                  '9999px',
                textDecoration:
                  'none',
                fontWeight: 700,
              }}
            >
              {t('issues.reportFirst')} →
            </Link>
          </div>
        ) : (

          <div
            style={{
              display: 'flex',
              flexDirection:
                'column',
              gap: '1rem',
            }}
          >

            {issues.map(issue => {
              const status =
                statusColors[
                  issue.status
                ] ||
                statusColors.pending

              const thumb =
                issue.issue_images?.[0]
                  ?.image_url

              const isDeleting =
                deletingId ===
                issue.id

              return (
                <div
                  key={issue.id}
                  style={{
                    background:
                      'white',
                    border:
                      '1px solid #e2e8f0',
                    borderRadius:
                      '16px',
                    padding:
                      '1.25rem 1.5rem',
                    display: 'flex',
                    gap: '1rem',
                    alignItems:
                      'flex-start',
                    transition:
                      'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    if (!isDeleting) {
                      e.currentTarget.style.boxShadow =
                        '0 8px 24px rgba(10,15,46,0.08)'

                      e.currentTarget.style.borderColor =
                        '#f59e0b'
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.boxShadow =
                      'none'

                    e.currentTarget.style.borderColor =
                      '#e2e8f0'
                  }}
                >

                  {/* Thumbnail */}
                  {thumb ? (
                    <img
                      src={thumb}
                      alt=""
                      style={{
                        width: '72px',
                        height: '72px',
                        objectFit:
                          'cover',
                        borderRadius:
                          '10px',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '72px',
                        height: '72px',
                        borderRadius:
                          '10px',
                        background:
                          '#f1f5f9',
                        display: 'flex',
                        alignItems:
                          'center',
                        justifyContent:
                          'center',
                        fontSize:
                          '1.75rem',
                        flexShrink: 0,
                      }}
                    >
                      {issue.categories
                        ?.icon ||
                        '📌'}
                    </div>
                  )}

                  {/* Content */}
                  <Link
                    to={`/issues/${issue.id}`}
                    style={{
                      textDecoration:
                        'none',
                      flex: 1,
                      minWidth: 0,
                      color:
                        'inherit',
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: '0.5rem',
                        marginBottom:
                          '0.35rem',
                        flexWrap:
                          'wrap',
                      }}
                    >
                      <span
                        style={{
                          background:
                            status.bg,
                          color:
                            status.color,
                          fontSize:
                            '0.75rem',
                          fontWeight: 600,
                          padding:
                            '0.2rem 0.6rem',
                          borderRadius:
                            '9999px',
                        }}
                      >
                        {t(
                          `status.${issue.status}`,
                          status.label
                        )}
                      </span>

                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius:
                            '50%',
                          background:
                            priorityColors[
                              issue.priority
                            ],
                          display:
                            'inline-block',
                        }}
                      />

                      <span
                        style={{
                          fontSize:
                            '0.75rem',
                          color:
                            '#94a3b8',
                          textTransform:
                            'capitalize',
                        }}
                      >
                        {t(
                          `priority.${issue.priority}`,
                          issue.priority
                        )}
                      </span>
                    </div>

                    <h3
                      style={{
                        fontSize:
                          '1rem',
                        fontWeight: 600,
                        color:
                          '#0a0f2e',
                        marginBottom:
                          '0.25rem',
                        whiteSpace:
                          'nowrap',
                        overflow:
                          'hidden',
                        textOverflow:
                          'ellipsis',
                      }}
                    >
                      {issue.title}
                    </h3>

                    <p
                      style={{
                        fontSize:
                          '0.82rem',
                        color:
                          '#64748b',
                      }}
                    >
                      {
                        issue.categories
                          ?.name
                      }
                      {' · '}
                      {issue.city ||
                        issue.ward ||
                        t('issues.locationNotSet')}
                      {' · '}
                      {new Date(
                        issue.created_at
                      ).toLocaleDateString(
                        'en-IN',
                        {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }
                      )}
                    </p>
                  </Link>

                  {/* View arrow */}
                  <Link
                    to={`/issues/${issue.id}`}
                    style={{
                      color:
                        '#cbd5e1',
                      fontSize:
                        '1.2rem',
                      flexShrink: 0,
                      textDecoration:
                        'none',
                      paddingTop:
                        '0.2rem',
                    }}
                    title={t(
                      'issues.viewIssue'
                    )}
                  >
                    →
                  </Link>

                  {/* Delete button */}
                  <button
                    type="button"
                    disabled={
                      isDeleting
                    }
                    onClick={e => {
                      e.preventDefault()
                      e.stopPropagation()

                      handleDeleteIssue(
                        issue.id
                      )
                    }}
                    style={{
                      flexShrink: 0,
                      padding:
                        '0.5rem 0.75rem',
                      border:
                        '1px solid #fecaca',
                      borderRadius:
                        '8px',
                      background:
                        isDeleting
                          ? '#f1f5f9'
                          : '#fef2f2',
                      color:
                        isDeleting
                          ? '#94a3b8'
                          : '#dc2626',
                      fontSize:
                        '0.8rem',
                      fontWeight: 700,
                      cursor:
                        isDeleting
                          ? 'not-allowed'
                          : 'pointer',
                    }}
                  >
                    {isDeleting
                      ? t(
                          'issues.deleting'
                        )
                      : `🗑️ ${t(
                          'issues.delete'
                        )}`}
                  </button>

                </div>
              )
            })}

          </div>
        )}
      </div>
    </div>
  )
}
