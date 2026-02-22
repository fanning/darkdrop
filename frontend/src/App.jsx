import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import Login from './components/Login'
import Register from './components/Register'
import Dashboard from './components/Dashboard'
import FileBrowser from './components/FileBrowser'

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

function AppRoutes({ token, user, accounts, handleLogin, handleLogout }) {
  usePageTracking()

  return (
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
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

function App() {
  const [token, setToken] = useState(localStorage.getItem('darkdrop_token'))
  const [user, setUser] = useState(null)
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    if (token) {
      const userData = JSON.parse(localStorage.getItem('darkdrop_user') || '{}')
      const accountsData = JSON.parse(localStorage.getItem('darkdrop_accounts') || '[]')
      setUser(userData)
      setAccounts(accountsData)
    }
  }, [token])

  const handleLogin = (token, user, accounts) => {
    localStorage.setItem('darkdrop_token', token)
    localStorage.setItem('darkdrop_user', JSON.stringify(user))
    localStorage.setItem('darkdrop_accounts', JSON.stringify(accounts))
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

  return (
    <Router>
      <AppRoutes
        token={token}
        user={user}
        accounts={accounts}
        handleLogin={handleLogin}
        handleLogout={handleLogout}
      />
    </Router>
  )
}

export default App
