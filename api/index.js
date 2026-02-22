const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Database = require('../database');
const ErrorHandler = require('./error-handler');
const { encrypt, decrypt, getAccountKey } = require('../lib/crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'darkdrop-secret-change-in-production';
const STORAGE_ROOT = process.env.STORAGE_ROOT || '/var/darkdrop';

// Initialize database
const db = new Database(path.join(__dirname, '../database/darkdrop.db'));

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const { accountId, type } = req.uploadContext;
        const uploadPath = path.join(STORAGE_ROOT, accountId, type);
        await fs.mkdir(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 * 1024 // 5GB max file size
    }
});

// Authentication middleware
const authenticateJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    try {
        const session = await db.getSessionByToken(token);
        if (!session) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = {
            id: session.user_id,
            email: session.email,
            name: session.name
        };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const authenticateApiKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
        return res.status(401).json({ error: 'No API key provided' });
    }

    try {
        const agent = await db.getAgentByApiKey(apiKey);
        if (!agent || agent.status !== 'active') {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        await db.updateAgentUsage(agent.id);
        req.agent = {
            id: agent.id,
            name: agent.name
        };
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid API key' });
    }
};

// Combined auth middleware (JWT or API key)
const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const apiKey = req.headers['x-api-key'];

    if (authHeader) {
        return authenticateJWT(req, res, next);
    } else if (apiKey) {
        return authenticateApiKey(req, res, next);
    } else {
        return res.status(401).json({ error: 'No authentication provided' });
    }
};

// Check account access middleware
const checkAccountAccess = (requiredRole = 'read') => {
    return async (req, res, next) => {
        const accountId = req.params.accountId || req.body.accountId;
        if (!accountId) {
            return res.status(400).json({ error: 'Account ID required' });
        }

        const userId = req.user?.id;
        const agentId = req.agent?.id;

        const hasAccess = await db.checkPermission(accountId, userId, agentId, requiredRole);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        req.accountId = accountId;
        next();
    };
};

// Routes

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'darkdrop-api' });
});

