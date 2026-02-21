# DarkDrop UX Audit: Feature Visibility

**Date:** February 21, 2026
**Audit Scope:** Encryption, Versioning, and Audit Trail feature visibility in user interface
**Status:** Investigation complete - NO changes made

---

## Executive Summary

DarkDrop has implemented **robust backend infrastructure** for three critical security features:
1. **Encryption at Rest** (AES-256-GCM with per-account key derivation)
2. **Automatic File Versioning** (with version history and restore capability)
3. **Comprehensive Audit Logging** (all file operations tracked)

**CRITICAL FINDING:** Despite having these features fully implemented in the backend, **NONE of them are visible or communicated in the user interface**. Users have no awareness of these security benefits when using the product.

---

## Feature Implementation Status

### ✅ Backend Implementation (Complete)

#### 1. Encryption at Rest
**Location:** `lib/crypto.js`, `api/index.js`

**Implementation:**
- AES-256-GCM encryption algorithm
- Per-account key derivation using PBKDF2 (100,000 iterations)
- Master key from `DARKDROP_MASTER_KEY` environment variable
- 12-byte IV + 16-byte auth tag format
- Transparent encryption/decryption on upload/download

**Database Support:**
- `accounts.encryption_enabled` column (schema.sql:14)

**Current Status:** ✅ Fully functional

---

#### 2. File Versioning
**Location:** `database/schema.sql` (lines 125-137), `database/index.js` (lines 240-267), `api/index.js`

**Implementation:**
- Automatic versioning on file re-upload with same name/folder
- `file_versions` table with version_number, path, size, checksum
- Version restore capability
- Maximum version tracking per file

**API Endpoints:**
- `GET /files/:fileId/versions` - List all versions (api/index.js:554)
- `POST /files/:fileId/versions/:versionId/restore` - Restore version (api/index.js:590)

**Database Schema:**
```sql
CREATE TABLE file_versions (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    path TEXT NOT NULL,
    size INTEGER NOT NULL,
    checksum TEXT NOT NULL,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Current Status:** ✅ Fully functional (backend only)

---

#### 3. Audit Trail
**Location:** `database/schema.sql` (lines 139-153), `database/index.js` (lines 269-283), `api/index.js`

**Implementation:**
- `file_audit_log` table tracking all file operations
- Tracked actions: view, download, upload, delete, share, version_create
- Records: performer (user/agent), IP address, user agent, timestamp
- Methods: `createAuditLog()`, `getFileAuditLog()`

**Database Schema:**
```sql
CREATE TABLE file_audit_log (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('view', 'download', 'upload', 'delete', 'share', 'version_create')),
    performed_by TEXT NOT NULL,
    performed_by_type TEXT NOT NULL CHECK(performed_by_type IN ('user', 'agent', 'auditor')),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Audit Logging Points:**
- Upload: api/index.js:367
- Download: api/index.js:419
- Version creation: api/index.js:325, 629

**Current Status:** ✅ Logs being written, but NO API endpoint to retrieve logs

---

## UX Gaps: Frontend Visibility

### ❌ Gap 1: Homepage/Dashboard - Zero Security Messaging

**Current State:**
- Login page (Login.jsx:44-46): "Secure File Storage" - generic tagline
- Dashboard "About" section (Dashboard.jsx:56-61):
  ```
  "DarkDrop is a multi-tenant file storage service designed for secure file
  management across multiple brands and organizations. Upload, download, and
  share files with team members and agents."
  ```

**What's Missing:**
- ❌ No mention of encryption at rest
- ❌ No mention of automatic versioning
- ❌ No mention of audit logging
- ❌ No visual indicators of security features
- ❌ No trust signals or compliance badges

**Impact:** Users don't know these features exist when evaluating the product.

---

### ❌ Gap 2: Upload Flow - No Security Benefits Explained

**Current State (FileBrowser.jsx:206-230):**
```jsx
<div className="upload-zone">
  <p style={{ fontSize: '48px' }}>+</p>
  <p>Click to upload or drag and drop files here</p>
  <p style={{ color: '#888', fontSize: '14px' }}>
    Max file size: 5GB
  </p>
</div>
```

**What's Missing:**
- ❌ No indication that files will be encrypted
- ❌ No mention that versions are automatically saved
- ❌ No notification that uploads are audited
- ❌ No feedback after upload confirming security measures applied

**Impact:** Users upload files without understanding how they're protected.

---

### ❌ Gap 3: File List - Version History Invisible

**Current State (FileBrowser.jsx:243-283):**

**File List UI shows:**
- ✅ File name
- ✅ Size, mime type, date
- ✅ Public status badge
- ✅ Actions: Download, Share, Delete

