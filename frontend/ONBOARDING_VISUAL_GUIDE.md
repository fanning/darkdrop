# Onboarding System - Visual Guide

## What Users See

### Step 1: Welcome Screen (Center Modal)

```
┌─────────────────────────────────────────────────────────────┐
│                     DARK BACKDROP                           │
│                                                             │
│            ┌──────────────────────────────┐                │
│            │ ▰▰▱▱▱▱▱ (Progress: 14%)     │×               │
│            │                               │                │
│            │ Step 1 of 7                  │                │
│            │                               │                │
│            │ 👋 Welcome to DarkDrop!      │                │
│            │                               │                │
│            │ Your secure, enterprise-grade│                │
│            │ file storage platform. Let's │                │
│            │ take a quick tour of the key │                │
│            │ features that keep your data │                │
│            │ safe.                        │                │
│            │                               │                │
│            │           ┌──────────────┐   │                │
│            │           │  Start Tour  │   │                │
│            │           └──────────────┘   │                │
│            │           ┌──────────────┐   │                │
│            │           │  Skip Tour   │   │                │
│            │           └──────────────┘   │                │
│            └──────────────────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 2: Accounts Overview (Bottom Tooltip)

```
Dashboard Page
┌─────────────────────────────────────────────────────────────┐
│  DarkDrop                                          Logout    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Your Accounts                                               │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ← HIGHLIGHTED         │
│  │ Account 1    │  │ Account 2    │     (Pulsing glow)     │
│  │ example.com  │  │ test.com     │                         │
│  │ Role: admin  │  │ Role: read   │                         │
│  └──────────────┘  └──────────────┘                         │
│           │                                                  │
│           ▼ (Arrow pointer)                                 │
│  ┌────────────────────────────────────────┐                │
│  │ ▰▰▰▱▱▱▱ (Progress: 28%)              │×                │
│  │                                        │                 │
│  │ Step 2 of 7                           │                 │
│  │                                        │                 │
│  │ 📁 Your Accounts                      │                 │
│  │                                        │                 │
│  │ Each account represents a secure      │                 │
│  │ storage space. Click on an account    │                 │
│  │ to access its files. Your role        │                 │
│  │ determines what you can do (admin,    │                 │
│  │ read-only, etc.).                     │                 │
│  │                                        │                 │
│  │   ┌──────┐ ┌──────┐ ┌──────┐         │                 │
│  │   │ Back │ │ Next │ │ Skip │         │                 │
│  │   └──────┘ └──────┘ └──────┘         │                 │
│  └────────────────────────────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Step 3: Encryption Feature (Top Tooltip)

```
Dashboard Page
┌─────────────────────────────────────────────────────────────┐
│                                                              │
│  Enterprise-Grade Security Features                         │
│                                                              │
│  ┌────────────────────────────────────────┐                │
│  │ ▰▰▰▰▱▱▱ (Progress: 42%)              │×                │
│  │                                        │                 │
│  │ Step 3 of 7                           │                 │
│  │                                        │                 │
│  │ 🔒 Enterprise Encryption              │                 │
│  │                                        │                 │
│  │ All your files are automatically      │                 │
│  │ encrypted with AES-256 encryption at  │                 │
│  │ rest. This means your data is         │                 │
│  │ unreadable without proper             │                 │
│  │ authorization.                        │                 │
│  │                                        │                 │
│  │   ┌──────┐ ┌──────┐ ┌──────┐         │                 │
│  │   │ Back │ │ Next │ │ Skip │         │                 │
│  │   └──────┘ └──────┘ └──────┘         │                 │
│  └────────────────────────────────────────┘                │
│           ▲ (Arrow pointer)                                 │
│           │                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │      🔒      │  │      📚      │  │      📋      │     │
│  │  HIGHLIGHTED │  │   Version    │  │  Audit Trail │     │
│  │  (Pulsing)   │  │   History    │  │              │     │
│  │  Encrypted   │  │   Never lose │  │  Track every │     │
│  │  at Rest     │  │   work       │  │  access      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Step 6: Upload Files (File Browser)

```
File Browser Page
┌─────────────────────────────────────────────────────────────┐
│  DarkDrop - Account 1                            Logout      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────┐  ← HIGHLIGHTED      │
│  │            Upload Zone             │    (Pulsing glow)   │
│  │                                    │                      │
│  │              +                     │                      │
│  │                                    │                      │
│  │  Click to upload or drag and drop │                      │
│  │                                    │                      │
│  │  ✓ Encrypted  ✓ Versions  ✓ Track│                      │
│  │                                    │                      │
│  │     Max file size: 5GB            │                      │
│  └────────────────────────────────────┘                     │
│           │                                                  │
│           ▼ (Arrow pointer)                                 │
│  ┌────────────────────────────────────────┐                │
│  │ ▰▰▰▰▰▰▱ (Progress: 85%)              │×                │
│  │                                        │                 │
│  │ Step 6 of 7                           │                 │
│  │                                        │                 │
│  │ 📤 Upload Files                       │                 │
│  │                                        │                 │
│  │ Upload files by clicking the upload   │                 │
│  │ button or drag-and-drop them          │                 │
│  │ directly. Large files? No problem -   │                 │
│  │ we support chunked uploads for files  │                 │
│  │ of any size.                          │                 │
│  │                                        │                 │
│  │   ┌──────┐ ┌──────┐ ┌──────┐         │                 │
│  │   │ Back │ │ Next │ │ Skip │         │                 │
│  │   └──────┘ └──────┘ └──────┘         │                 │
│  └────────────────────────────────────────┘                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Step 7: Completion (Center Modal)

