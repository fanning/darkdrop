import React from 'react'
import { useNavigate } from 'react-router-dom'

function Dashboard({ user, accounts, onLogout }) {
  const navigate = useNavigate()

  return (
    <div>
      <header className="header">
        <div className="header-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img src="/logo-hat-white.png" alt="Dark Logo" style={{ height: '40px' }} />
            <h1>DarkDrop</h1>
          </div>
          <div className="header-actions">
            <span style={{ color: '#888' }}>{user?.name}</span>
            <button className="btn btn-secondary" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        <h2 style={{ marginBottom: '20px' }}>Your Accounts</h2>

        {accounts.length === 0 ? (
          <div className="card">
            <p style={{ color: '#888', textAlign: 'center' }}>
              You don't have access to any accounts yet.
              <br />
              Contact your administrator to get access.
            </p>
          </div>
        ) : (
          <div className="account-selector">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="account-card"
                onClick={() => navigate(`/files/${account.id}`)}
              >
                <h3>{account.name}</h3>
                <p style={{ color: '#888', marginTop: '10px' }}>
                  {account.domain}
                </p>
                <p style={{ color: '#007bff', marginTop: '10px', fontSize: '14px' }}>
                  Role: {account.role}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{ marginTop: '40px' }}>
          <h3 style={{ marginBottom: '15px' }}>About DarkDrop</h3>
          <p style={{ color: '#888', lineHeight: '1.6' }}>
            DarkDrop is a multi-tenant file storage service designed for secure file
            management across multiple brands and organizations. Upload, download, and
            share files with team members and agents.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
