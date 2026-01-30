#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const Database = require('../database');

const STORAGE_ROOT = process.env.STORAGE_ROOT || '/var/darkdrop';
const API_KEY = process.env.DARKDROP_API_KEY;
const ACCOUNT_ID = process.env.DARKDROP_ACCOUNT_ID;

class DarkDropMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: 'darkdrop',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.db = new Database(path.join(__dirname, '../database/darkdrop.db'));
        this.setupHandlers();
    }

    setupHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'upload_file',
                        description: 'Upload a file to DarkDrop storage',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                accountId: {
                                    type: 'string',
                                    description: 'Brand account ID (e.g., custcorp, tibstar)',
                                },
                                filePath: {
                                    type: 'string',
                                    description: 'Local file path to upload',
                                },
                                type: {
                                    type: 'string',
                                    enum: ['agents', 'users', 'shared'],
                                    description: 'File storage type',
                                    default: 'agents',
                                },
                                folder: {
                                    type: 'string',
                                    description: 'Destination folder path',
                                    default: '/',
                                },
                            },
                            required: ['filePath'],
                        },
                    },
                    {
                        name: 'download_file',
                        description: 'Download a file from DarkDrop storage',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                fileId: {
                                    type: 'string',
                                    description: 'File ID to download',
                                },
                                destination: {
                                    type: 'string',
                                    description: 'Local destination path (optional)',
                                },
                            },
                            required: ['fileId'],
                        },
                    },
                    {
                        name: 'list_files',
                        description: 'List files in a DarkDrop account',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                accountId: {
                                    type: 'string',
                                    description: 'Brand account ID',
                                },
                                folder: {
                                    type: 'string',
                                    description: 'Folder path to list',
                                    default: '/',
                                },
                                type: {
                                    type: 'string',
                                    enum: ['agents', 'users', 'shared'],
                                    description: 'Filter by storage type',
                                },
                            },
                        },
                    },
                    {
                        name: 'search_files',
                        description: 'Search for files in a DarkDrop account',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                accountId: {
                                    type: 'string',
                                    description: 'Brand account ID',
                                },
                                query: {
                                    type: 'string',
                                    description: 'Search query',
                                },
                            },
                            required: ['query'],
                        },
                    },
                    {
                        name: 'delete_file',
                        description: 'Delete a file from DarkDrop storage',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                fileId: {
                                    type: 'string',
                                    description: 'File ID to delete',
                                },
                            },
                            required: ['fileId'],
                        },
                    },
                    {
                        name: 'share_file',
                        description: 'Create a public share link for a file',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                fileId: {
                                    type: 'string',
                                    description: 'File ID to share',
                                },
                            },
                            required: ['fileId'],
                        },
                    },
                ],
            };
        });

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                switch (name) {
                    case 'upload_file':
                        return await this.uploadFile(args);
                    case 'download_file':
                        return await this.downloadFile(args);
                    case 'list_files':
                        return await this.listFiles(args);
                    case 'search_files':
                        return await this.searchFiles(args);
                    case 'delete_file':
                        return await this.deleteFile(args);
                    case 'share_file':
                        return await this.shareFile(args);
                    default:
                        throw new Error(`Unknown tool: ${name}`);
                }
            } catch (error) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${error.message}`,
                        },
                    ],
                };
            }
        });
    }

    async uploadFile(args) {
        const accountId = args.accountId || ACCOUNT_ID;
        const type = args.type || 'agents';
        const folder = args.folder || '/';

        if (!accountId) {
            throw new Error('Account ID required (set DARKDROP_ACCOUNT_ID or provide accountId)');
        }

        // Get agent from API key
        const agent = await this.db.getAgentByApiKey(API_KEY);
        if (!agent) {
            throw new Error('Invalid API key');
        }

        // Check permissions
        const hasAccess = await this.db.checkPermission(accountId, null, agent.id, 'write');
        if (!hasAccess) {
            throw new Error('Access denied');
        }

        // Read source file
        const sourceBuffer = await fs.readFile(args.filePath);
        const stats = await fs.stat(args.filePath);
        const originalName = path.basename(args.filePath);

        // Generate unique filename
        const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}-${originalName}`;
        const destPath = path.join(STORAGE_ROOT, accountId, type, uniqueName);

        // Create directory
        await fs.mkdir(path.dirname(destPath), { recursive: true });

        // Write file
        await fs.writeFile(destPath, sourceBuffer);

        // Calculate checksum
        const checksum = crypto.createHash('sha256').update(sourceBuffer).digest('hex');

        // Create file record
        const fileId = crypto.randomUUID();
        await this.db.createFile({
            id: fileId,
            accountId,
            name: uniqueName,
            originalName,
            path: destPath,
            size: stats.size,
            mimeType: this.getMimeType(originalName),
            type,
            uploadedByUserId: null,
            uploadedByAgentId: agent.id,
            folder,
            checksum,
        });

        // Update account storage
        await this.db.updateAccountStorage(accountId, stats.size);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        fileId,
                        name: originalName,
                        size: stats.size,
                        checksum,
                    }, null, 2),
                },
            ],
        };
    }

    async downloadFile(args) {
        const file = await this.db.getFile(args.fileId);
        if (!file) {
            throw new Error('File not found');
        }

        // Get agent from API key
        const agent = await this.db.getAgentByApiKey(API_KEY);
        if (!agent) {
            throw new Error('Invalid API key');
        }

        // Check permissions
        const hasAccess = await this.db.checkPermission(file.account_id, null, agent.id, 'read');
        if (!hasAccess) {
            throw new Error('Access denied');
        }

        // Read file
        const fileBuffer = await fs.readFile(file.path);

        // Determine destination
        let destPath;
        if (args.destination) {
            destPath = args.destination;
        } else {
            destPath = path.join(process.cwd(), file.original_name);
        }

        // Write file
        await fs.writeFile(destPath, fileBuffer);

        // Update download count
        await this.db.incrementDownloadCount(file.id);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        path: destPath,
                        size: file.size,
                    }, null, 2),
                },
            ],
        };
    }

    async listFiles(args) {
        const accountId = args.accountId || ACCOUNT_ID;
        const folder = args.folder || '/';
        const type = args.type || null;

        if (!accountId) {
            throw new Error('Account ID required');
        }

        // Get agent from API key
        const agent = await this.db.getAgentByApiKey(API_KEY);
        if (!agent) {
            throw new Error('Invalid API key');
        }

        // Check permissions
        const hasAccess = await this.db.checkPermission(accountId, null, agent.id, 'read');
        if (!hasAccess) {
            throw new Error('Access denied');
        }

        const files = await this.db.listFiles(accountId, folder, type);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        files: files.map(f => ({
                            id: f.id,
                            name: f.original_name,
                            size: f.size,
                            mimeType: f.mime_type,
                            type: f.type,
                            folder: f.folder,
                            createdAt: f.created_at,
                        })),
                    }, null, 2),
                },
            ],
        };
    }

    async searchFiles(args) {
        const accountId = args.accountId || ACCOUNT_ID;

        if (!accountId) {
            throw new Error('Account ID required');
        }

        // Get agent from API key
        const agent = await this.db.getAgentByApiKey(API_KEY);
        if (!agent) {
            throw new Error('Invalid API key');
        }

        // Check permissions
        const hasAccess = await this.db.checkPermission(accountId, null, agent.id, 'read');
        if (!hasAccess) {
            throw new Error('Access denied');
        }

        const files = await this.db.searchFiles(accountId, args.query);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        files: files.map(f => ({
                            id: f.id,
                            name: f.original_name,
                            size: f.size,
                            mimeType: f.mime_type,
                            type: f.type,
                            folder: f.folder,
                            createdAt: f.created_at,
                        })),
                    }, null, 2),
                },
            ],
        };
    }

    async deleteFile(args) {
        const file = await this.db.getFile(args.fileId);
        if (!file) {
            throw new Error('File not found');
        }

        // Get agent from API key
        const agent = await this.db.getAgentByApiKey(API_KEY);
        if (!agent) {
            throw new Error('Invalid API key');
        }

        // Check permissions
        const hasAccess = await this.db.checkPermission(file.account_id, null, agent.id, 'write');
        if (!hasAccess) {
            throw new Error('Access denied');
        }

        // Delete physical file
        await fs.unlink(file.path).catch(() => {});

        // Delete database record
        await this.db.deleteFile(file.id);

        // Update account storage
        await this.db.updateAccountStorage(file.account_id, -file.size);

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        message: 'File deleted successfully',
                    }, null, 2),
                },
            ],
        };
    }

    async shareFile(args) {
        const file = await this.db.getFile(args.fileId);
        if (!file) {
            throw new Error('File not found');
        }

        // Get agent from API key
        const agent = await this.db.getAgentByApiKey(API_KEY);
        if (!agent) {
            throw new Error('Invalid API key');
        }

        // Check permissions
        const hasAccess = await this.db.checkPermission(file.account_id, null, agent.id, 'write');
        if (!hasAccess) {
            throw new Error('Access denied');
        }

        const publicToken = crypto.randomBytes(16).toString('hex');
        await this.db.makeFilePublic(file.id, publicToken);

        const publicUrl = `https://darkdrop.hiveskill.com/public/${publicToken}`;

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        publicUrl,
                        token: publicToken,
                    }, null, 2),
                },
            ],
        };
    }

    getMimeType(filename) {
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.json': 'application/json',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.zip': 'application/zip',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };
        return mimeTypes[ext] || 'application/octet-stream';
    }

    async start() {
        await this.db.initialize();

        const transport = new StdioServerTransport();
        await this.server.connect(transport);

        console.error('DarkDrop MCP server running on stdio');
    }
}

// Start server
const server = new DarkDropMCPServer();
server.start().catch((error) => {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
});