**What's Missing:**
- ❌ No version indicator (e.g., "v3" badge)
- ❌ No "View History" button
- ❌ No version count display
- ❌ No visual indication that versions exist
- ❌ Versions API endpoint exists but is never called by frontend

**Impact:** Users don't know versions are being saved. Re-uploading a file appears destructive (replacing old file).

---

### ❌ Gap 4: Audit Trail - Completely Hidden

**Current State:**
- Audit logs are being written to database on every operation
- NO frontend component to display audit trail
- NO API endpoint to retrieve audit logs (database method exists but no HTTP route)

**What's Missing:**
- ❌ No "Activity Log" or "Audit Trail" section
- ❌ No visibility into who downloaded/shared files
- ❌ No timestamp history
- ❌ No IP address or user agent tracking visible
- ❌ Admins have no way to review file access history

**Impact:** Primary compliance/security use case is invisible. Auditors cannot access audit data via UI.

---

## Specific UX Recommendations

### Priority 1: Make Features Discoverable (CRITICAL)

#### 1.1 Dashboard - Add Security Feature Highlights
**Location:** `Dashboard.jsx:55-62`

**Current:**
```jsx
<div className="card" style={{ marginTop: '40px' }}>
  <h3>About DarkDrop</h3>
  <p style={{ color: '#888' }}>
    DarkDrop is a multi-tenant file storage service...
  </p>
</div>
```

**Recommended:**
```jsx
<div className="card" style={{ marginTop: '40px' }}>
  <h3>Enterprise-Grade Security Features</h3>
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>

    <div>
      <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔒</div>
      <h4>Encrypted at Rest</h4>
      <p style={{ color: '#888', fontSize: '14px' }}>
        AES-256 encryption protects all files automatically
      </p>
    </div>

    <div>
      <div style={{ fontSize: '32px', marginBottom: '10px' }}>📚</div>
      <h4>Version History</h4>
      <p style={{ color: '#888', fontSize: '14px' }}>
        Never lose work - all versions saved automatically
      </p>
    </div>

    <div>
      <div style={{ fontSize: '32px', marginBottom: '10px' }}>📋</div>
      <h4>Complete Audit Trail</h4>
      <p style={{ color: '#888', fontSize: '14px' }}>
        Track every file access for compliance
      </p>
    </div>

  </div>
</div>
```

---

#### 1.2 Upload Zone - Show Security Confirmation
**Location:** `FileBrowser.jsx:206-230`

**Recommended:**
```jsx
<div className="upload-zone">
  <p style={{ fontSize: '48px' }}>+</p>
  <p>Click to upload or drag and drop files here</p>
  <div style={{
    marginTop: '15px',
    padding: '10px',
    background: '#1a3a1a',
    borderRadius: '5px',
    fontSize: '13px',
    color: '#4ade80'
  }}>
    ✓ Encrypted automatically  ✓ Versions saved  ✓ Upload tracked
  </div>
  <p style={{ color: '#888', marginTop: '10px', fontSize: '14px' }}>
    Max file size: 5GB
  </p>
</div>
```

---

### Priority 2: Surface Version History (HIGH)

#### 2.1 File List - Add Version Indicator
**Location:** `FileBrowser.jsx:243-255`

**Current file metadata:**
```jsx
<div className="file-meta">
  {formatBytes(file.size)} • {file.mimeType} • {formatDate(file.createdAt)}
</div>
```

**Recommended:**
```jsx
<div className="file-meta">
  {formatBytes(file.size)} • {file.mimeType} • {formatDate(file.createdAt)}
  {file.versionCount > 1 && (
    <span style={{ color: '#007bff', marginLeft: '10px' }}>
      • v{file.versionCount}
    </span>
  )}
</div>
```

**Note:** Requires API modification to include version count in file list response.

---

#### 2.2 File Actions - Add "Version History" Button
**Location:** `FileBrowser.jsx:256-279`

**Current:**
```jsx
<div className="file-actions">
  <button onClick={() => handleDownload(...)}>Download</button>
  <button onClick={() => handleShare(...)}>Share</button>
  <button onClick={() => handleDelete(...)}>Delete</button>
</div>
```

**Recommended:**
```jsx
<div className="file-actions">
  <button onClick={() => handleDownload(...)}>Download</button>
  <button onClick={() => handleViewVersions(file.id)}>
    History ({file.versionCount || 1})
  </button>
  <button onClick={() => handleShare(...)}>Share</button>
  <button onClick={() => handleDelete(...)}>Delete</button>
</div>
```

