# DarkDrop Onboarding System

A step-by-step, interactive onboarding tour that guides new users through critical features of DarkDrop.

## Features

- **Step-by-step guidance** - Users are walked through key features in a logical sequence
- **Skippable** - Users can skip the tour at any time or restart it later
- **Engaging UI** - Smooth animations, tooltips, progress indicators, and highlighted elements
- **Smart targeting** - Tooltips automatically position themselves near relevant UI elements
- **Progress tracking** - State is persisted in localStorage across sessions
- **Context-aware** - Steps can be conditionally shown based on user state
- **Responsive** - Works across different screen sizes and positions tooltips within viewport

## Architecture

### Core Components

1. **`utils/onboarding.js`** - Core onboarding logic and state management
   - `ONBOARDING_STEPS` - Configuration array defining each tour step
   - `OnboardingManager` - Class managing state, navigation, and persistence
   - Helper functions for external control

2. **`components/OnboardingTour.jsx`** - React component rendering the tour UI
   - Tooltip overlay with backdrop
   - Progress bar and step counter
   - Smooth animations and transitions
   - Element highlighting with pulse effect

3. **`App.jsx`** - Integration point
   - Provides onboarding context (user, accounts, current path)
   - Renders OnboardingTour component when authenticated

## Configuration

### Step Structure

Each step in `ONBOARDING_STEPS` has the following properties:

```javascript
{
  id: 'unique-step-id',              // Unique identifier
  target: '.css-selector',           // Element to highlight (null for center modal)
  title: 'Step Title',               // Heading displayed to user
  content: 'Step description...',    // Main content/instructions
  position: 'top',                   // Tooltip position: top|bottom|left|right|center
  actions: [                         // Action buttons
    { label: 'Next', primary: true, action: 'next' },
    { label: 'Skip', primary: false, action: 'skip' }
  ],
  beforeShow: (context) => true,     // Optional: condition to show step
  afterShow: (context) => {}         // Optional: callback after step shown
}
```

### Available Actions

- `next` - Move to next step
- `previous` - Move to previous step
- `skip` - Skip entire tour
- `complete` - Complete the tour

### Context Object

The context object passed to steps includes:

```javascript
{
  user: {...},                // Current user object
  accounts: [...],            // User's accounts array
  currentPath: '/dashboard',  // Current route path
  hasAccounts: true,          // Boolean flag
  onComplete: () => {}        // Completion callback
}
```

## Usage

### Starting the Tour

The tour automatically starts for new users (login count ≤ 2). To manually control:

```javascript
import { onboardingManager } from './utils/onboarding'

// Start tour with context
onboardingManager.start({
  user,
  accounts,
  currentPath: '/dashboard'
})

// Restart tour
onboardingManager.restart()

// Check if should show
if (onboardingManager.shouldShowOnboarding()) {
  // Show tour
}
```

### Managing State

```javascript
// Get current step
const step = onboardingManager.getCurrentStep()

// Navigate
onboardingManager.next()
onboardingManager.previous()

// Control flow
onboardingManager.skip()
onboardingManager.complete()

// Reset (for testing)
onboardingManager.reset()

// Subscribe to changes
const unsubscribe = onboardingManager.subscribe((state) => {
  console.log('Current step:', state.currentStep)
  console.log('Progress:', state.progress + '%')
})
```

### Adding New Steps

1. Add step configuration to `ONBOARDING_STEPS` array in `utils/onboarding.js`
2. Add data attributes to target elements in your components:
   ```jsx
   <div data-feature="my-feature">...</div>
   ```
3. Steps are automatically included in the tour sequence

### Conditional Steps

Use `beforeShow` to conditionally display steps:

```javascript
{
  id: 'upload-step',
  beforeShow: (context) => {
    // Only show if user has accounts and is on files page
    return context.hasAccounts && context.currentPath.includes('/files/')
  }
}
```

### Step Callbacks

Use `afterShow` for side effects when a step is shown:

```javascript
{
  id: 'final-step',
  afterShow: (context) => {
    // Track completion
    console.log('User completed onboarding!')

    // Call external handler
    if (context.onComplete) {
      context.onComplete()
    }
  }
}
```

## Target Elements

Elements that need to be highlighted should have data attributes:

```jsx
// Dashboard.jsx - Feature highlights
<div data-feature="encryption">...</div>
<div data-feature="version-history">...</div>
<div data-feature="audit-trail">...</div>

// FileBrowser.jsx - Upload zone
<div data-action="upload">...</div>

// Dashboard.jsx - Account cards
<div className="account-card">...</div>
```

## Storage

State is persisted in localStorage:

```javascript
// Key: 'darkdrop_onboarding_state'
{
  completed: false,
  skipped: false,
  currentStepIndex: 0,
  lastUpdated: '2024-02-22T...'
}
```

## Styling

The component includes built-in styles for:

- Smooth fade-in animations
- Tooltip slide-up effect
- Element highlighting with pulse
- Responsive positioning
- Custom arrow pointers

Key CSS classes:
- `.onboarding-highlight` - Applied to target elements
- Inline styles for tooltip positioning and backdrop

## Testing

To test the onboarding flow:

```javascript
// In browser console
import { onboardingManager } from '/src/utils/onboarding.js'

// Reset state
onboardingManager.reset()

// Start fresh
onboardingManager.start({
  user: { name: 'Test User' },
  accounts: [{ id: '1', name: 'Test Account' }],
  currentPath: '/dashboard'
})

// Step through
onboardingManager.next()
onboardingManager.previous()

// Check progress
console.log(onboardingManager.getProgress())
```

## Customization

### Change Tour Trigger

Modify when tour appears by updating `shouldShowOnboarding()`:

```javascript
shouldShowOnboarding() {
  // Show for first 5 logins
  const loginCount = parseInt(localStorage.getItem('darkdrop_login_count') || '0')
  return loginCount <= 5
}
```

### Custom Styling

Override default styles by targeting the tooltip:

```css
/* Custom tooltip background */
.onboarding-tooltip {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

### Event Tracking

Add analytics tracking to step callbacks:

```javascript
afterShow: (context) => {
  // Track step viewed
  analytics.track('Onboarding Step Viewed', {
    stepId: 'encryption',
    stepNumber: 3
  })
}
```

## Best Practices

1. **Keep steps concise** - 2-3 sentences max per step
2. **Use engaging language** - Be friendly and helpful, not robotic
3. **Show value early** - Highlight key benefits in first few steps
4. **Make it skippable** - Always provide easy exit
5. **Test positioning** - Verify tooltips work on all screen sizes
6. **Update context** - Keep context fresh as user navigates
7. **Progressive disclosure** - Start simple, add detail gradually
8. **Clear CTAs** - Make action buttons obvious

## Troubleshooting

### Tour not appearing
- Check `localStorage.getItem('darkdrop_login_count')`
- Verify user is authenticated
- Check `onboardingManager.shouldShowOnboarding()`

### Element not highlighting
- Verify data attribute exists on target element
- Check CSS selector in step configuration
- Use browser DevTools to find correct selector

### Tooltip positioning off
- Check viewport boundaries
- Verify target element is visible
- Test different `position` values

### State not persisting
- Check localStorage is enabled
- Verify no errors in console
- Try `onboardingManager.saveState()` manually

## Future Enhancements

- [ ] Multi-language support
- [ ] Video/GIF embeds in steps
- [ ] Interactive challenges (e.g., "Upload a file to continue")
- [ ] Branching paths based on user type
- [ ] Analytics dashboard for completion rates
- [ ] A/B testing different tour variations
- [ ] Keyboard navigation support
- [ ] Mobile-optimized responsive design
