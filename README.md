# DarkDrop

Multi-tenant file storage service with support for human users and AI agents via Model Context Protocol (MCP).

## Features

- **Multi-Tenant Architecture**: One service, multiple brand accounts
- **Dual Access**: Web interface for humans, API + MCP for agents
- **Secure Storage**: File-based storage with SQLite metadata
- **Access Control**: Role-based permissions (read, write, admin)
- **Public Sharing**: Generate public download links
- **Large File Support**: Handles files up to 5GB
- **Production Ready**: PM2, Nginx, SSL support

## Architecture

```
darkdrop/
├── api/                 # Express REST API server
├── frontend/            # React + Vite web interface
├── mcp-server/          # Model Context Protocol server
├── database/            # SQLite schema and models
├── storage/             # Local file storage root
├── ecosystem.config.js  # PM2 configuration
├── nginx.conf           # Nginx reverse proxy config
└── docker-compose.yml   # Docker deployment (optional)
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- PM2 (for production)
- Nginx (for production)

### Installation

1. Clone and install dependencies:

```bash
cd ~/darkdrop
npm run setup
```

2. Create environment file:

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Initialize database:

```bash
npm run db:init
```

4. Create storage directory:

```bash
sudo mkdir -p /var/darkdrop
sudo chown $USER:$USER /var/darkdrop
```

### Development

Start both API and frontend in development mode:

```bash
npm run dev
```

Or start them separately:

```bash
# Terminal 1: API server
npm run dev:api

# Terminal 2: Frontend
npm run dev:frontend
```

Access the web interface at http://localhost:5173

### Production Deployment

1. Build frontend:

```bash
npm run build:frontend
```

2. Start with PM2:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions to enable startup
```

3. Configure Nginx:

```bash
sudo cp nginx.conf /etc/nginx/sites-available/darkdrop.hiveskill.com
sudo ln -s /etc/nginx/sites-available/darkdrop.hiveskill.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

4. Setup SSL with Let's Encrypt:

```bash
sudo certbot --nginx -d darkdrop.hiveskill.com
```

## Usage

### Web Interface

1. Register a new user at https://darkdrop.hiveskill.com/register
2. Login and select your brand account
3. Upload, download, and manage files
4. Create public share links

### REST API

Authenticate with JWT token (from login) or API key:

```bash
# Upload file
curl -X POST https://darkdrop.hiveskill.com/upload/custcorp \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@document.pdf" \
  -F "type=agents"

# List files
curl https://darkdrop.hiveskill.com/files/custcorp \
  -H "Authorization: Bearer YOUR_TOKEN"

# Download file
curl https://darkdrop.hiveskill.com/download/FILE_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -O

# Delete file
curl -X DELETE https://darkdrop.hiveskill.com/files/FILE_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### MCP Server (for AI Agents)

Configure in your MCP client (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "darkdrop": {
      "command": "node",
      "args": ["/home/fanning/darkdrop/mcp-server/index.js"],
      "env": {
        "DARKDROP_API_KEY": "your-agent-api-key",
        "DARKDROP_ACCOUNT_ID": "custcorp",
        "STORAGE_ROOT": "/var/darkdrop"
      }
    }
  }
}
```

Available tools:
- `upload_file`: Upload a file to storage
- `download_file`: Download a file from storage
- `list_files`: List files in an account
- `search_files`: Search for files by name
- `delete_file`: Delete a file
- `share_file`: Create public share link

## Database Schema

- **accounts**: Brand accounts (tenants)
- **users**: Human users with password authentication
- **agents**: AI agents with API key authentication
- **permissions**: Access control linking users/agents to accounts
- **files**: File metadata (actual files stored in filesystem)
- **sessions**: JWT session management

## Storage Structure

```
/var/darkdrop/
├── custcorp/
│   ├── agents/      # Files uploaded by agents
│   ├── users/       # Files uploaded by users
│   └── shared/      # Shared files
├── tibstar/
│   ├── agents/
│   ├── users/
│   └── shared/
└── hiveskill/
    ├── agents/
    ├── users/
    └── shared/
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token
- `POST /auth/logout` - Logout and invalidate token

### Accounts
- `GET /accounts` - List accessible accounts
- `GET /accounts/:accountId` - Get account details

### Files
- `POST /upload/:accountId` - Upload file
- `GET /download/:fileId` - Download file
- `GET /files/:accountId` - List files
- `GET /files/:accountId/search?q=query` - Search files
- `DELETE /files/:fileId` - Delete file
- `POST /files/:fileId/share` - Create public share link
- `GET /public/:token` - Public file download (no auth)

## Administration

### Create Agent API Key

```bash
node -e "
const Database = require('./database');
const crypto = require('crypto');
(async () => {
  const db = new Database();
  await db.initialize();
  const apiKey = crypto.randomBytes(32).toString('hex');
  await db.createAgent(crypto.randomUUID(), 'MyAgent', apiKey);
  console.log('API Key:', apiKey);
  await db.close();
})();
"
```

### Grant Account Access

```bash
node -e "
const Database = require('./database');
const crypto = require('crypto');
(async () => {
  const db = new Database();
  await db.initialize();
  await db.createPermission(
    crypto.randomUUID(),
    'custcorp',        // accountId
    null,              // userId (null for agent)
    'AGENT_ID',        // agentId
    'write'            // role: read, write, admin
  );
  console.log('Permission granted');
  await db.close();
})();
"
```

### Monitor Storage Usage

```bash
# Check PM2 logs
pm2 logs darkdrop-api

# Check storage usage
du -sh /var/darkdrop/*

# Check database
sqlite3 database/darkdrop.db "SELECT name, storage_used/1024/1024 as mb_used FROM accounts"
```

## Security

- JWT tokens expire after 7 days
- Passwords hashed with bcrypt
- File checksums (SHA-256) stored for integrity
- Role-based access control
- Public share links use random tokens
- File uploads limited to 5GB
- HTTPS enforced in production

## Development

### Project Structure

```javascript
// Database access
const Database = require('./database');
const db = new Database();
await db.initialize();

// Create account
await db.createAccount('newbrand', 'New Brand', 'newbrand.com');

// Check permissions
const hasAccess = await db.checkPermission(accountId, userId, agentId, 'write');
```

### Testing

```bash
# Run API tests
cd api && npm test

# Test MCP server
node mcp-server/index.js < test-input.json
```

## Troubleshooting

### Database locked

```bash
# Stop all processes
pm2 stop all

# Remove lock
rm database/darkdrop.db-journal

# Restart
pm2 restart all
```

### Storage permission denied

```bash
sudo chown -R $USER:$USER /var/darkdrop
sudo chmod -R 755 /var/darkdrop
```

### Nginx 413 Request Entity Too Large

```bash
# Edit nginx.conf
client_max_body_size 5G;

# Reload
sudo nginx -t && sudo systemctl reload nginx
```

## License

MIT

## Support

For issues and questions:
- GitHub Issues: github.com/fanning/darkdrop
- Email: support@hiveskill.com
