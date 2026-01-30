import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

function FileBrowser({ user, accounts, token, onLogout }) {
  const { accountId } = useParams()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [shareModal, setShareModal] = useState(null)
  const [folder, setFolder] = useState('/')
  const [type, setType] = useState('users')

  const account = accounts.find((a) => a.id === accountId)

  useEffect(() => {
    loadFiles()
  }, [accountId, folder, type])

  const loadFiles = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await axios.get(`/files/${accountId}`, {
        params: { folder, type },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      setFiles(response.data.files)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (fileList) => {
    if (!fileList || fileList.length === 0) return

    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', fileList[0])
    formData.append('type', type)
    formData.append('folder', folder)

    try {
      await axios.post(`/upload/${accountId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      })

      loadFiles()
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleFileSelect = (e) => {
    handleUpload(e.target.files)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    handleUpload(e.dataTransfer.files)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDownload = async (fileId, fileName) => {
    try {
      const response = await axios.get(`/download/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      })

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', fileName)
      document.body.appendChild(link)
      link.click()
      link.remove()
    } catch (err) {
      setError(err.response?.data?.error || 'Download failed')
    }
  }

  const handleDelete = async (fileId) => {
    if (!confirm('Are you sure you want to delete this file?')) return

    try {
      await axios.delete(`/files/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      loadFiles()
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed')
    }
  }

  const handleShare = async (fileId) => {
    try {
      const response = await axios.post(
        `/files/${fileId}/share`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setShareModal({
        url: response.data.publicUrl,
        token: response.data.token,
      })
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create share link')
    }
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  if (!account) {
    return <div>Account not found</div>
  }

  return (
    <div>
      <header className="header">
        <div className="header-content">
          <h1>DarkDrop - {account.name}</h1>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
            <span style={{ color: '#888' }}>{user?.name}</span>
            <button className="btn btn-secondary" onClick={onLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="breadcrumb">
          <Link to="/dashboard">Accounts</Link>
          <span>/</span>
          <span>{account.name}</span>
        </div>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
            <label>Storage Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="users">User Files</option>
              <option value="agents">Agent Files</option>
              <option value="shared">Shared Files</option>
            </select>
          </div>
        </div>

        {error && <div className="error">{error}</div>}

        {account.role !== 'read' && (
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
            {uploading ? (
              <p>Uploading...</p>
            ) : (
              <>
                <p style={{ fontSize: '48px', marginBottom: '10px' }}>+</p>
                <p>Click to upload or drag and drop files here</p>
                <p style={{ color: '#888', marginTop: '10px', fontSize: '14px' }}>
                  Max file size: 5GB
                </p>
              </>
            )}
          </div>
        )}

        {loading ? (
          <div className="loading">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="card">
            <p style={{ textAlign: 'center', color: '#888' }}>
              No files found. Upload some files to get started.
            </p>
          </div>
        ) : (
          <div className="file-list">
            {files.map((file) => (
              <div key={file.id} className="file-item">
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-meta">
                    {formatBytes(file.size)} • {file.mimeType} • {formatDate(file.createdAt)}
                    {file.isPublic && (
                      <span style={{ color: '#28a745', marginLeft: '10px' }}>
                        • Public
                      </span>
                    )}
                  </div>
                </div>
                <div className="file-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleDownload(file.id, file.name)}
                  >
                    Download
                  </button>
                  {account.role !== 'read' && (
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleShare(file.id)}
                      >
                        Share
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(file.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {shareModal && (
        <div className="modal-overlay" onClick={() => setShareModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Share Link</h3>
              <button className="modal-close" onClick={() => setShareModal(null)}>
                ×
              </button>
            </div>
            <div className="form-group">
              <label>Public URL</label>
              <input
                type="text"
                value={shareModal.url}
                readOnly
                onClick={(e) => e.target.select()}
              />
            </div>
            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => {
                navigator.clipboard.writeText(shareModal.url)
                alert('Link copied to clipboard!')
              }}
            >
              Copy Link
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default FileBrowser
