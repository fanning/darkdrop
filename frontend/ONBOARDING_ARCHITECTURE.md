# Onboarding System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DarkDrop Application                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │   App.jsx    │────────▶│ OnboardingTour.jsx                 │
│  │              │         │                                     │
│  │ - Context    │         │ - Tooltip UI                       │
│  │ - Analytics  │         │ - Positioning                      │
│  └──────────────┘         │ - Animations                       │
│         │                 │ - Highlighting                     │
│         │                 └──────────────┘                     │
│         │                         │                             │
│         ▼                         ▼                             │
│  ┌──────────────────────────────────────────┐                  │
│  │     onboarding.js (State Manager)        │                  │
│  │                                           │                  │
│  │  ┌────────────────────────────────┐      │                  │
│  │  │   OnboardingManager Class      │      │                  │
│  │  │                                │      │                  │
│  │  │ - currentStepIndex             │      │                  │
│  │  │ - completed                    │      │                  │
│  │  │ - skipped                      │      │                  │
│  │  │ - context                      │      │                  │
│  │  │                                │      │                  │
│  │  │ Methods:                       │      │                  │
│  │  │ - start()                      │      │                  │
│  │  │ - next()                       │      │                  │
│  │  │ - previous()                   │      │                  │
│  │  │ - skip()                       │      │                  │
│  │  │ - complete()                   │      │                  │
│  │  │ - subscribe()                  │      │                  │
│  │  └────────────────────────────────┘      │                  │
│  │                                           │                  │
│  │  ┌────────────────────────────────┐      │                  │
│  │  │   ONBOARDING_STEPS Array       │      │                  │
│  │  │                                │      │                  │
│  │  │  Step 1: Welcome               │      │                  │
│  │  │  Step 2: Accounts              │      │                  │
│  │  │  Step 3: Encryption            │      │                  │
│  │  │  Step 4: Version History       │      │                  │
│  │  │  Step 5: Audit Trail           │      │                  │
│  │  │  Step 6: Upload Files          │      │                  │
│  │  │  Step 7: Complete              │      │                  │
│  │  └────────────────────────────────┘      │                  │
│  └──────────────────────────────────────────┘                  │
│                    │                                             │
│                    ▼                                             │
│  ┌──────────────────────────────────────────┐                  │
│  │   onboardingHelpers.js                   │                  │
│  │                                           │                  │
│  │  ┌────────────────────────────────┐      │                  │
│  │  │   Dev Tools                    │      │                  │
│  │  │   - forceShow()                │      │                  │
│  │  │   - reset()                    │      │                  │
│  │  │   - goToStep()                 │      │                  │
│  │  │   - getState()                 │      │                  │
│  │  └────────────────────────────────┘      │                  │
│  │                                           │                  │
│  │  ┌────────────────────────────────┐      │                  │
│  │  │   OnboardingAnalytics          │      │                  │
│  │  │   - trackStart()               │      │                  │
│  │  │   - trackStepView()            │      │                  │
│  │  │   - trackComplete()            │      │                  │
│  │  │   - trackSkip()                │      │                  │
│  │  └────────────────────────────────┘      │                  │
│  └──────────────────────────────────────────┘                  │
│                    │                                             │
│                    ▼                                             │
│  ┌──────────────────────────────────────────┐                  │
│  │          localStorage                    │                  │
│  │                                           │                  │
│  │  - darkdrop_onboarding_state             │                  │
│  │  - darkdrop_onboarding_analytics         │                  │
│  │  - darkdrop_login_count                  │                  │
│  └──────────────────────────────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Initialization
```
App.jsx (mount)
    │
    ├─▶ initializeOnboardingAnalytics()
    │       │
    │       └─▶ onboardingManager.subscribe()
    │
    └─▶ onboardingManager.loadState()
            │
            └─▶ localStorage.getItem('darkdrop_onboarding_state')
```

### 2. Starting Tour
```
User Login
    │
    ├─▶ loginCount++
    │
    └─▶ shouldShowOnboarding()
            │
            ├─▶ loginCount <= 2? ──▶ YES ──▶ onboardingManager.start()
            │                                        │
            │                                        ├─▶ currentStepIndex = 0
            │                                        ├─▶ notifyListeners()
            │                                        └─▶ saveState()
            │
            └─▶ NO ──▶ Don't show
```

### 3. Step Navigation
```
User clicks "Next"
    │
    └─▶ onboardingManager.next()
            │
            ├─▶ Call currentStep.afterShow()
            │
            ├─▶ Find next valid step
            │       │
            │       └─▶ Check beforeShow() condition
            │
            ├─▶ currentStepIndex++
            │
            ├─▶ notifyListeners()
            │       │
            │       └─▶ All subscribers receive new state
            │               │
            │               └─▶ OnboardingTour.jsx re-renders
            │
            └─▶ saveState()
                    │
                    └─▶ localStorage.setItem()
```

### 4. State Updates
```
onboardingManager.notifyListeners()
    │
    └─▶ For each subscriber:
            │
            ├─▶ OnboardingTour component
            │       │
            │       ├─▶ setState(newState)
            │       ├─▶ calculateTooltipPosition()
            │       └─▶ Render new step
            │
            └─▶ Analytics tracker
                    │
                    ├─▶ trackStepView()
                    └─▶ Store event to localStorage
```

## Component Interaction

### OnboardingTour.jsx ↔ onboarding.js

