import React, { useState } from 'react'
import { Link } from 'react-router-dom'

function LandingPage() {
  const [showTechnicalSpecs, setShowTechnicalSpecs] = useState(false)

  return (
    <div className="landing-page" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
      color: '#fff'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <img src="/logo-hat-white.png" alt="DarkDrop" style={{ height: '40px' }} />
          <h2 style={{ margin: 0, fontSize: '24px' }}>DarkDrop</h2>
        </div>
        <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link to="/login" style={{ color: '#888', textDecoration: 'none' }}>Login</Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '8px 20px' }}>Sign Up</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section style={{
        maxWidth: '900px',
        margin: '0 auto',
        padding: '80px 40px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '48px',
          marginBottom: '20px',
          fontWeight: 'bold',
          lineHeight: '1.2'
        }}>
          Encrypted File Storage for Teams & AI Agents
        </h1>

        <p style={{
          fontSize: '20px',
          color: '#aaa',
          marginBottom: '40px',
          lineHeight: '1.6'
        }}>
          Enterprise-grade security with zero-knowledge encryption
        </p>

        {/* Primary CTA */}
        <div style={{ marginBottom: '15px' }}>
          <Link
            to="/register"
            className="btn btn-primary animate-pulse-slow"
            style={{
              fontSize: '20px',
              padding: '16px 32px',
              display: 'inline-block',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              boxShadow: '0 4px 20px rgba(0, 123, 255, 0.4)',
              transition: 'all 0.3s ease'
            }}
          >
            Upload File
          </Link>
        </div>

        <p style={{
          fontSize: '14px',
          color: '#888',
          marginBottom: '60px'
        }}>
          No signup required - just drop your file
        </p>

        {/* Key Features - Reduced to 3 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '30px',
          marginTop: '60px'
        }}>
          <div style={{
            padding: '30px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔒</div>
            <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Zero-Knowledge</h3>
            <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6' }}>
              Your files are encrypted before leaving your device. We can't access them, ever.
            </p>
          </div>

          <div style={{
            padding: '30px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>🛡️</div>
            <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>E2E Encryption</h3>
            <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6' }}>
              AES-256-GCM encryption ensures your data stays private and secure.
            </p>
          </div>

          <div style={{
            padding: '30px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>⚡</div>
            <h3 style={{ fontSize: '20px', marginBottom: '10px' }}>Instant Sharing</h3>
            <p style={{ color: '#aaa', fontSize: '14px', lineHeight: '1.6' }}>
              Share files instantly with team members and AI agents via secure links.
            </p>
          </div>
        </div>

        {/* Technical Specs - Expandable */}
        <div style={{ marginTop: '60px' }}>
          <button
            onClick={() => setShowTechnicalSpecs(!showTechnicalSpecs)}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#aaa',
              padding: '12px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              margin: '0 auto',
              transition: 'all 0.3s ease'
            }}
          >
            <span>Technical Specifications</span>
            <span style={{
              transform: showTechnicalSpecs ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }}>▼</span>
          </button>

          {showTechnicalSpecs && (
            <div style={{
              marginTop: '20px',
              padding: '30px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              textAlign: 'left'
            }}>
              <h4 style={{ marginBottom: '15px', fontSize: '18px' }}>Security & Performance</h4>
              <ul style={{ color: '#aaa', lineHeight: '2', fontSize: '14px' }}>
                <li><strong>Encryption:</strong> AES-256-GCM (NIST approved)</li>
                <li><strong>Key Management:</strong> Client-side key derivation with PBKDF2</li>
                <li><strong>Storage:</strong> Multi-tenant isolated architecture</li>
                <li><strong>Versioning:</strong> Automatic file version history</li>
                <li><strong>Audit Trails:</strong> Complete access logging for compliance</li>
                <li><strong>Max File Size:</strong> 5GB per file</li>
                <li><strong>API Access:</strong> RESTful API for AI agent integration</li>
              </ul>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '40px',
        textAlign: 'center',
        color: '#666',
        fontSize: '14px'
      }}>
        <p>© 2026 DarkDrop. Encrypted file storage for modern teams.</p>
      </footer>

      <style>{`
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }

        .animate-pulse-slow {
          animation: pulse-slow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        .animate-pulse-slow:hover {
          animation: none;
          opacity: 1;
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(0, 123, 255, 0.5) !important;
        }
      `}</style>
    </div>
  )
}

export default LandingPage
