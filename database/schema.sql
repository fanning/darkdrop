-- DarkDrop Database Schema
-- Multi-tenant file storage system

-- Brand accounts (tenants)
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    domain TEXT UNIQUE NOT NULL,
    storage_quota INTEGER DEFAULT 107374182400, -- 100GB in bytes
    storage_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'deleted')),
    encryption_enabled INTEGER DEFAULT 0
);

-- Human users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'deleted'))
);

-- Agent users (API access)
CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    api_key TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used TIMESTAMP,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'deleted'))
);

-- Permissions: Users/Agents access to brand accounts
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    user_id TEXT,
    agent_id TEXT,
    role TEXT NOT NULL CHECK(role IN ('read', 'write', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
    CHECK ((user_id IS NOT NULL AND agent_id IS NULL) OR (user_id IS NULL AND agent_id IS NOT NULL))
);

-- File metadata
CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    path TEXT NOT NULL,
    size INTEGER NOT NULL,
    mime_type TEXT,
    type TEXT NOT NULL CHECK(type IN ('agents', 'users', 'shared')),
    uploaded_by_user_id TEXT,
    uploaded_by_agent_id TEXT,
    folder TEXT DEFAULT '/',
    checksum TEXT,
    category TEXT DEFAULT NULL,
    is_public BOOLEAN DEFAULT 0,
    public_token TEXT UNIQUE,
    download_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (uploaded_by_agent_id) REFERENCES agents(id) ON DELETE SET NULL,
    CHECK ((uploaded_by_user_id IS NOT NULL AND uploaded_by_agent_id IS NULL) OR
           (uploaded_by_user_id IS NULL AND uploaded_by_agent_id IS NOT NULL))
);

-- Sessions for JWT management
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_account ON permissions(account_id);
CREATE INDEX IF NOT EXISTS idx_permissions_user ON permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_agent ON permissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_files_account ON files(account_id);
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder);
CREATE INDEX IF NOT EXISTS idx_files_public_token ON files(public_token);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- Sync files from Hive Code desktop app
CREATE TABLE IF NOT EXISTS sync_files (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    stored_path TEXT NOT NULL,
    size INTEGER NOT NULL DEFAULT 0,
    mime_type TEXT,
    source_type TEXT NOT NULL CHECK(source_type IN ('document', 'browser_history', 'code', 'email', 'chat', 'activity', 'calendar', 'notes')),
    source_path TEXT,
    content_hash TEXT NOT NULL,
    encrypted INTEGER DEFAULT 0,
    parsed_text TEXT,
    uploaded_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sync_files_account ON sync_files(account_id);
CREATE INDEX IF NOT EXISTS idx_sync_files_hash ON sync_files(content_hash);
CREATE INDEX IF NOT EXISTS idx_sync_files_source_type ON sync_files(source_type);
CREATE INDEX IF NOT EXISTS idx_sync_files_source_path ON sync_files(source_path);

-- File versioning
CREATE TABLE IF NOT EXISTS file_versions (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    path TEXT NOT NULL,
    size INTEGER NOT NULL,
    checksum TEXT NOT NULL,
    created_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_file_versions_file ON file_versions(file_id);

-- File access audit log
CREATE TABLE IF NOT EXISTS file_audit_log (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    account_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('view', 'download', 'upload', 'delete', 'share', 'version_create')),
    performed_by TEXT NOT NULL,
    performed_by_type TEXT NOT NULL CHECK(performed_by_type IN ('user', 'agent', 'auditor')),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_file_audit_log_file ON file_audit_log(file_id);
CREATE INDEX IF NOT EXISTS idx_file_audit_log_date ON file_audit_log(created_at);

-- Retention policies
CREATE TABLE IF NOT EXISTS retention_policies (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    category TEXT NOT NULL,
    retention_days INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics: page view tracking
CREATE TABLE IF NOT EXISTS analytics_pageviews (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    page_path TEXT NOT NULL,
    referrer TEXT,
    user_agent TEXT,
    ip_address TEXT,
    user_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_session ON analytics_pageviews(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_pageviews_created_at ON analytics_pageviews(created_at);

-- Initial seed data for development
INSERT OR IGNORE INTO accounts (id, name, domain) VALUES
    ('custcorp', 'CustCorp', 'custcorp.com'),
    ('tibstar', 'The Infinite Black', 'tibstar.com'),
    ('hiveskill', 'HiveSkill', 'hiveskill.com'),
    ('countsharp', 'CountSharp Financial', 'countsharp.com');
