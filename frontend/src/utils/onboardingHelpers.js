/**
 * Helper utilities for onboarding system
 * Provides convenience functions for testing, debugging, and managing onboarding
 */

import { onboardingManager } from './onboarding'

/**
 * Developer tools for testing onboarding
 * Access via window.DarkDropOnboarding in browser console
 */
export const onboardingDevTools = {
  /**
   * Force show onboarding (bypass all conditions)
   */
  forceShow: () => {
    onboardingManager.reset()
    onboardingManager.start({
      user: { name: 'Test User' },
      accounts: [{ id: '1', name: 'Test Account' }],
      currentPath: window.location.pathname,
      hasAccounts: true
    })
    console.log('[Onboarding DevTools] Tour started')
  },

  /**
   * Skip to specific step
   */
  goToStep: (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < onboardingManager.getValidSteps().length) {
      onboardingManager.currentStepIndex = stepIndex
      onboardingManager.saveState()
      onboardingManager.notifyListeners()
      console.log('[Onboarding DevTools] Jumped to step', stepIndex)
    } else {
      console.error('[Onboarding DevTools] Invalid step index:', stepIndex)
    }
  },

  /**
   * Reset all onboarding state
   */
  reset: () => {
    onboardingManager.reset()
    console.log('[Onboarding DevTools] State reset')
  },

  /**
   * Get current state
   */
  getState: () => {
    return {
      currentStep: onboardingManager.getCurrentStep(),
      currentStepIndex: onboardingManager.currentStepIndex,
      completed: onboardingManager.completed,
      skipped: onboardingManager.skipped,
      progress: onboardingManager.getProgress()
    }
  },

  /**
   * List all steps
   */
  listSteps: () => {
    const steps = onboardingManager.getValidSteps()
    console.table(steps.map((s, i) => ({
      index: i,
      id: s.id,
      title: s.title,
      target: s.target || 'center'
    })))
  },

  /**
   * Simulate new user (first login)
   */
  simulateNewUser: () => {
    localStorage.setItem('darkdrop_login_count', '1')
    onboardingManager.reset()
    console.log('[Onboarding DevTools] Simulated new user (login count: 1)')
  },

  /**
   * Simulate returning user
   */
  simulateReturningUser: () => {
    localStorage.setItem('darkdrop_login_count', '5')
    console.log('[Onboarding DevTools] Simulated returning user (login count: 5)')
  },

  /**
   * Check if tour should show
   */
  shouldShow: () => {
    const result = onboardingManager.shouldShowOnboarding()
    console.log('[Onboarding DevTools] Should show onboarding:', result)
    return result
  },

  /**
   * Mark as completed
   */
  complete: () => {
    onboardingManager.complete()
    console.log('[Onboarding DevTools] Tour marked as completed')
  }
}

/**
 * Analytics tracking for onboarding
 */
export class OnboardingAnalytics {
  constructor() {
    this.events = []
    this.startTime = null
    this.stepTimes = {}
  }

  /**
   * Track tour start
   */
  trackStart() {
    this.startTime = Date.now()
    this.events.push({
      event: 'onboarding_started',
      timestamp: this.startTime
    })
    console.log('[Onboarding Analytics] Tour started')
  }

  /**
   * Track step view
   */
  trackStepView(stepId, stepIndex) {
    const timestamp = Date.now()
    this.stepTimes[stepId] = timestamp

    this.events.push({
      event: 'onboarding_step_viewed',
      stepId,
      stepIndex,
      timestamp
    })

    console.log('[Onboarding Analytics] Step viewed:', stepId)
  }

  /**
   * Track step completion
   */
  trackStepComplete(stepId, stepIndex) {
    const timestamp = Date.now()
    const timeOnStep = this.stepTimes[stepId]
      ? timestamp - this.stepTimes[stepId]
      : 0

    this.events.push({
      event: 'onboarding_step_completed',
      stepId,
      stepIndex,
      timeOnStep,
      timestamp
    })

    console.log('[Onboarding Analytics] Step completed:', stepId, `(${timeOnStep}ms)`)
  }

  /**
   * Track tour completion
   */
  trackComplete() {
    const timestamp = Date.now()
    const totalTime = this.startTime ? timestamp - this.startTime : 0

    this.events.push({
      event: 'onboarding_completed',
      totalTime,
      timestamp
    })

    console.log('[Onboarding Analytics] Tour completed:', `${totalTime}ms`)

    // Send to analytics service
    this.sendToAnalytics()
  }