```
┌─────────────────────────────┐
│   OnboardingTour.jsx        │
│                             │
│  useEffect(() => {          │
│    onboardingManager        │
│      .subscribe(            │
│        (newState) => {      │
│          setState(newState) │◀──┐
│        }                    │   │
│      )                      │   │
│  })                         │   │
│                             │   │
│  handleAction(action) {     │   │
│    onboardingManager        │   │
│      .next() ──────────────▶│───┘ Triggers subscribers
│  }                          │
│                             │
└─────────────────────────────┘
```

### Context Flow

```
App.jsx
    │
    └─▶ onboardingContext = {
            user,
            accounts,
            currentPath,
            hasAccounts
        }
            │
            └─▶ OnboardingTour
                    │
                    └─▶ onboardingManager.updateContext(context)
                            │
                            └─▶ Used in beforeShow() conditions
```

## State Machine

```
┌─────────┐
│  IDLE   │
│         │
└────┬────┘
     │ start()
     ▼
┌─────────┐
│ ACTIVE  │◀────┐
│         │     │
└────┬────┘     │
     │          │
     ├─ next()──┘
     │
     ├─ skip() ──▶ ┌─────────┐
     │             │ SKIPPED │
     │             └─────────┘
     │
     └─ complete() ──▶ ┌───────────┐
                       │ COMPLETED │
                       └───────────┘
```

## Step Configuration Schema

```javascript
{
  // Unique identifier
  id: String,

  // CSS selector for target element (null for center modal)
  target: String | null,

  // Step title
  title: String,

  // Step description
  content: String,

  // Tooltip position
  position: 'top' | 'bottom' | 'left' | 'right' | 'center',

  // Action buttons
  actions: [
    {
      label: String,
      primary: Boolean,
      action: 'next' | 'previous' | 'skip' | 'complete'
    }
  ],

  // Conditional rendering
  beforeShow: (context) => Boolean,

  // Post-show callback
  afterShow: (context) => void
}
```

## Analytics Event Schema

```javascript
{
  // Event type
  event: 'onboarding_started' | 'onboarding_step_viewed' |
         'onboarding_step_completed' | 'onboarding_completed' |
         'onboarding_skipped',

  // Step identifier
  stepId: String,

  // Step index
  stepIndex: Number,

  // Time spent (ms)
  timeOnStep: Number,
  totalTime: Number,

  // Timestamp
  timestamp: Number
}
```

## Storage Schema

### darkdrop_onboarding_state
```javascript
{
  completed: Boolean,
  skipped: Boolean,
  currentStepIndex: Number,
  lastUpdated: ISO8601String
}
```

### darkdrop_onboarding_analytics
```javascript
[
  {
    event: String,
    stepId: String,
    stepIndex: Number,
    timestamp: Number,
    ...additionalData
  },
  ...
]
```

## Positioning Algorithm

```
1. Check if step.position === 'center'
   ├─▶ YES: Center modal (50%, 50%)
   └─▶ NO: Continue to step 2

2. Find target element
   ├─▶ NOT FOUND: Fallback to center
   └─▶ FOUND: Continue to step 3

3. Get target rect (getBoundingClientRect)

4. Calculate initial position based on step.position
   ├─▶ 'top': above target
   ├─▶ 'bottom': below target
   ├─▶ 'left': left of target
   └─▶ 'right': right of target

5. Adjust for viewport boundaries
   ├─▶ If tooltip goes off-screen top: clamp to 20px
   ├─▶ If tooltip goes off-screen left: clamp to 20px
   ├─▶ If tooltip goes off-screen bottom: clamp to viewport - height - 20px
   └─▶ If tooltip goes off-screen right: clamp to viewport - width - 20px

6. Apply position
   └─▶ setTooltipPosition({ top, left })

7. Highlight target element
   └─▶ Add 'onboarding-highlight' class with pulse animation
```

## Integration Points

### Entry Points
1. **App.jsx** - Main integration, context provider
2. **Dashboard.jsx** - Feature highlight targets
3. **FileBrowser.jsx** - Upload action target

### Exit Points
1. **localStorage** - State persistence
2. **Console** - Dev tools (window.DarkDropOnboarding)
3. **Analytics** - Event tracking (extensible to external services)

### Extension Points
1. **ONBOARDING_STEPS** - Add new steps
2. **beforeShow()** - Custom conditions
3. **afterShow()** - Custom callbacks
4. **onboardingAnalytics** - Connect to analytics service
5. **shouldShowOnboarding()** - Custom trigger logic

## Performance Considerations

### Optimizations
- **Lazy calculation** - Tooltip position calculated only when step changes
- **Event debouncing** - Window resize listeners debounced
- **Minimal re-renders** - Subscribe pattern prevents unnecessary updates
- **LocalStorage caching** - State persisted, not recalculated
- **Conditional rendering** - Steps filtered before rendering

### Memory Management
- **Cleanup** - Unsubscribe on component unmount
- **Event listeners** - Removed when component unmounts
- **Highlight classes** - Auto-removed after 2 seconds

## Error Handling

### Graceful Degradation
1. **Missing target** → Fallback to center modal
2. **Storage error** → Log error, continue without persistence
3. **Invalid step** → Skip to next valid step
4. **Listener error** → Catch and log, don't crash other listeners
5. **Analytics error** → Log error, don't block tour

### Validation
- Step index bounds checking
- Context validation before conditions
- Target element existence checks
- Position value validation

---

This architecture provides:
- ✅ **Separation of concerns** - Logic, UI, and tools separate
- ✅ **Extensibility** - Easy to add steps and features
- ✅ **Testability** - Dev tools for manual testing
- ✅ **Maintainability** - Clear structure and documentation
- ✅ **Performance** - Optimized rendering and storage
- ✅ **Reliability** - Error handling and fallbacks
