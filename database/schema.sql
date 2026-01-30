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
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'deleted'))
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

-- Initial seed data for development
INSERT OR IGNORE INTO accounts (id, name, domain) VALUES
    ('custcorp', 'CustCorp', 'custcorp.com'),
    ('tibstar', 'The Infinite Black', 'tibstar.com'),
    ('hiveskill', 'HiveSkill', 'hiveskill.com');
