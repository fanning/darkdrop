# DarkDrop - Project Memory

## Project Overview

**DarkDrop** is a multi-tenant file storage service designed for secure file management across multiple brands and organizations. It provides dual access: a web interface for humans and API/MCP integration for AI agents.

**Location**: `/home/fanning/darkdrop/`
**Domain**: `darkdrop.hiveskill.com`
**Status**: Development (Not yet deployed)

---

## Architecture

### Components

1. **API Server** (`/api`)
   - Express.js REST API
   - JWT and API key authentication
   - File upload/download with streaming
   - Port: 3000

2. **Frontend** (`/frontend`)
   - React + Vite SPA
   - File browser interface
   - Account management
   - Port: 5173 (dev), served by Nginx (prod)

3. **MCP Server** (`/mcp-server`)
   - Model Context Protocol integration
   - Stdio transport for Claude Code
   - Six file management tools

4. **Database** (`/database`)
   - SQLite with 7 tables
   - Multi-tenant data model
   - Access control system

---

## Database Schema

### Tables

1. **accounts** - Brand accounts (tenants)
   - Primary fields: id, name, domain, storage_quota, storage_used
   - Seed data: custcorp, tibstar, hiveskill

2. **users** - Human users with password auth
   - Primary fields: id, email, password_hash, name

3. **agents** - AI agents with API key auth
   - Primary fields: id, name, api_key

4. **permissions** - Access control
   - Links users/agents to accounts with roles (read, write, admin)

5. **files** - File metadata
   - Primary fields: id, account_id, path, size, mime_type, type
   - Types: agents, users, shared

6. **sessions** - JWT session management
   - Expires after 7 days

---

## Storage Structure

```
/var/darkdrop/
├── custcorp/
│   ├── agents/      # Files from AI agents
│   ├── users/       # Files from human users
│   └── shared/      # Shared files
├── tibstar/
└── hiveskill/
```

---

## API Endpoints

### Authentication
- `POST /auth/register` - Register user
- `POST /auth/login` - Login (returns JWT + accounts)
- `POST /auth/logout` - Logout

### Files
- `POST /upload/:accountId` - Upload file (5GB max)
- `GET /download/:fileId` - Download file
- `GET /files/:accountId` - List files
- `GET /files/:accountId/search?q=` - Search files
- `DELETE /files/:fileId` - Delete file
- `POST /files/:fileId/share` - Create public link
- `GET /public/:token` - Public download (no auth)

### Accounts
- `GET /accounts` - List accessible accounts
- `GET /accounts/:accountId` - Get account details

---

## MCP Tools

Available to AI agents via Model Context Protocol:

1. **upload_file** - Upload local file to DarkDrop
2. **download_file** - Download file from DarkDrop
3. **list_files** - List files in account
4. **search_files** - Search by filename
5. **delete_file** - Delete file
6. **share_file** - Generate public link

---

## Setup & Deployment

### Initial Setup

```bash
cd ~/darkdrop
npm run setup              # Install all dependencies
npm run db:init            # Initialize database
node scripts/create-account.js custcorp 'CustCorp' custcorp.com
node scripts/create-agent.js 'Agent' custcorp write
```

### Development

```bash
npm run dev                # Start API + Frontend
npm run dev:api            # API only (port 3000)
npm run dev:frontend       # Frontend only (port 5173)
```

### Production

```bash
npm run build:frontend     # Build React app
pm2 start ecosystem.config.js
pm2 save
```

### Nginx Configuration

```bash
sudo cp nginx.conf /etc/nginx/sites-available/darkdrop.hiveskill.com
sudo ln -s /etc/nginx/sites-available/darkdrop.hiveskill.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d darkdrop.hiveskill.com
```

---

## Admin Scripts

Located in `/scripts`:

- `create-account.js` - Create new brand account
- `create-agent.js` - Create AI agent with API key
- `create-user-permission.js` - Grant user access to account
- `list-accounts.js` - List all accounts
- `setup.sh` - Complete setup from scratch

---

## Configuration Files

- `.env` - Environment variables (JWT_SECRET, STORAGE_ROOT)
- `ecosystem.config.js` - PM2 process management
- `nginx.conf` - Nginx reverse proxy config
- `docker-compose.yml` - Docker deployment (optional)

---

## Security Features

- Passwords: bcrypt with 10 rounds
- JWT tokens: 7-day expiry, secure random
- API keys: 32-byte random hex
- File checksums: SHA-256
- Public links: Random tokens
- Role-based access: read, write, admin
- HTTPS enforced in production

---

## Key Design Decisions

1. **Multi-Tenant Isolation**: Each account has its own storage directory and access control
2. **Dual Authentication**: JWT for users, API keys for agents
3. **File Storage**: Filesystem + SQLite metadata (not blob storage)
4. **Type Separation**: Agents, users, and shared files in separate directories
5. **MCP Integration**: Stdio transport for seamless Claude Code integration

---

## Development Status

**Current Phase**: Initial implementation complete
**Next Steps**:
1. Test all API endpoints
2. Test MCP server integration
3. Deploy to darkdrop.hiveskill.com
4. Create first accounts and test users

---

## Integration with Other Projects

### CustCorp
- Use DarkDrop for document storage
- Agent uploads compliance documents
- Users download reports

### TaskHash
- Store task attachments
- Share files between coordinators

### AI Web Interface
- Integrate file upload/download
- Multi-tenant file access for agents

---

## Monitoring & Maintenance

### Check Status
```bash
pm2 status
pm2 logs darkdrop-api
```

### Database
```bash
sqlite3 database/darkdrop.db
SELECT * FROM accounts;
```

### Storage Usage
```bash
du -sh /var/darkdrop/*
```

### Clean Expired Sessions
```bash
node -e "const Database = require('./database'); const db = new Database(); db.initialize().then(() => db.cleanExpiredSessions()).then(() => process.exit(0));"
```

---

## Troubleshooting

### Database Locked
```bash
pm2 stop all
rm database/darkdrop.db-journal
pm2 restart all
```

### Storage Permissions
```bash
sudo chown -R $USER:$USER /var/darkdrop
sudo chmod -R 755 /var/darkdrop
```

### File Upload Fails
- Check client_max_body_size in nginx.conf (5G)
- Check disk space: df -h /var/darkdrop
- Check PM2 logs for errors

---

## TODO

- [ ] Add file preview for images/PDFs
- [ ] Implement folder management
- [ ] Add batch upload
- [ ] Add file versioning
- [ ] Add download statistics
- [ ] Add storage alerts (quota warnings)
- [ ] Add file search by content (full-text)
- [ ] Add file expiration/auto-delete
- [ ] Add audit logging
- [ ] Add S3 storage backend option

---

**Last Updated**: 2026-01-30
**Current Version**: 1.0.0
