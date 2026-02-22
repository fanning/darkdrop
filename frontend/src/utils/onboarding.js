/**
 * DarkDrop Onboarding System
 *
 * Guides new users through critical features step-by-step
 * Features: Skippable, engaging, progress tracking, localStorage persistence
 */

export const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    target: null, // No specific target, center modal
    title: '👋 Welcome to DarkDrop!',
    content: 'Your secure, enterprise-grade file storage platform. Let\'s take a quick tour of the key features that keep your data safe.',
    position: 'center',
    actions: [
      { label: 'Start Tour', primary: true, action: 'next' },
      { label: 'Skip Tour', primary: false, action: 'skip' }
    ],
    beforeShow: null,
    afterShow: null
  },
  {
    id: 'accounts',
    target: '.account-card, .account-selector',
    title: '📁 Your Accounts',
    content: 'Each account represents a secure storage space. Click on an account to access its files. Your role determines what you can do (admin, read-only, etc.).',
    position: 'bottom',
    actions: [
      { label: 'Next', primary: true, action: 'next' },
      { label: 'Skip', primary: false, action: 'skip' }
    ],
    beforeShow: (context) => {
      // Only show if user has accounts
      return context.accounts && context.accounts.length > 0
    },
    afterShow: null
  },
  {
    id: 'encryption',
    target: '[data-feature="encryption"]',
    title: '🔒 Enterprise Encryption',
    content: 'All your files are automatically encrypted with AES-256 encryption at rest. This means your data is unreadable without proper authorization.',
    position: 'top',
    actions: [
      { label: 'Next', primary: true, action: 'next' },
      { label: 'Skip', primary: false, action: 'skip' }
    ],
    beforeShow: null,
    afterShow: null
  },
  {
    id: 'version-history',
    target: '[data-feature="version-history"]',
    title: '📚 Version History',
    content: 'Never lose work again! Every file change is automatically versioned, so you can restore previous versions anytime.',
    position: 'top',
    actions: [
      { label: 'Next', primary: true, action: 'next' },
      { label: 'Skip', primary: false, action: 'skip' }
    ],
    beforeShow: null,
    afterShow: null
  },
  {
    id: 'audit-trail',
    target: '[data-feature="audit-trail"]',
    title: '📋 Complete Audit Trail',
    content: 'Track every file access, modification, and download. Perfect for compliance and security monitoring.',
    position: 'top',
    actions: [
      { label: 'Next', primary: true, action: 'next' },
      { label: 'Skip', primary: false, action: 'skip' }
    ],
    beforeShow: null,
    afterShow: null
  },
  {
    id: 'upload-files',
    target: '.btn-primary, [data-action="upload"]',
    title: '📤 Upload Files',
    content: 'Upload files by clicking the upload button or drag-and-drop them directly. Large files? No problem - we support chunked uploads for files of any size.',
    position: 'bottom',
    actions: [
      { label: 'Next', primary: true, action: 'next' },
      { label: 'Skip', primary: false, action: 'skip' }
    ],
    beforeShow: (context) => {
      // Only show if user is on file browser page
      return context.currentPath && context.currentPath.includes('/files/')
    },
    afterShow: null
  },
  {
    id: 'complete',
    target: null,
    title: '✅ You\'re All Set!',
    content: 'You now know the basics of DarkDrop. Start uploading files and enjoy enterprise-grade security. Need help? Check the documentation or contact support.',
    position: 'center',
    actions: [
      { label: 'Get Started', primary: true, action: 'complete' }
    ],
    beforeShow: null,
    afterShow: (context) => {
      // Mark onboarding as completed
      if (context.onComplete) {
        context.onComplete()
      }
    }
  }
]

/**
 * Onboarding Manager Class
 * Handles state, progress, and step navigation
 */
export class OnboardingManager {
  constructor() {
    this.currentStepIndex = 0
    this.completed = false
    this.skipped = false
    this.listeners = []
    this.context = {}

    this.loadState()
  }

  /**
   * Load onboarding state from localStorage
   */
  loadState() {
    try {
      const state = localStorage.getItem('darkdrop_onboarding_state')
      if (state) {
        const parsed = JSON.parse(state)
        this.completed = parsed.completed || false
        this.skipped = parsed.skipped || false
        this.currentStepIndex = parsed.currentStepIndex || 0
      }
    } catch (error) {
      console.error('[Onboarding] Failed to load state:', error)
    }
  }

