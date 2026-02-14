const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs').promises;

class Database {
    constructor(dbPath = path.join(__dirname, 'darkdrop.db')) {
        this.dbPath = dbPath;
        this.db = null;
    }

    async initialize() {
        // Create database directory if it doesn't exist
        const dir = path.dirname(this.dbPath);
        await fs.mkdir(dir, { recursive: true });

        // Open database connection
        this.db = await open({
            filename: this.dbPath,
            driver: sqlite3.Database
        });

        // Enable foreign keys
        await this.db.exec('PRAGMA foreign_keys = ON;');

        // Load and execute schema
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');
        await this.db.exec(schema);

        console.log('Database initialized successfully');
    }

    async close() {
        if (this.db) {
            await this.db.close();
        }
    }

    // Account methods
    async getAccount(accountId) {
        return await this.db.get('SELECT * FROM accounts WHERE id = ?', accountId);
    }

    async getAllAccounts() {
        return await this.db.all('SELECT * FROM accounts WHERE status = ?', 'active');
    }

    async createAccount(id, name, domain) {
        return await this.db.run(
            'INSERT INTO accounts (id, name, domain) VALUES (?, ?, ?)',
            id, name, domain
        );
    }

    async updateAccountStorage(accountId, sizeChange) {
        return await this.db.run(
            'UPDATE accounts SET storage_used = storage_used + ? WHERE id = ?',
            sizeChange, accountId
        );
    }

    // User methods
    async getUserByEmail(email) {
        return await this.db.get('SELECT * FROM users WHERE email = ?', email);
    }

    async getUserById(userId) {
        return await this.db.get('SELECT * FROM users WHERE id = ?', userId);
    }

    async createUser(id, email, passwordHash, name) {
        return await this.db.run(
            'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
            id, email, passwordHash, name
        );
    }

    async updateUserLogin(userId) {
        return await this.db.run(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            userId
        );
    }

    // Agent methods
    async getAgentByApiKey(apiKey) {
        return await this.db.get('SELECT * FROM agents WHERE api_key = ?', apiKey);
    }

    async getAgentById(agentId) {
        return await this.db.get('SELECT * FROM agents WHERE id = ?', agentId);
    }

    async createAgent(id, name, apiKey) {
        return await this.db.run(
            'INSERT INTO agents (id, name, api_key) VALUES (?, ?, ?)',
            id, name, apiKey
        );
    }

    async updateAgentUsage(agentId) {
        return await this.db.run(
            'UPDATE agents SET last_used = CURRENT_TIMESTAMP WHERE id = ?',
            agentId
        );
    }

    // Permission methods
    async getUserPermissions(userId) {
        return await this.db.all(
            `SELECT p.*, a.name as account_name, a.domain
             FROM permissions p
             JOIN accounts a ON p.account_id = a.id
             WHERE p.user_id = ? AND a.status = 'active'`,
            userId
        );
    }

    async getAgentPermissions(agentId) {
        return await this.db.all(
            `SELECT p.*, a.name as account_name, a.domain
             FROM permissions p
             JOIN accounts a ON p.account_id = a.id
             WHERE p.agent_id = ? AND a.status = 'active'`,
            agentId
        );
    }

    async checkPermission(accountId, userId, agentId, requiredRole = 'read') {
        const roleHierarchy = { read: 1, write: 2, admin: 3 };
        const required = roleHierarchy[requiredRole] || 1;

        const where = userId ? 'user_id = ?' : 'agent_id = ?';
        const id = userId || agentId;

        const permission = await this.db.get(
            `SELECT role FROM permissions WHERE account_id = ? AND ${where}`,
            accountId, id
        );

        if (!permission) return false;
        const userLevel = roleHierarchy[permission.role] || 0;
        return userLevel >= required;
    }

    async createPermission(id, accountId, userId, agentId, role) {
        return await this.db.run(
            'INSERT INTO permissions (id, account_id, user_id, agent_id, role) VALUES (?, ?, ?, ?, ?)',
            id, accountId, userId, agentId, role
        );
    }