```
┌─────────────────────────────────────────────────────────────┐
│                     DARK BACKDROP                           │
│                                                             │
│            ┌──────────────────────────────┐                │
│            │ ▰▰▰▰▰▰▰ (Progress: 100%)    │×               │
│            │                               │                │
│            │ Step 7 of 7                  │                │
│            │                               │                │
│            │ ✅ You're All Set!           │                │
│            │                               │                │
│            │ You now know the basics of   │                │
│            │ DarkDrop. Start uploading    │                │
│            │ files and enjoy enterprise-  │                │
│            │ grade security. Need help?   │                │
│            │ Check the documentation or   │                │
│            │ contact support.             │                │
│            │                               │                │
│            │         ┌──────────────┐     │                │
│            │         │ Get Started  │     │                │
│            │         └──────────────┘     │                │
│            └──────────────────────────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Animations

### Entrance Animation
```
Backdrop:     Fade in (0 → 100% opacity in 0.3s)
Tooltip:      Slide up + fade in (0.4s ease-out)
```

### Element Highlighting
```
Target:       Pulse effect with glowing border
              Box shadow: 0-4px-8px in blue
              Animation: 1.5s infinite ease-in-out
```

### Progress Bar
```
Fill:         Smooth width transition (0.3s)
Color:        Blue (#007bff)
```

### Button Hover
```
Transform:    translateY(-2px)
Shadow:       Elevation effect
Duration:     0.2s
```

## Color Scheme

### Tooltip
- Background: `#ffffff` (white)
- Text: `#000000` (black)
- Border: None (clean modern look)
- Shadow: `0 8px 32px rgba(0,0,0,0.3)`

### Backdrop
- Background: `rgba(0, 0, 0, 0.6)` (60% black)
- Blur: Optional backdrop-filter

### Progress Bar
- Track: `#e0e0e0` (light gray)
- Fill: `#007bff` (blue)

### Buttons
- Primary: `#007bff` (blue) / white text
- Secondary: `#f0f0f0` (light gray) / dark text
- Danger/Skip: `transparent` / gray text

### Highlight
- Glow: `rgba(0, 123, 255, 0.5)` (blue 50% opacity)
- Border: 4px solid blue with pulse

## Positioning Examples

### Center Modal
```
Position: Fixed
Top: 50%
Left: 50%
Transform: translate(-50%, -50%)
```

### Bottom Tooltip
```
Position: Fixed
Top: target.bottom + 20px
Left: target.left + (target.width / 2) - (tooltip.width / 2)

Arrow: Top center, pointing up
```

### Top Tooltip
```
Position: Fixed
Top: target.top - tooltip.height - 20px
Left: target.left + (target.width / 2) - (tooltip.width / 2)

Arrow: Bottom center, pointing down
```

### Viewport Boundary Handling
```
if tooltip.right > viewport.width:
  left = viewport.width - tooltip.width - 20px

if tooltip.bottom > viewport.height:
  top = viewport.height - tooltip.height - 20px

if tooltip.top < 0:
  top = 20px

if tooltip.left < 0:
  left = 20px
```

## Responsive Behavior

### Desktop (> 1200px)
- Tooltip width: 350-500px
- Font size: 15-20px
- Spacing: Generous

### Tablet (768px - 1200px)
- Tooltip width: 300-400px
- Font size: 14-18px
- Spacing: Medium

### Mobile (< 768px)
- Tooltip width: 90% viewport
- Font size: 14-16px
- Position: Bottom or center preferred
- Touch-friendly buttons (min 44px)

## User Interactions

### Dismissal Options
1. Click "Skip" button
2. Click backdrop (dark area)
3. Click × close button (top right)
4. Complete all steps

### Navigation
- "Next" button → Next step
- "Back" button → Previous step (appears from step 2+)
- "Get Started" → Complete tour (final step)

### State Persistence
- Completion status saved to localStorage
- Skip status saved to localStorage
- Current step saved to localStorage
- Survives page refresh and browser restart

## Accessibility Considerations

### Future Enhancements
- [ ] ARIA labels for screen readers
- [ ] Keyboard navigation (Tab, Arrow keys, Esc)
- [ ] Focus management (trap focus in modal)
- [ ] High contrast mode support
- [ ] Reduced motion mode (disable animations)
- [ ] Text size scaling support

### Current Implementation
- Clear visual hierarchy
- Readable font sizes
- High contrast text
- Clickable areas > 44px
- Non-essential (skippable)

## Performance

### Optimizations
- Tooltip position calculated once per step
- CSS animations (GPU accelerated)
- Minimal re-renders (subscribe pattern)
- LocalStorage for state (no API calls)
- Lazy loading (component only loads when needed)

### Metrics
- First paint: < 100ms
- Animation frame rate: 60fps
- Storage size: < 5KB
- Memory footprint: Minimal

---

This visual guide shows exactly what users experience during the onboarding tour!