  /**
   * Save onboarding state to localStorage
   */
  saveState() {
    try {
      const state = {
        completed: this.completed,
        skipped: this.skipped,
        currentStepIndex: this.currentStepIndex,
        lastUpdated: new Date().toISOString()
      }
      localStorage.setItem('darkdrop_onboarding_state', JSON.stringify(state))
    } catch (error) {
      console.error('[Onboarding] Failed to save state:', error)
    }
  }

  /**
   * Check if onboarding should be shown
   */
  shouldShowOnboarding() {
    // Don't show if completed or skipped
    if (this.completed || this.skipped) {
      return false
    }

    // Check if user is new (first or second login)
    const loginCount = parseInt(localStorage.getItem('darkdrop_login_count') || '0')
    return loginCount <= 2
  }

  /**
   * Start the onboarding flow
   */
  start(context = {}) {
    this.context = context
    this.currentStepIndex = 0
    this.completed = false
    this.skipped = false
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Restart the onboarding flow (for testing or re-onboarding)
   */
  restart() {
    this.completed = false
    this.skipped = false
    this.currentStepIndex = 0
    this.saveState()
    this.start(this.context)
  }

  /**
   * Get the current step
   */
  getCurrentStep() {
    return ONBOARDING_STEPS[this.currentStepIndex]
  }

  /**
   * Get all valid steps (filtered by beforeShow conditions)
   */
  getValidSteps() {
    return ONBOARDING_STEPS.filter(step => {
      if (!step.beforeShow) return true
      return step.beforeShow(this.context)
    })
  }

  /**
   * Move to next step
   */
  next() {
    const currentStep = this.getCurrentStep()

    // Call afterShow hook
    if (currentStep && currentStep.afterShow) {
      currentStep.afterShow(this.context)
    }

    // Find next valid step
    let nextIndex = this.currentStepIndex + 1
    while (nextIndex < ONBOARDING_STEPS.length) {
      const nextStep = ONBOARDING_STEPS[nextIndex]
      if (!nextStep.beforeShow || nextStep.beforeShow(this.context)) {
        this.currentStepIndex = nextIndex
        this.saveState()
        this.notifyListeners()
        return
      }
      nextIndex++
    }

    // No more valid steps, complete onboarding
    this.complete()
  }

  /**
   * Move to previous step
   */
  previous() {
    if (this.currentStepIndex > 0) {
      // Find previous valid step
      let prevIndex = this.currentStepIndex - 1
      while (prevIndex >= 0) {
        const prevStep = ONBOARDING_STEPS[prevIndex]
        if (!prevStep.beforeShow || prevStep.beforeShow(this.context)) {
          this.currentStepIndex = prevIndex
          this.saveState()
          this.notifyListeners()
          return
        }
        prevIndex--
      }
    }
  }

  /**
   * Skip the onboarding
   */
  skip() {
    this.skipped = true
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Complete the onboarding
   */
  complete() {
    const currentStep = this.getCurrentStep()

    // Call afterShow hook for final step
    if (currentStep && currentStep.afterShow) {
      currentStep.afterShow(this.context)
    }

    this.completed = true
    this.saveState()
    this.notifyListeners()
  }

  /**
   * Update context (e.g., when user navigates to different page)
   */
  updateContext(newContext) {
    this.context = { ...this.context, ...newContext }
  }

  /**
   * Subscribe to onboarding state changes
   */
  subscribe(listener) {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener)
    }
  }

  /**
   * Notify all listeners of state change
   */
  notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener({
          currentStep: this.getCurrentStep(),
          currentStepIndex: this.currentStepIndex,
          totalSteps: ONBOARDING_STEPS.length,
          completed: this.completed,
          skipped: this.skipped,
          progress: ((this.currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100
        })
      } catch (error) {
        console.error('[Onboarding] Listener error:', error)
      }
    })
  }

  /**
   * Get progress percentage
   */
  getProgress() {
    return ((this.currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100
  }

  /**
   * Reset onboarding (clear all state)
   */
  reset() {
    this.currentStepIndex = 0
    this.completed = false
    this.skipped = false
    localStorage.removeItem('darkdrop_onboarding_state')
    this.notifyListeners()
  }
}

// Create singleton instance
export const onboardingManager = new OnboardingManager()

// Export helper functions
export const startOnboarding = (context) => onboardingManager.start(context)
export const skipOnboarding = () => onboardingManager.skip()
export const completeOnboarding = () => onboardingManager.complete()
export const resetOnboarding = () => onboardingManager.reset()
export const shouldShowOnboarding = () => onboardingManager.shouldShowOnboarding()
