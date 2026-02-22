import React, { useState, useEffect } from 'react'

function NotificationBanner({ user, accounts }) {
  const [notifications, setNotifications] = useState([])
  const [dismissedNotifications, setDismissedNotifications] = useState([])

  useEffect(() => {
    // Load dismissed notifications from localStorage
    const dismissed = JSON.parse(localStorage.getItem('darkdrop_dismissed_notifications') || '[]')
    setDismissedNotifications(dismissed)

    // Generate notifications based on user state
    const newNotifications = []

    // Check for incomplete actions
    if (accounts.length === 0) {
      newNotifications.push({
        id: 'no-accounts',
        type: 'warning',
        icon: '⚠️',
        title: 'No Accounts Connected',
        message: 'Contact your administrator to get access to file storage accounts.',
        action: null
      })
    }

    // Check for new feature announcements (you can make this dynamic via API)
    const hasSeenFeatureAnnouncement = dismissed.includes('feature-security-v1')
    if (!hasSeenFeatureAnnouncement) {
      newNotifications.push({
        id: 'feature-security-v1',
        type: 'info',
        icon: '✨',
        title: 'New Security Features Available',
        message: 'We\'ve added AES-256 encryption, version history, and complete audit trails to protect your files.',
        action: null
      })
    }

    // Check for incomplete file uploads (stored in localStorage)
    const incompleteUploads = JSON.parse(localStorage.getItem('darkdrop_incomplete_uploads') || '[]')
    if (incompleteUploads.length > 0) {
      newNotifications.push({
        id: 'incomplete-uploads',
        type: 'warning',
        icon: '📤',
        title: 'Incomplete Uploads',
        message: `You have ${incompleteUploads.length} file(s) that failed to upload. Click to retry.`,
        action: () => {
          // Navigate to files page or trigger retry
          console.log('Retrying uploads:', incompleteUploads)
        }
      })
    }

    // Welcome message for new users (first login)
    const loginCount = parseInt(localStorage.getItem('darkdrop_login_count') || '0')
    if (loginCount === 1 && !dismissed.includes('welcome-message')) {
      newNotifications.push({
        id: 'welcome-message',
        type: 'success',
        icon: '👋',
        title: `Welcome to DarkDrop, ${user?.name || 'User'}!`,
        message: 'Your files are now protected with enterprise-grade encryption and audit logging.',
        action: null
      })
    }

    // Filter out dismissed notifications
    const activeNotifications = newNotifications.filter(
      notif => !dismissed.includes(notif.id)
    )

    setNotifications(activeNotifications)
  }, [user, accounts])

  const dismissNotification = (notificationId) => {
    const updatedDismissed = [...dismissedNotifications, notificationId]
    setDismissedNotifications(updatedDismissed)
    localStorage.setItem('darkdrop_dismissed_notifications', JSON.stringify(updatedDismissed))
    setNotifications(notifications.filter(n => n.id !== notificationId))
  }

  if (notifications.length === 0) {
    return null
  }

  return (
    <div style={{
      position: 'fixed',
      top: '70px',
      right: '20px',
      zIndex: 1000,
      maxWidth: '400px',
      width: '100%'
    }}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          style={{
            backgroundColor: notification.type === 'warning' ? '#fff3cd' :
                           notification.type === 'success' ? '#d4edda' :
                           notification.type === 'info' ? '#d1ecf1' : '#f8f9fa',
            border: `1px solid ${
              notification.type === 'warning' ? '#ffc107' :
              notification.type === 'success' ? '#28a745' :
              notification.type === 'info' ? '#17a2b8' : '#dee2e6'
            }`,
            borderRadius: '8px',
            padding: '15px',
            marginBottom: '10px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            animation: 'slideInRight 0.3s ease-out',
            color: '#000'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'start', gap: '10px' }}>
            <span style={{ fontSize: '24px', flexShrink: 0 }}>{notification.icon}</span>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>
                {notification.title}
              </h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', lineHeight: '1.5' }}>
                {notification.message}
              </p>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                {notification.action && (
                  <button
                    onClick={notification.action}
                    style={{
                      padding: '5px 12px',
                      fontSize: '13px',
                      backgroundColor: '#007bff',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Take Action
                  </button>
                )}
                <button
                  onClick={() => dismissNotification(notification.id)}
                  style={{
                    padding: '5px 12px',
                    fontSize: '13px',
                    backgroundColor: 'transparent',
                    color: '#666',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default NotificationBanner
