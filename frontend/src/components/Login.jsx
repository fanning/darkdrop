import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

function Login({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post('/auth/login', {
        email,
        password,
      })

      onLogin(response.data.token, response.data.user, response.data.accounts)
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '400px', margin: '100px auto' }}>
        <div className="card">
          {/* Dark Logo */}
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            <img
              src="/logo-hat-white.png"
              alt="Dark Logo"
              style={{ height: '60px', marginBottom: '10px' }}
            />
            <h1 style={{ marginBottom: '10px', marginTop: '10px' }}>
              DarkDrop
            </h1>
            <p style={{ color: '#888', fontSize: '14px', margin: 0 }}>
              Secure File Storage
            </p>
          </div>

          {error && <div className="error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center', color: '#888' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#007bff' }}>
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login