  /**
   * Track tour skip
   */
  trackSkip(stepId, stepIndex) {
    const timestamp = Date.now()
    const totalTime = this.startTime ? timestamp - this.startTime : 0

    this.events.push({
      event: 'onboarding_skipped',
      stepId,
      stepIndex,
      totalTime,
      timestamp
    })

    console.log('[Onboarding Analytics] Tour skipped at step:', stepId)

    // Send to analytics service
    this.sendToAnalytics()
  }

  /**
   * Send events to analytics service
   */
  sendToAnalytics() {
    // Send to your analytics provider (e.g., Google Analytics, Mixpanel, etc.)
    // Example: mixpanel.track('Onboarding Event', this.events)

    console.log('[Onboarding Analytics] Events:', this.events)

    // Store locally for debugging
    try {
      const existing = JSON.parse(localStorage.getItem('darkdrop_onboarding_analytics') || '[]')
      existing.push(...this.events)
      localStorage.setItem('darkdrop_onboarding_analytics', JSON.stringify(existing))
    } catch (error) {
      console.error('[Onboarding Analytics] Failed to store events:', error)
    }
  }

  /**
   * Get all tracked events
   */
  getEvents() {
    return this.events
  }

  /**
   * Clear analytics data
   */
  clear() {
    this.events = []
    this.startTime = null
    this.stepTimes = {}
    localStorage.removeItem('darkdrop_onboarding_analytics')
    console.log('[Onboarding Analytics] Data cleared')
  }
}

/**
 * Create singleton analytics instance
 */
export const onboardingAnalytics = new OnboardingAnalytics()

/**
 * Hook to integrate analytics with onboarding manager
 */
export const initializeOnboardingAnalytics = () => {
  let currentStepId = null

  onboardingManager.subscribe((state) => {
    const { currentStep, currentStepIndex, completed, skipped } = state

    // Track start
    if (currentStepIndex === 0 && currentStep && !currentStepId) {
      onboardingAnalytics.trackStart()
    }

    // Track step view
    if (currentStep && currentStep.id !== currentStepId) {
      if (currentStepId) {
        onboardingAnalytics.trackStepComplete(currentStepId, currentStepIndex - 1)
      }
      onboardingAnalytics.trackStepView(currentStep.id, currentStepIndex)
      currentStepId = currentStep.id
    }

    // Track completion
    if (completed) {
      if (currentStepId) {
        onboardingAnalytics.trackStepComplete(currentStepId, currentStepIndex)
      }
      onboardingAnalytics.trackComplete()
      currentStepId = null
    }

    // Track skip
    if (skipped) {
      onboardingAnalytics.trackSkip(currentStepId, currentStepIndex)
      currentStepId = null
    }
  })
}

/**
 * Get onboarding completion statistics
 */
export const getOnboardingStats = () => {
  try {
    const events = JSON.parse(localStorage.getItem('darkdrop_onboarding_analytics') || '[]')

    const stats = {
      totalStarts: events.filter(e => e.event === 'onboarding_started').length,
      totalCompletions: events.filter(e => e.event === 'onboarding_completed').length,
      totalSkips: events.filter(e => e.event === 'onboarding_skipped').length,
      averageCompletionTime: 0,
      stepViews: {}
    }

    // Calculate average completion time
    const completionTimes = events
      .filter(e => e.event === 'onboarding_completed')
      .map(e => e.totalTime)

    if (completionTimes.length > 0) {
      stats.averageCompletionTime = completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
    }

    // Count step views
    events
      .filter(e => e.event === 'onboarding_step_viewed')
      .forEach(e => {
        stats.stepViews[e.stepId] = (stats.stepViews[e.stepId] || 0) + 1
      })

    return stats
  } catch (error) {
    console.error('[Onboarding Stats] Failed to calculate stats:', error)
    return null
  }
}

/**
 * Export dev tools to window for browser console access
 */
if (typeof window !== 'undefined') {
  window.DarkDropOnboarding = onboardingDevTools
}

export default {
  devTools: onboardingDevTools,
  analytics: onboardingAnalytics,
  initializeAnalytics: initializeOnboardingAnalytics,
  getStats: getOnboardingStats
}
