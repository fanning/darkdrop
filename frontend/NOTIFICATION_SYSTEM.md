# Notification System Documentation

## Overview
The notification system provides users with timely reminders about incomplete actions and announcements about new features. Notifications appear as dismissible banners in the top-right corner of the application after login.

## Implementation

### Core Components

1. **NotificationBanner.jsx** (`/frontend/src/components/NotificationBanner.jsx`)
   - Main notification component
   - Displays notifications in a fixed position (top-right)
   - Manages notification dismissal state
   - Supports multiple notification types: warning, success, info

2. **App.jsx** (Modified)
   - Imports and renders NotificationBanner when user is logged in
   - Tracks login count for first-time user welcome messages

3. **uploadManager.js** (`/frontend/src/utils/uploadManager.js`)
   - Utility functions for tracking incomplete file uploads
   - Can be integrated with file upload components

## Notification Types

### 1. Welcome Message (First Login)
- **Trigger**: Shown on first login only
- **Type**: Success (green)
- **Icon**: 👋
- **Dismissible**: Yes
- **ID**: `welcome-message`

### 2. No Accounts Warning
- **Trigger**: User has no connected accounts
- **Type**: Warning (yellow)
- **Icon**: ⚠️
- **Dismissible**: Yes
- **ID**: `no-accounts`

### 3. New Feature Announcements
- **Trigger**: New features are available (configurable)
- **Type**: Info (blue)
- **Icon**: ✨
- **Dismissible**: Yes
- **ID**: `feature-security-v1` (or custom IDs)

### 4. Incomplete Uploads
- **Trigger**: Failed or incomplete file uploads exist
- **Type**: Warning (yellow)
- **Icon**: 📤
- **Dismissible**: Yes
- **ID**: `incomplete-uploads`
- **Action**: Includes "Take Action" button to retry uploads

## How It Works

### Notification Flow
1. User logs in → `handleLogin` increments login count
2. `NotificationBanner` component mounts
3. `useEffect` hook generates notifications based on:
   - User state
   - Account availability
   - Dismissed notification history
   - Incomplete actions (uploads, etc.)
4. Notifications are filtered against dismissed list
5. Active notifications are displayed
6. User can dismiss notifications individually
7. Dismissed IDs are stored in localStorage

### LocalStorage Keys
- `darkdrop_login_count`: Number of times user has logged in
- `darkdrop_dismissed_notifications`: Array of dismissed notification IDs
- `darkdrop_incomplete_uploads`: Array of failed upload information

## Adding New Notifications

To add a new notification type, edit `NotificationBanner.jsx`:

```javascript
// Add your notification logic in the useEffect hook
if (someCondition) {
  newNotifications.push({
    id: 'unique-notification-id',
    type: 'warning', // 'warning', 'success', or 'info'
    icon: '🔔',
    title: 'Notification Title',
    message: 'Detailed message for the user.',
    action: () => {
      // Optional: function to run when "Take Action" is clicked
      console.log('Action triggered')
    }
  })
}
```

## Customization

### Styling
Notification styles are inline but can be extracted to CSS modules. Current color schemes:
- **Warning**: Yellow background (#fff3cd), orange border (#ffc107)
- **Success**: Green background (#d4edda), green border (#28a745)
- **Info**: Blue background (#d1ecf1), blue border (#17a2b8)

### Position
Default position is `top: 70px, right: 20px` (below header). Modify the container div style in `NotificationBanner.jsx` to change position.

### Animation
Uses CSS `@keyframes slideInRight` for smooth entry. Duration: 0.3s.

## Integration with File Upload

To track incomplete uploads:

```javascript
import { uploadManager } from '../utils/uploadManager'

// When upload fails:
uploadManager.addIncompleteUpload({
  id: 'unique-upload-id',
  fileName: 'document.pdf',
  accountId: 123,
  error: 'Network error'
})

// When upload succeeds or is manually cleared:
uploadManager.removeIncompleteUpload('unique-upload-id')
```

## Making Notifications Dynamic (API-Driven)

To fetch notifications from an API instead of hardcoding them:

```javascript
useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('darkdrop_token')}`
        }
      })
      const data = await response.json()

      // Filter and set notifications
      const activeNotifications = data.notifications.filter(
        notif => !dismissedNotifications.includes(notif.id)
      )
      setNotifications(activeNotifications)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    }
  }

  fetchNotifications()
}, [user, accounts])
```

## Testing

### Manual Testing Steps
1. **First Login**: Clear localStorage, log in → should see welcome message
2. **No Accounts**: Log in with user that has no accounts → should see warning
3. **Feature Announcement**: Clear dismissed notifications, log in → should see feature announcement
4. **Dismiss**: Click dismiss on any notification → should persist across page reloads
5. **Incomplete Uploads**: Use browser console to add incomplete upload:
   ```javascript
   localStorage.setItem('darkdrop_incomplete_uploads', JSON.stringify([
     { id: 'test1', fileName: 'test.pdf', accountId: 1, error: 'Test error' }
   ]))
   ```
   Refresh page → should see upload notification

## Future Enhancements

- Add notification sound/vibration options
- Implement notification priority/sorting
- Add notification history page
- Support for action buttons with custom callbacks
- Toast notifications for transient messages
- Push notifications (requires service worker)
- Email/SMS notification preferences
