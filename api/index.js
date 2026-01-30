const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Database = require('../database');

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
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
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
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/auth/logout', authenticateJWT, async (req, res) => {
    try {
        const token = req.headers.authorization.substring(7);
        await db.deleteSession(token);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
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
        console.error('Get accounts error:', error);
        res.status(500).json({ error: 'Failed to fetch accounts' });
    }
});

app.get('/accounts/:accountId', authenticate, checkAccountAccess('read'), async (req, res) => {
    try {
        const account = await db.getAccount(req.accountId);
        res.json(account);
    } catch (error) {
        console.error('Get account error:', error);
        res.status(500).json({ error: 'Failed to fetch account' });
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
                // Calculate checksum
                const fileBuffer = await fs.readFile(req.file.path);
                const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');

                // Create file record
                const fileId = crypto.randomUUID();
                await db.createFile({
                    id: fileId,
                    accountId: req.accountId,
                    name: req.file.filename,
                    originalName: req.file.originalname,
                    path: req.file.path,
                    size: req.file.size,
                    mimeType: req.file.mimetype,
                    type,
                    uploadedByUserId: req.user?.id || null,
                    uploadedByAgentId: req.agent?.id || null,
                    folder,
                    checksum
                });

                // Update account storage
                await db.updateAccountStorage(req.accountId, req.file.size);

                res.status(201).json({
                    fileId,
                    name: req.file.originalname,
                    size: req.file.size,
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
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
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

        res.download(file.path, file.original_name);
    } catch (error) {
        console.error('Download error:', error);
        res.status(500).json({ error: 'Download failed' });
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
        console.error('Public download error:', error);
        res.status(500).json({ error: 'Download failed' });
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
        console.error('List files error:', error);
        res.status(500).json({ error: 'Failed to list files' });
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
        console.error('Search files error:', error);
        res.status(500).json({ error: 'Search failed' });
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
        console.error('Delete file error:', error);
        res.status(500).json({ error: 'Delete failed' });
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
        console.error('Share file error:', error);
        res.status(500).json({ error: 'Failed to create share link' });
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
