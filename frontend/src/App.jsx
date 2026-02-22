import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import FileBrowser from './components/FileBrowser'
import NotificationBanner from './components/NotificationBanner'
import OnboardingTour from './components/OnboardingTour'
import LandingPage from './pages/LandingPage'
import { initializeOnboardingAnalytics } from './utils/onboardingHelpers'

// Analytics tracking hook
function usePageTracking() {
  const location = useLocation()

  useEffect(() => {
    // Get or create session ID
    let sessionId = sessionStorage.getItem('darkdrop_session_id')
    if (!sessionId) {
      sessionId = crypto.randomUUID()
      sessionStorage.setItem('darkdrop_session_id', sessionId)
    }

    // Track page view
    const trackPageView = async () => {
      try {
        const token = localStorage.getItem('darkdrop_token')
        await fetch('/api/analytics/pageview', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            session_id: sessionId,
            page_path: location.pathname,
            referrer: document.referrer
          })
        })
        console.log('[Analytics] Page view tracked:', location.pathname)
      } catch (error) {
        console.error('[Analytics] Failed to track page view:', error)
      }
    }

    trackPageView()
  }, [location])
}

function AppRoutes({ token, user, accounts, handleLogin, handleLogout, onboardingContext }) {
  usePageTracking()

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            token ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />
          }
        />
        <Route
          path="/register"
          element={
            token ? <Navigate to="/dashboard" /> : <Register />
          }
        />
        <Route
          path="/dashboard"
          element={
            token ? (
              <Dashboard
                user={user}
                accounts={accounts}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/files/:accountId"
          element={
            token ? (
              <FileBrowser
                user={user}
                accounts={accounts}
                token={token}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route path="/" element={token ? <Navigate to="/dashboard" /> : <LandingPage />} />
      </Routes>

      {/* Onboarding Tour - only shown when authenticated */}
      {token && (
        <OnboardingTour
          context={onboardingContext}
          onComplete={() => console.log('[Onboarding] Tour completed!')}
        />
      )}
    </>
  )
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('darkdrop_token'))
  const [user, setUser] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  // Initialize onboarding analytics on mount
  useEffect(() => {
    initializeOnboardingAnalytics()
  }, [])

  // Send session_start metrics event on mount
  useEffect(() => {
    const sendSessionStart = async () => {
      try {
        // Get or create session ID
        let sessionId = sessionStorage.getItem('darkdrop_session_id')
        if (!sessionId) {
          sessionId = crypto.randomUUID()
          sessionStorage.setItem('darkdrop_session_id', sessionId)
        }

        // Get user ID (from localStorage or use 'anonymous')
        const userId = localStorage.getItem('darkdrop_user_id') || 'anonymous'

        // Store user ID if not already set
        if (!localStorage.getItem('darkdrop_user_id')) {
          localStorage.setItem('darkdrop_user_id', userId)
        }

        // Send session_start event to coordinator
        await fetch('http://localhost:3020/api/metrics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event: 'session_start',
            userId,
            sessionId,
            metadata: {
              url: window.location.href,
              referrer: document.referrer,
              timestamp: new Date().toISOString()
            }
          })
        })

        console.log('[Metrics] Session start event sent:', { userId, sessionId })
      } catch (error) {
        console.error('[Metrics] Failed to send session_start event:', error)
      }
    }

    sendSessionStart()
  }, [])

  useEffect(() => {
    if (token) {
      const userData = JSON.parse(localStorage.getItem('darkdrop_user') || '{}')
      const accountsData = JSON.parse(localStorage.getItem('darkdrop_accounts') || '[]')
      setUser(userData)
      setAccounts(accountsData)
    }
  }, [token])

  // Track current path for onboarding context
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname)
    }

    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  const handleLogin = (token, user, accounts) => {
    localStorage.setItem('darkdrop_token', token)
    localStorage.setItem('darkdrop_user', JSON.stringify(user))
    localStorage.setItem('darkdrop_accounts', JSON.stringify(accounts))

    // Track login count for welcome notifications
    const loginCount = parseInt(localStorage.getItem('darkdrop_login_count') || '0') + 1
    localStorage.setItem('darkdrop_login_count', loginCount.toString())

    setToken(token)
    setUser(user)
    setAccounts(accounts)
  }

  const handleLogout = () => {
    localStorage.removeItem('darkdrop_token')
    localStorage.removeItem('darkdrop_user')
    localStorage.removeItem('darkdrop_accounts')
    setToken(null)
    setUser(null)
    setAccounts([])
  }

  // Onboarding context
  const onboardingContext = {
    user,
    accounts,
    currentPath,
    hasAccounts: accounts.length > 0
  }

  return (
    <Router>
      {token && <NotificationBanner user={user} accounts={accounts} />}
      <AppRoutes
        token={token}
        user={user}
        accounts={accounts}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
        onboardingContext={onboardingContext}
      />
    </Router>
  )
}

export default App