    // File methods
    async createFile(file) {
        return await this.db.run(
            `INSERT INTO files (id, account_id, name, original_name, path, size, mime_type, type,
                               uploaded_by_user_id, uploaded_by_agent_id, folder, checksum)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            file.id, file.accountId, file.name, file.originalName, file.path, file.size,
            file.mimeType, file.type, file.uploadedByUserId, file.uploadedByAgentId,
            file.folder, file.checksum
        );
    }

    async getFile(fileId) {
        return await this.db.get('SELECT * FROM files WHERE id = ?', fileId);
    }

    async getFileByPublicToken(token) {
        return await this.db.get('SELECT * FROM files WHERE public_token = ? AND is_public = 1', token);
    }

    async listFiles(accountId, folder = '/', type = null) {
        let query = 'SELECT * FROM files WHERE account_id = ? AND folder = ?';
        const params = [accountId, folder];

        if (type) {
            query += ' AND type = ?';
            params.push(type);
        }

        query += ' ORDER BY created_at DESC';
        return await this.db.all(query, ...params);
    }

    async searchFiles(accountId, searchTerm) {
        return await this.db.all(
            `SELECT * FROM files
             WHERE account_id = ? AND (name LIKE ? OR original_name LIKE ?)
             ORDER BY created_at DESC`,
            accountId, `%${searchTerm}%`, `%${searchTerm}%`
        );
    }

    async deleteFile(fileId) {
        return await this.db.run('DELETE FROM files WHERE id = ?', fileId);
    }

    async makeFilePublic(fileId, publicToken) {
        return await this.db.run(
            'UPDATE files SET is_public = 1, public_token = ? WHERE id = ?',
            publicToken, fileId
        );
    }

    async incrementDownloadCount(fileId) {
        return await this.db.run(
            'UPDATE files SET download_count = download_count + 1 WHERE id = ?',
            fileId
        );
    }

    // Session methods
    async createSession(id, userId, token, expiresAt) {
        return await this.db.run(
            'INSERT INTO sessions (id, user_id, token, expires_at) VALUES (?, ?, ?, ?)',
            id, userId, token, expiresAt
        );
    }

    async getSessionByToken(token) {
        return await this.db.get(
            `SELECT s.*, u.email, u.name
             FROM sessions s
             JOIN users u ON s.user_id = u.id
             WHERE s.token = ? AND s.expires_at > datetime('now')`,
            token
        );
    }

    async deleteSession(token) {
        return await this.db.run('DELETE FROM sessions WHERE token = ?', token);
    }

    async cleanExpiredSessions() {
        return await this.db.run("DELETE FROM sessions WHERE expires_at < datetime('now')");
    }

    // File version methods
    async createFileVersion(version) {
        return await this.db.run(
            `INSERT INTO file_versions (id, file_id, version_number, path, size, checksum, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            version.id, version.fileId, version.versionNumber, version.path, version.size,
            version.checksum, version.createdBy
        );
    }

    async getFileVersions(fileId) {
        return await this.db.all(
            'SELECT * FROM file_versions WHERE file_id = ? ORDER BY version_number DESC',
            fileId
        );
    }

    async getFileVersion(versionId) {
        return await this.db.get('SELECT * FROM file_versions WHERE id = ?', versionId);
    }

    async getMaxVersionNumber(fileId) {
        const result = await this.db.get(
            'SELECT MAX(version_number) as max_version FROM file_versions WHERE file_id = ?',
            fileId
        );
        return result?.max_version || 0;
    }

    // Audit log methods
    async createAuditLog(entry) {
        return await this.db.run(
            `INSERT INTO file_audit_log (id, file_id, account_id, action, performed_by, performed_by_type, ip_address, user_agent)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            entry.id, entry.fileId, entry.accountId, entry.action, entry.performedBy,
            entry.performedByType, entry.ipAddress, entry.userAgent
        );
    }

    async getFileAuditLog(fileId) {
        return await this.db.all(
            'SELECT * FROM file_audit_log WHERE file_id = ? ORDER BY created_at DESC',
            fileId
        );
    }

    // Retention policy methods
    async createRetentionPolicy(policy) {
        return await this.db.run(
            'INSERT INTO retention_policies (id, account_id, category, retention_days) VALUES (?, ?, ?, ?)',
            policy.id, policy.accountId, policy.category, policy.retentionDays
        );
    }

    async getRetentionPolicies(accountId) {
        return await this.db.all(
            'SELECT * FROM retention_policies WHERE account_id = ?',
            accountId
        );
    }

    // Generic query helpers (used by sync API)
    async run(sql, params) {
        return await this.db.run(sql, params);
    }

    async get(sql, params) {
        return await this.db.get(sql, params);
    }

    async all(sql, params) {
        return await this.db.all(sql, params);
    }
}

module.exports = Database;