**Required:** New modal component to display versions (similar to share modal pattern).

---

#### 2.3 Version History Modal Component
**Location:** New component in `FileBrowser.jsx`

**Required functionality:**
- Fetch versions from `GET /files/:fileId/versions`
- Display version list with timestamps, sizes, created_by
- Allow version restore via `POST /files/:fileId/versions/:versionId/restore`
- Show diff indicators (size changes)

---

### Priority 3: Expose Audit Trail (MEDIUM-HIGH)

#### 3.1 Create API Endpoint for Audit Logs
**Location:** `api/index.js` (new endpoint needed)

**Missing endpoint:**
```javascript
// Get audit log for a file
app.get('/files/:fileId/audit', authenticate, async (req, res) => {
    // Check permissions
    // Call db.getFileAuditLog(fileId)
    // Return formatted audit log
});
```

**Note:** Database method `db.getFileAuditLog()` exists (database/index.js:279), but no HTTP endpoint.

---

#### 3.2 File Details - Add "Activity Log" Tab
**Location:** `FileBrowser.jsx` (new UI component)

**Recommended:**
- Add "Activity" button next to file actions
- Modal or expandable section showing:
  - Action type (upload, download, share, etc.)
  - Performed by (user/agent name)
  - Timestamp
  - IP address (for admins only)

**Example display:**
```
Activity Log for "document.pdf"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Downloaded by John Doe    2 hours ago
✓ Shared by Jane Smith      1 day ago
✓ Uploaded by John Doe      1 day ago
```

---

### Priority 4: Encryption Status Visibility (MEDIUM)

#### 4.1 Account Settings - Show Encryption Status
**Location:** `Dashboard.jsx` (account cards)

**Current:**
```jsx
<div className="account-card">
  <h3>{account.name}</h3>
  <p>{account.domain}</p>
  <p>Role: {account.role}</p>
</div>
```

**Recommended:**
```jsx
<div className="account-card">
  <h3>{account.name}</h3>
  <p>{account.domain}</p>
  <p>Role: {account.role}</p>
  {account.encryption_enabled && (
    <div style={{
      marginTop: '10px',
      fontSize: '13px',
      color: '#4ade80'
    }}>
      🔒 Encryption enabled
    </div>
  )}
</div>
```

**Note:** Requires API to expose `encryption_enabled` flag in account list.

---

## API Gaps to Address

### Missing Endpoints:

1. **GET /files/:fileId/audit** - Retrieve audit log for file
   - Backend method exists: `db.getFileAuditLog(fileId)`
   - No HTTP endpoint created

2. **File list should include version count**
   - Current: Returns basic file metadata
   - Needed: Add `versionCount` field to each file object

3. **Account details should include encryption status**
   - Current: Returns storage quota, usage
   - Needed: Add `encryption_enabled` boolean

---

## Non-UX Observations

### Security Best Practices Implemented:
✅ Encryption key derivation (PBKDF2 with 100k iterations)
✅ Authenticated encryption (GCM mode with auth tag)
✅ Per-account key isolation
✅ Comprehensive audit logging
✅ Version history preservation

### Areas for Improvement:
⚠️ Encryption master key must be set via environment variable (no key rotation mechanism visible)
⚠️ No UI to enable/disable encryption per account
⚠️ Audit log has no retention policy enforcement (database/schema.sql:155-162 defines table but no cleanup)
⚠️ No encryption indicator in file metadata (users can't verify encryption status post-upload)

---

## Conclusion

**DarkDrop has excellent security infrastructure that is completely invisible to users.**

### Current State:
- ✅ Backend: Production-ready encryption, versioning, and audit logging
- ❌ Frontend: Zero visibility into these features
- ❌ Marketing: No differentiation based on security features

### Business Impact:
1. **Lost sales opportunity** - Security-conscious buyers can't see these features
2. **Reduced trust** - Users don't know their files are protected
3. **Poor positioning** - Product appears commoditized vs. competitors
4. **Compliance gap** - Auditors can't access audit logs via UI

### Next Steps:
1. ✅ **This audit complete** - Document findings
2. 🔜 **Phase 1** - Add security feature badges to Dashboard and Upload zones (low effort, high impact)
3. 🔜 **Phase 2** - Implement Version History modal (medium effort, high value)
4. 🔜 **Phase 3** - Build Audit Trail API endpoint + UI (medium effort, critical for enterprise)
5. 🔜 **Phase 4** - Marketing site update to promote security features

---

**Audit completed:** February 21, 2026
**Auditor:** Claude Code
**Recommendation:** Prioritize Phase 1 (security badges) as quick win before next user demo.
