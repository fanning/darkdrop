# Onboarding System - Quick Start Guide

## 🚀 5-Minute Setup

The onboarding system is already integrated and ready to use! Here's everything you need to know.

## What You Get

A beautiful, interactive tour that guides new users through DarkDrop's key features:

1. Welcome message
2. Account overview
3. Encryption feature
4. Version history
5. Audit trail
6. File upload tutorial
7. Completion celebration

## When It Appears

- **Automatically** for new users (first 2 logins)
- **Manually** via developer tools
- **Never** if user completed or skipped it

## Testing It Right Now

### Option 1: Browser Console (Easiest)
```javascript
// Open browser console (F12) and paste:
window.DarkDropOnboarding.forceShow()
```

### Option 2: Simulate New User
```javascript
// In console:
window.DarkDropOnboarding.simulateNewUser()
// Then refresh the page and login
```

### Option 3: Clear State
```javascript
// In console:
window.DarkDropOnboarding.reset()
// Then refresh the page
```

## File Structure

```
frontend/
├── src/
│   ├── utils/
│   │   ├── onboarding.js           # Core logic & state
│   │   └── onboardingHelpers.js    # Dev tools & analytics
│   └── components/
│       └── OnboardingTour.jsx      # UI component
├── ONBOARDING_SYSTEM.md            # Full documentation
├── ONBOARDING_QUICK_START.md       # This file
└── test-onboarding.html            # Demo page
```

## Developer Tools

### Available Commands
```javascript
// Show the tour
window.DarkDropOnboarding.forceShow()

// Jump to specific step (0-6)
window.DarkDropOnboarding.goToStep(3)

// Get current state
window.DarkDropOnboarding.getState()

// List all steps
window.DarkDropOnboarding.listSteps()

// Reset everything
window.DarkDropOnboarding.reset()

// Simulate new user
window.DarkDropOnboarding.simulateNewUser()

// Check if should show
window.DarkDropOnboarding.shouldShow()

// Mark as completed
window.DarkDropOnboarding.complete()
```

## Adding New Steps

### 1. Add step configuration

Edit `frontend/src/utils/onboarding.js`:

```javascript
{
  id: 'my-new-step',
  target: '[data-feature="my-feature"]',  // CSS selector
  title: '✨ My New Feature',
  content: 'This feature helps you...',
  position: 'bottom',  // top, bottom, left, right, center
  actions: [
    { label: 'Next', primary: true, action: 'next' },
    { label: 'Skip', primary: false, action: 'skip' }
  ]
}
```

### 2. Add target element

In your component:
```jsx
<div data-feature="my-feature">
  My Feature Content
</div>
```

### 3. Done!
The step will automatically appear in the tour.

## Customization

### Change when tour appears

Edit `shouldShowOnboarding()` in `frontend/src/utils/onboarding.js`:

```javascript
shouldShowOnboarding() {
  const loginCount = parseInt(localStorage.getItem('darkdrop_login_count') || '0')
  return loginCount <= 5  // Change to show for first 5 logins
}
```

### Add analytics tracking

Edit step's `afterShow` callback:

```javascript
afterShow: (context) => {
  // Track to your analytics service
  analytics.track('Onboarding Step Viewed', {
    stepId: 'encryption',
    userId: context.user?.id
  })
}
```

### Conditional steps

Use `beforeShow` to control when step appears:

```javascript
beforeShow: (context) => {
  // Only show if user has admin role
  return context.user?.role === 'admin'
}
```

## Common Tasks

### See completion statistics
```javascript
// In console:
window.DarkDropOnboarding.getState()
```

### Debug positioning issues
```javascript
// Check if target exists
document.querySelector('[data-feature="encryption"]')

// Force show and check console for warnings
window.DarkDropOnboarding.forceShow()
```

### Clear all onboarding data
```javascript
localStorage.removeItem('darkdrop_onboarding_state')
localStorage.removeItem('darkdrop_onboarding_analytics')
localStorage.removeItem('darkdrop_login_count')
```

## Troubleshooting

### Tour not appearing?
1. Check login count: `localStorage.getItem('darkdrop_login_count')`
2. Check completion state: `localStorage.getItem('darkdrop_onboarding_state')`
3. Force show: `window.DarkDropOnboarding.forceShow()`

### Element not highlighting?
1. Verify data attribute exists: `document.querySelector('[data-feature="..."]')`
2. Check console for warnings
3. Try different CSS selector

### Tooltip positioned wrong?
1. Check viewport size
2. Try different `position` value (top/bottom/left/right)
3. Verify target element is visible
4. Check for CSS conflicts

## Quick Reference

### Step Positions
- `top` - Tooltip above element
- `bottom` - Tooltip below element
- `left` - Tooltip left of element
- `right` - Tooltip right of element
- `center` - Centered modal (no target)

### Action Types
- `next` - Move to next step
- `previous` - Go back one step
- `skip` - Dismiss entire tour
- `complete` - Finish tour

### Data Attributes
- `data-feature="name"` - For feature highlights
- `data-action="name"` - For action elements
- Any CSS selector works as target

## Need More Info?

- **Full Documentation**: `frontend/ONBOARDING_SYSTEM.md`
- **Implementation Summary**: `ONBOARDING_IMPLEMENTATION.md`
- **Demo Page**: `frontend/test-onboarding.html`
- **Source Code**: `frontend/src/utils/onboarding.js`

## Support

Questions or issues? Check:
1. Browser console for errors
2. Developer tools state inspector
3. Full documentation file
4. Source code comments

---

**That's it! You're ready to customize and extend the onboarding system.** 🎉
