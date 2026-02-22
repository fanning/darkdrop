import React, { useState, useEffect, useRef } from 'react'
import { onboardingManager } from '../utils/onboarding'

function OnboardingTour({ context, onComplete }) {
  const [state, setState] = useState({
    currentStep: null,
    currentStepIndex: 0,
    totalSteps: 0,
    completed: false,
    skipped: false,
    progress: 0
  })
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const tooltipRef = useRef(null)

  useEffect(() => {
    // Update context when it changes
    if (context) {
      onboardingManager.updateContext({
        ...context,
        onComplete: handleComplete
      })
    }

    // Subscribe to onboarding state changes
    const unsubscribe = onboardingManager.subscribe((newState) => {
      setState(newState)

      // Calculate tooltip position when step changes
      if (newState.currentStep && !newState.completed && !newState.skipped) {
        setTimeout(() => calculateTooltipPosition(newState.currentStep), 100)
      }
    })

    // Initial state
    if (onboardingManager.shouldShowOnboarding()) {
      onboardingManager.start(context)
    }

    return unsubscribe
  }, [context])

  const calculateTooltipPosition = (step) => {
    if (!step.target || step.position === 'center') {
      // Center modal
      setTooltipPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' })
      return
    }

    // Find target element
    const targetElement = document.querySelector(step.target)
    if (!targetElement) {
      console.warn('[Onboarding] Target element not found:', step.target)
      setTooltipPosition({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' })
      return
    }

    const rect = targetElement.getBoundingClientRect()
    const tooltipWidth = 350
    const tooltipHeight = 200
    const spacing = 20

    let position = {}

    switch (step.position) {
      case 'top':
        position = {
          top: `${rect.top - tooltipHeight - spacing}px`,
          left: `${rect.left + (rect.width / 2) - (tooltipWidth / 2)}px`
        }
        break
      case 'bottom':
        position = {
          top: `${rect.bottom + spacing}px`,
          left: `${rect.left + (rect.width / 2) - (tooltipWidth / 2)}px`
        }
        break
      case 'left':
        position = {
          top: `${rect.top + (rect.height / 2) - (tooltipHeight / 2)}px`,
          left: `${rect.left - tooltipWidth - spacing}px`
        }
        break
      case 'right':
        position = {
          top: `${rect.top + (rect.height / 2) - (tooltipHeight / 2)}px`,
          left: `${rect.right + spacing}px`
        }
        break
      default:
        position = {
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }
    }

    // Ensure tooltip stays within viewport
    const maxTop = window.innerHeight - tooltipHeight - 20
    const maxLeft = window.innerWidth - tooltipWidth - 20

    if (parseInt(position.top) > maxTop) position.top = `${maxTop}px`
    if (parseInt(position.top) < 20) position.top = '20px'
    if (parseInt(position.left) > maxLeft) position.left = `${maxLeft}px`
    if (parseInt(position.left) < 20) position.left = '20px'

    setTooltipPosition(position)

    // Highlight target element
    targetElement.classList.add('onboarding-highlight')
    setTimeout(() => {
      targetElement.classList.remove('onboarding-highlight')
    }, 2000)
  }

  const handleAction = (action) => {
    switch (action) {
      case 'next':
        onboardingManager.next()
        break
      case 'previous':
        onboardingManager.previous()
        break
      case 'skip':
        onboardingManager.skip()
        break
      case 'complete':
        onboardingManager.complete()
        break
      default:
        console.warn('[Onboarding] Unknown action:', action)
    }
  }

  const handleComplete = () => {
    if (onComplete) {
      onComplete()
    }
  }

  // Don't render if onboarding is completed or skipped
  if (state.completed || state.skipped || !state.currentStep) {
    return null
  }

  const step = state.currentStep
  const isCenterModal = !step.target || step.position === 'center'

  return (
    <>
      {/* Backdrop overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 9998,
          animation: 'fadeIn 0.3s ease-in'
        }}
        onClick={() => handleAction('skip')}
      />

      {/* Onboarding tooltip */}
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          ...tooltipPosition,
          backgroundColor: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          zIndex: 9999,
          maxWidth: isCenterModal ? '500px' : '350px',
          minHeight: isCenterModal ? 'auto' : '150px',
          animation: 'slideUp 0.4s ease-out',
          color: '#000'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            backgroundColor: '#e0e0e0',
            borderRadius: '12px 12px 0 0',
            overflow: 'hidden'
          }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: '#007bff',
              width: `${state.progress}%`,
              transition: 'width 0.3s ease-in-out'
            }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={() => handleAction('skip')}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'transparent',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666',
            padding: '4px',
            lineHeight: 1
          }}
          title="Skip tour"
        >
          ×
        </button>

        {/* Step counter */}
        <div
          style={{
            fontSize: '12px',
            color: '#888',
            marginBottom: '12px',
            fontWeight: '500'
          }}
        >
          Step {state.currentStepIndex + 1} of {state.totalSteps}
        </div>

        {/* Title */}
        <h3
          style={{
            margin: '0 0 16px 0',
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#000'
          }}
        >
          {step.title}
        </h3>

        {/* Content */}
        <p
          style={{
            margin: '0 0 24px 0',
            fontSize: '15px',
            lineHeight: '1.6',
            color: '#333'
          }}
        >
          {step.content}
        </p>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            alignItems: 'center'
          }}
        >
          {/* Previous button (if not first step) */}
          {state.currentStepIndex > 0 && (
            <button
              onClick={() => handleAction('previous')}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: 'transparent',
                color: '#007bff',
                border: '1px solid #007bff',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              Back
            </button>
          )}

          {/* Action buttons */}
          {step.actions && step.actions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleAction(action.action)}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                backgroundColor: action.primary ? '#007bff' : 'transparent',
                color: action.primary ? '#fff' : '#666',
                border: action.primary ? 'none' : '1px solid #ccc',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              {action.label}
            </button>
          ))}
        </div>

        {/* Pointer arrow for non-center tooltips */}
        {!isCenterModal && step.position !== 'center' && (
          <div
            style={{
              position: 'absolute',
              width: 0,
              height: 0,
              borderStyle: 'solid',
              ...(step.position === 'top' && {
                bottom: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                borderWidth: '10px 10px 0 10px',
                borderColor: '#fff transparent transparent transparent'
              }),
              ...(step.position === 'bottom' && {
                top: '-10px',
                left: '50%',
                transform: 'translateX(-50%)',
                borderWidth: '0 10px 10px 10px',
                borderColor: 'transparent transparent #fff transparent'
              }),
              ...(step.position === 'left' && {
                right: '-10px',
                top: '50%',
                transform: 'translateY(-50%)',
                borderWidth: '10px 0 10px 10px',
                borderColor: 'transparent transparent transparent #fff'
              }),
              ...(step.position === 'right' && {
                left: '-10px',
                top: '50%',
                transform: 'translateY(-50%)',
                borderWidth: '10px 10px 10px 0',
                borderColor: 'transparent #fff transparent transparent'
              })
            }}
          />
        )}
      </div>

      {/* Styles */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            transform: ${isCenterModal ? 'translate(-50%, -40%)' : 'translateY(20px)'};
            opacity: 0;
          }
          to {
            transform: ${isCenterModal ? 'translate(-50%, -50%)' : 'translateY(0)'};
            opacity: 1;
          }
        }

        .onboarding-highlight {
          position: relative;
          z-index: 9997;
          box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.5),
                      0 0 0 8px rgba(0, 123, 255, 0.3) !important;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.5),
                        0 0 0 8px rgba(0, 123, 255, 0.3);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(0, 123, 255, 0.6),
                        0 0 0 12px rgba(0, 123, 255, 0.2);
          }
        }
      `}</style>
    </>
  )
}

export default OnboardingTour
