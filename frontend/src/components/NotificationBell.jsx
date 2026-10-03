import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function NotificationBell() {
  const { user } = useAuth()

  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)

  // --------------------------------
  // GET EXISTING NOTIFICATIONS
  // --------------------------------
  useEffect(() => {
    if (!user?.id) return

    loadNotifications()
  }, [user?.id])

  async function loadNotifications() {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', {
        ascending: false
      })

    if (error) {
      console.error('Notification loading error:', error)
      return
    }

    setNotifications(data || [])
  }

  // --------------------------------
  // REALTIME LISTENER
  // --------------------------------
  useEffect(() => {
    if (!user?.id) return

    console.log('Starting notification realtime...')

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 NEW NOTIFICATION:', payload.new)

          setNotifications((previous) => [
            payload.new,
            ...previous
          ])
        }
      )
      .subscribe((status) => {
        console.log(
          'Notification realtime status:',
          status
        )
      })

    return () => {
      console.log('Removing notification channel')

      supabase.removeChannel(channel)
    }
  }, [user?.id])

  // --------------------------------
  // MARK ONE AS READ
  // --------------------------------
  async function markAsRead(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true
      })
      .eq('id', notificationId)
      .eq('user_id', user.id)

    if (error) {
      console.error(error)
      return
    }

    setNotifications((previous) =>
      previous.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              is_read: true
            }
          : notification
      )
    )
  }

  // --------------------------------
  // MARK ALL AS READ
  // --------------------------------
  async function markAllAsRead() {
    const { error } = await supabase
      .from('notifications')
      .update({
        is_read: true
      })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) {
      console.error(error)
      return
    }

    setNotifications((previous) =>
      previous.map((notification) => ({
        ...notification,
        is_read: true
      }))
    )
  }

  const unreadCount = notifications.filter(
    (notification) => !notification.is_read
  ).length

  if (!user) return null

  return (
    <div
      style={{
        position: 'relative'
      }}
    >
      {/* BELL */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: '22px',
          position: 'relative'
        }}
      >
        🔔

        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-7px',
              background: '#ef4444',
              color: 'white',
              width: '19px',
              height: '19px',
              borderRadius: '50%',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold'
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '42px',
            width: '360px',
            maxHeight: '450px',
            overflowY: 'auto',
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb',
            zIndex: 9999
          }}
        >

          {/* HEADER */}
          <div
            style={{
              padding: '15px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <strong>Notifications</strong>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  border: 'none',
                  background: 'none',
                  color: '#2563eb',
                  cursor: 'pointer'
                }}
              >
                Mark all read
              </button>
            )}
          </div>

          {/* LIST */}
          {notifications.length === 0 ? (
            <div
              style={{
                padding: '30px',
                textAlign: 'center',
                color: '#6b7280'
              }}
            >
              🔔
              <p>No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification.id)
                  }
                }}
                style={{
                  padding: '15px',
                  borderBottom: '1px solid #f1f5f9',
                  background: notification.is_read
                    ? '#fff'
                    : '#eff6ff',
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: '10px'
                  }}
                >
                  <span>
                    {getIcon(notification.type)}
                  </span>

                  <div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: '#111827'
                      }}
                    >
                      {notification.message}
                    </div>

                    <div
                      style={{
                        marginTop: '5px',
                        fontSize: '11px',
                        color: '#6b7280'
                      }}
                    >
                      {formatTime(
                        notification.created_at
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

function getIcon(type) {
  if (type === 'resolved') return '✅'
  if (type === 'assignment') return '👮'
  if (type === 'comment') return '💬'
  if (type === 'critical') return '🚨'

  return '🔄'
}

function formatTime(date) {
  const diff =
    Date.now() - new Date(date).getTime()

  const minutes = Math.floor(diff / 60000)

  if (minutes < 1) return 'Just now'

  if (minutes < 60) {
    return `${minutes} min ago`
  }

  const hours = Math.floor(minutes / 60)

  if (hours < 24) {
    return `${hours} hr ago`
  }

  const days = Math.floor(hours / 24)

  return `${days} day${days > 1 ? 's' : ''} ago`
}