// Analytics: track page view
app.post('/api/analytics/pageview', async (req, res) => {
    try {
        const { session_id, page_path, referrer } = req.body;

        if (!session_id || !page_path) {
            return res.status(400).json({ error: 'session_id and page_path required' });
        }

        // Get user ID from token if authenticated (optional)
        let userId = null;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const session = await db.getSessionByToken(token);
                if (session) {
                    userId = session.user_id;
                }
            } catch (e) {
                // Not authenticated, that's fine for analytics
            }
        }

        const pageviewId = crypto.randomUUID();
        await db.run(
            `INSERT INTO analytics_pageviews (id, session_id, page_path, referrer, user_agent, ip_address, user_id, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [pageviewId, session_id, page_path, referrer || null, req.headers['user-agent'] || null, req.ip, userId]
        );

        res.status(201).json({ success: true, pageview_id: pageviewId });
    } catch (error) {
        console.error('Analytics tracking error:', error);
        // Don't fail the request if analytics fails
        res.status(200).json({ success: false, error: 'tracking failed' });
    }
});

// Auth routes
app.post('/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Email, password, and name required' });
        }

        // Check if user exists
        const existing = await db.getUserByEmail(email);
        if (existing) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        const userId = crypto.randomUUID();

        await db.createUser(userId, email, passwordHash, name);

        res.status(201).json({ message: 'User created successfully', userId });
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'User registration');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0], messages: errorResponse.messages });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password required' });
        }

        const user = await db.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        await db.updateUserLogin(user.id);

        // Create session
        const sessionId = crypto.randomUUID();
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

        await db.createSession(sessionId, user.id, token, expiresAt.toISOString());

        // Get user's accounts
        const permissions = await db.getUserPermissions(user.id);

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name
            },
            accounts: permissions.map(p => ({
                id: p.account_id,
                name: p.account_name,
                domain: p.domain,
                role: p.role
            }))
        });
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'User login');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0], messages: errorResponse.messages });
    }
});

app.post('/auth/logout', authenticateJWT, async (req, res) => {
    try {
        const token = req.headers.authorization.substring(7);
        await db.deleteSession(token);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'User logout');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0], messages: errorResponse.messages });
    }
});

// Account routes
app.get('/accounts', authenticate, async (req, res) => {
    try {
        const userId = req.user?.id;
        const agentId = req.agent?.id;

        const permissions = userId
            ? await db.getUserPermissions(userId)
            : await db.getAgentPermissions(agentId);

        res.json({
            accounts: permissions.map(p => ({
                id: p.account_id,
                name: p.account_name,
                domain: p.domain,
                role: p.role
            }))
        });
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'Fetch accounts');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0], messages: errorResponse.messages });
    }
});

app.get('/accounts/:accountId', authenticate, checkAccountAccess('read'), async (req, res) => {
    try {
        const account = await db.getAccount(req.accountId);
        res.json(account);
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'Fetch account');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0], messages: errorResponse.messages });
    }
});

// File upload
app.post('/upload/:accountId', authenticate, checkAccountAccess('write'), async (req, res) => {
    try {
        const type = req.body.type || (req.user ? 'users' : 'agents');
        const folder = req.body.folder || '/';

        req.uploadContext = {
            accountId: req.accountId,
            type
        };

        upload.single('file')(req, res, async (err) => {
            if (err) {
                console.error('Upload error:', err);
                return res.status(400).json({ error: err.message });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            try {
                // Calculate checksum on original data
                let fileBuffer = await fs.readFile(req.file.path);
                const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

                // Check if account has encryption enabled
                const account = await db.getAccount(req.accountId);
                let finalSize = req.file.size;
                if (account && account.encryption_enabled) {
                    const encKey = getAccountKey(req.accountId);
                    if (encKey) {
                        const encryptedData = encrypt(fileBuffer, encKey);
                        await fs.writeFile(req.file.path, encryptedData);
                        finalSize = encryptedData.length;
                    }
                }

                // Check for existing file with same name/folder for versioning
                const existingFiles = await db.listFiles(req.accountId, folder, type);
                const existingFile = existingFiles.find(f => f.original_name === req.file.originalname);

                if (existingFile) {
                    // Move existing file to versions
                    const versionNumber = await db.getMaxVersionNumber(existingFile.id) + 1;
                    const versionId = crypto.randomUUID();
                    await db.createFileVersion({
                        id: versionId,
                        fileId: existingFile.id,
                        versionNumber,
                        path: existingFile.path,
                        size: existingFile.size,
                        checksum: existingFile.checksum || '',
                        createdBy: req.user?.id || req.agent?.id || null
                    });

                    // Update existing file record with new data
                    await db.run(
                        `UPDATE files SET name = ?, path = ?, size = ?, mime_type = ?, checksum = ?,
                         uploaded_by_user_id = ?, uploaded_by_agent_id = ?, updated_at = CURRENT_TIMESTAMP
                         WHERE id = ?`,
                        [req.file.filename, req.file.path, finalSize, req.file.mimetype, checksum,
                         req.user?.id || null, req.agent?.id || null, existingFile.id]
                    );

                    // Audit log for version creation
                    await db.createAuditLog({
                        id: crypto.randomUUID(),
                        fileId: existingFile.id,
                        accountId: req.accountId,
                        action: 'version_create',
                        performedBy: req.user?.id || req.agent?.id || 'unknown',
                        performedByType: req.user ? 'user' : 'agent',
                        ipAddress: req.ip,
                        userAgent: req.headers['user-agent'] || null
                    });

                    await db.updateAccountStorage(req.accountId, finalSize);

                    return res.status(201).json({
                        fileId: existingFile.id,
                        name: req.file.originalname,
                        size: finalSize,
                        mimeType: req.file.mimetype,
                        checksum,
                        versioned: true,
                        versionNumber
                    });
                }

                // Create new file record
                const fileId = crypto.randomUUID();
                await db.createFile({
                    id: fileId,
                    accountId: req.accountId,
                    name: req.file.filename,
                    originalName: req.file.originalname,
                    path: req.file.path,
                    size: finalSize,
                    mimeType: req.file.mimetype,
                    type,
                    uploadedByUserId: req.user?.id || null,
                    uploadedByAgentId: req.agent?.id || null,
                    folder,
                    checksum
                });

                // Audit log for upload
                await db.createAuditLog({
                    id: crypto.randomUUID(),
                    fileId,
                    accountId: req.accountId,
                    action: 'upload',
                    performedBy: req.user?.id || req.agent?.id || 'unknown',
                    performedByType: req.user ? 'user' : 'agent',
                    ipAddress: req.ip,
                    userAgent: req.headers['user-agent'] || null
                });

                // Update account storage
                await db.updateAccountStorage(req.accountId, finalSize);

                res.status(201).json({
                    fileId,
                    name: req.file.originalname,
                    size: finalSize,
                    mimeType: req.file.mimetype,
                    checksum
                });
            } catch (error) {
                // Clean up file on error
                await fs.unlink(req.file.path).catch(() => {});
                throw error;
            }
        });
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'File upload');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0], messages: errorResponse.messages });
    }
});

// File download
app.get('/download/:fileId', authenticate, async (req, res) => {
    try {
        const file = await db.getFile(req.params.fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const userId = req.user?.id;
        const agentId = req.agent?.id;
        const hasAccess = await db.checkPermission(file.account_id, userId, agentId, 'read');

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await db.incrementDownloadCount(file.id);

        // Audit log for download
        await db.createAuditLog({
            id: crypto.randomUUID(),
            fileId: file.id,
            accountId: file.account_id,
            action: 'download',
            performedBy: userId || agentId || 'unknown',
            performedByType: userId ? 'user' : 'agent',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || null
        });

        // Check if account has encryption - decrypt before sending
        const account = await db.getAccount(file.account_id);
        if (account && account.encryption_enabled) {
            const encKey = getAccountKey(file.account_id);
            if (encKey) {
                const encryptedData = await fs.readFile(file.path);
                const decryptedData = decrypt(encryptedData, encKey);
                res.setHeader('Content-Disposition', `attachment; filename="${file.original_name}"`);
                res.setHeader('Content-Type', file.mime_type || 'application/octet-stream');
                return res.send(decryptedData);
            }
        }

        res.download(file.path, file.original_name);
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'File download');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0], messages: errorResponse.messages });
    }
});

// Public file download
app.get('/public/:token', async (req, res) => {
    try {
        const file = await db.getFileByPublicToken(req.params.token);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        await db.incrementDownloadCount(file.id);

        res.download(file.path, file.original_name);
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'Public file download');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0], messages: errorResponse.messages });
    }
});

// List files
app.get('/files/:accountId', authenticate, checkAccountAccess('read'), async (req, res) => {
    try {
        const folder = req.query.folder || '/';
        const type = req.query.type || null;

        const files = await db.listFiles(req.accountId, folder, type);

        res.json({
            files: files.map(f => ({
                id: f.id,
                name: f.original_name,
                size: f.size,
                mimeType: f.mime_type,
                type: f.type,
                folder: f.folder,
                isPublic: f.is_public,
                downloadCount: f.download_count,
                createdAt: f.created_at
            }))
        });
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'List files');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0], messages: errorResponse.messages });
    }
});

// Search files
app.get('/files/:accountId/search', authenticate, checkAccountAccess('read'), async (req, res) => {
    try {
        const searchTerm = req.query.q;
        if (!searchTerm) {
            return res.status(400).json({ error: 'Search term required' });
        }

        const files = await db.searchFiles(req.accountId, searchTerm);

        res.json({
            files: files.map(f => ({
                id: f.id,
                name: f.original_name,
                size: f.size,
                mimeType: f.mime_type,
                type: f.type,
                folder: f.folder,
                createdAt: f.created_at
            }))
        });
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'File search');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0], messages: errorResponse.messages });
    }
});

// Delete file
app.delete('/files/:fileId', authenticate, async (req, res) => {
    try {
        const file = await db.getFile(req.params.fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const userId = req.user?.id;
        const agentId = req.agent?.id;
        const hasAccess = await db.checkPermission(file.account_id, userId, agentId, 'write');

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Delete physical file
        await fs.unlink(file.path).catch(() => {});

        // Delete database record
        await db.deleteFile(file.id);

        // Update account storage
        await db.updateAccountStorage(file.account_id, -file.size);

        res.json({ message: 'File deleted successfully' });
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'File deletion');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0], messages: errorResponse.messages });
    }
});

// List file versions
app.get('/files/:fileId/versions', authenticate, async (req, res) => {
    try {
        const file = await db.getFile(req.params.fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const userId = req.user?.id;
        const agentId = req.agent?.id;
        const hasAccess = await db.checkPermission(file.account_id, userId, agentId, 'read');

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const versions = await db.getFileVersions(file.id);

        res.json({
            fileId: file.id,
            currentName: file.original_name,
            versions: versions.map(v => ({
                id: v.id,
                versionNumber: v.version_number,
                size: v.size,
                checksum: v.checksum,
                createdBy: v.created_by,
                createdAt: v.created_at
            }))
        });
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'List file versions');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0], messages: errorResponse.messages });
    }
});

// Restore a file version
app.post('/files/:fileId/versions/:versionId/restore', authenticate, async (req, res) => {
    try {
        const file = await db.getFile(req.params.fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const userId = req.user?.id;
        const agentId = req.agent?.id;
        const hasAccess = await db.checkPermission(file.account_id, userId, agentId, 'write');

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const version = await db.getFileVersion(req.params.versionId);
        if (!version || version.file_id !== file.id) {
            return res.status(404).json({ error: 'Version not found' });
        }

        // Save current file as a new version before restoring
        const newVersionNumber = await db.getMaxVersionNumber(file.id) + 1;
        await db.createFileVersion({
            id: crypto.randomUUID(),
            fileId: file.id,
            versionNumber: newVersionNumber,
            path: file.path,
            size: file.size,
            checksum: file.checksum || '',
            createdBy: userId || agentId || null
        });

        // Restore: update file record with version data
        await db.run(
            `UPDATE files SET path = ?, size = ?, checksum = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [version.path, version.size, version.checksum, file.id]
        );

        // Audit log
        await db.createAuditLog({
            id: crypto.randomUUID(),
            fileId: file.id,
            accountId: file.account_id,
            action: 'version_create',
            performedBy: userId || agentId || 'unknown',
            performedByType: userId ? 'user' : 'agent',
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'] || null
        });

        res.json({
            message: 'Version restored successfully',
            fileId: file.id,
            restoredVersion: version.version_number,
            savedAsVersion: newVersionNumber
        });
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'Restore file version');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0], messages: errorResponse.messages });
    }
});

// Make file public
app.post('/files/:fileId/share', authenticate, async (req, res) => {
    try {
        const file = await db.getFile(req.params.fileId);
        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        const userId = req.user?.id;
        const agentId = req.agent?.id;
        const hasAccess = await db.checkPermission(file.account_id, userId, agentId, 'write');

        if (!hasAccess) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const publicToken = crypto.randomBytes(16).toString('hex');
        await db.makeFilePublic(file.id, publicToken);

        const publicUrl = `${req.protocol}://${req.get('host')}/public/${publicToken}`;

        res.json({ publicUrl, token: publicToken });
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'File sharing');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0], messages: errorResponse.messages });
    }
});

// ============================================
// SYNC API - For Hive Code Electron App
// ============================================

// Batch sync: accept multiple file uploads with metadata
app.post('/api/sync/batch', authenticate, upload.array('files', 50), async (req, res) => {
    try {
        const userId = req.user?.id;
        const metadata = JSON.parse(req.body.metadata || '[]');
        const results = [];

        for (let i = 0; i < (req.files || []).length; i++) {
            const file = req.files[i];
            const meta = metadata[i] || {};

            const fileRecord = {
                id: crypto.randomUUID(),
                account_id: meta.account_id || req.body.account_id,
                filename: file.originalname,
                stored_path: file.path,
                size: file.size,
                mime_type: file.mimetype,
                source_type: meta.source_type || 'document',
                source_path: meta.source_path || '',
                content_hash: meta.content_hash || '',
                encrypted: meta.encrypted || false,
                parsed_text: meta.parsed_text || '',
                uploaded_by: userId,
                created_at: new Date().toISOString()
            };

            try {
                await db.run(`INSERT INTO sync_files (id, account_id, filename, stored_path, size, mime_type, source_type, source_path, content_hash, encrypted, parsed_text, uploaded_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [fileRecord.id, fileRecord.account_id, fileRecord.filename, fileRecord.stored_path, fileRecord.size, fileRecord.mime_type, fileRecord.source_type, fileRecord.source_path, fileRecord.content_hash, fileRecord.encrypted ? 1 : 0, fileRecord.parsed_text, fileRecord.uploaded_by, fileRecord.created_at]);
                results.push({ id: fileRecord.id, filename: fileRecord.filename, status: 'synced' });
            } catch (e) {
                results.push({ filename: fileRecord.filename, status: 'error', error: e.message });
            }
        }

        res.json({ synced: results.filter(r => r.status === 'synced').length, total: results.length, results });
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'Batch sync');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0] });
    }
});

// Delta sync: check which files need uploading based on hashes
app.post('/api/sync/delta', authenticate, async (req, res) => {
    try {
        const { account_id, files } = req.body; // files: [{ path, hash, mtime }]
        if (!account_id || !Array.isArray(files)) {
            return res.status(400).json({ error: 'account_id and files array required' });
        }

        const existingHashes = new Set();
        try {
            const rows = await db.all(`SELECT content_hash FROM sync_files WHERE account_id = ?`, [account_id]);
            for (const row of rows) {
                if (row.content_hash) existingHashes.add(row.content_hash);
            }
        } catch {
            // Table may not exist yet
        }

        const needed = [];
        const alreadySynced = [];
        for (const file of files) {
            if (file.hash && existingHashes.has(file.hash)) {
                alreadySynced.push(file.path);
            } else {
                needed.push(file);
            }
        }

        res.json({ needed: needed.length, already_synced: alreadySynced.length, files_to_upload: needed });
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'Delta sync');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0] });
    }
});

// Sync status for an account
app.get('/api/sync/status/:accountId', authenticate, async (req, res) => {
    try {
        const { accountId } = req.params;
        let stats = { total_files: 0, total_size: 0, by_type: {} };

        try {
            const countRow = await db.get(`SELECT COUNT(*) as cnt, COALESCE(SUM(size),0) as total_size FROM sync_files WHERE account_id = ?`, [accountId]);
            stats.total_files = countRow?.cnt || 0;
            stats.total_size = countRow?.total_size || 0;

            const typeRows = await db.all(`SELECT source_type, COUNT(*) as cnt FROM sync_files WHERE account_id = ? GROUP BY source_type`, [accountId]);
            for (const row of typeRows) {
                stats.by_type[row.source_type] = row.cnt;
            }
        } catch {
            // Table may not exist yet
        }

        res.json({ account_id: accountId, ...stats, last_checked: new Date().toISOString() });
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'Sync status');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0] });
    }
});

// User data profile
app.get('/api/profile/:accountId', authenticate, async (req, res) => {
    try {
        const { accountId } = req.params;
        let profile = { account_id: accountId, file_count: 0, categories: {}, last_sync: null };

        try {
            const countRow = await db.get(`SELECT COUNT(*) as cnt, MAX(created_at) as last_sync FROM sync_files WHERE account_id = ?`, [accountId]);
            profile.file_count = countRow?.cnt || 0;
            profile.last_sync = countRow?.last_sync || null;

            const typeRows = await db.all(`SELECT source_type, COUNT(*) as cnt, COALESCE(SUM(size),0) as total_size FROM sync_files WHERE account_id = ? GROUP BY source_type`, [accountId]);
            for (const row of typeRows) {
                profile.categories[row.source_type] = { count: row.cnt, size: row.total_size };
            }
        } catch {
            // Table may not exist
        }

        res.json(profile);
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'Profile');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0] });
    }
});

// Semantic search across user's synced data
app.post('/api/search/semantic', authenticate, async (req, res) => {
    try {
        const { query, account_id, limit = 20 } = req.body;
        if (!query || !account_id) {
            return res.status(400).json({ error: 'query and account_id required' });
        }

        // Simple text search (will be enhanced with RAG embedding search later)
        const searchTerm = `%${query}%`;
        let results = [];
        try {
            results = await db.all(
                `SELECT id, filename, source_type, source_path, substr(parsed_text, 1, 500) as snippet, created_at
                 FROM sync_files
                 WHERE account_id = ? AND (parsed_text LIKE ? OR filename LIKE ?)
                 ORDER BY created_at DESC LIMIT ?`,
                [account_id, searchTerm, searchTerm, limit]
            );
        } catch {
            // Table may not exist
        }

        res.json({ query, results_count: results.length, results });
    } catch (error) {
        const errorResponse = ErrorHandler.handle(error, 'Semantic search');
        res.status(errorResponse.status).json({ error: errorResponse.messages[0] });
    }
});

// Start server
async function start() {
    try {
        await db.initialize();

        // Clean expired sessions on startup
        await db.cleanExpiredSessions();

        // Set up periodic session cleanup
        setInterval(() => db.cleanExpiredSessions(), 60 * 60 * 1000); // Every hour

        app.listen(PORT, () => {
            console.log(`DarkDrop API server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();

module.exports = app;
