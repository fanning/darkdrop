# DarkDrop Quick Start Guide

Get DarkDrop up and running in 5 minutes.

## Prerequisites

- Node.js 18+
- npm
- Linux/Mac (Windows via WSL)

## Step 1: Setup

```bash
cd ~/darkdrop
chmod +x scripts/setup.sh
./scripts/setup.sh
```

This will:
- Install all dependencies
- Create `.env` file with secure JWT secret
- Initialize SQLite database
- Create `/var/darkdrop` storage directory
- Build the frontend

## Step 2: Create First Account

```bash
node scripts/create-account.js custcorp "CustCorp" custcorp.com
```

Output:
```
Account created successfully!
ID: custcorp
Name: CustCorp
Domain: custcorp.com
Storage Quota: 100 GB
```

## Step 3: Start Development Server

```bash
npm run dev
```

This starts:
- API server on http://localhost:3000
- Frontend on http://localhost:5173

## Step 4: Register a User

Open http://localhost:5173/register and create an account:
- Name: Your Name
- Email: you@example.com
- Password: (at least 8 characters)

## Step 5: Grant Account Access

```bash
node scripts/create-user-permission.js you@example.com custcorp write
```

Output:
```
Permission granted successfully!
User: Your Name (you@example.com)
Account: CustCorp (custcorp)
Role: write
```

## Step 6: Login and Upload

1. Go to http://localhost:5173/login
2. Login with your credentials
3. Select "CustCorp" account
4. Drag and drop a file to upload
5. Download it back

You're done!

---

## Creating an Agent (Optional)

For AI agent access via MCP:

```bash
node scripts/create-agent.js "My Agent" custcorp write
```

This outputs:
- Agent ID
- API key
- MCP configuration for Claude Desktop

Add to `~/.claude/config.json`:

```json
{
  "mcpServers": {
    "darkdrop": {
      "command": "node",
      "args": ["/home/fanning/darkdrop/mcp-server/index.js"],
      "env": {
        "DARKDROP_API_KEY": "your-api-key-here",
        "DARKDROP_ACCOUNT_ID": "custcorp",
        "STORAGE_ROOT": "/var/darkdrop"
      }
    }
  }
}
```

Restart Claude Desktop to use the new tools.

---

## API Testing

Get your JWT token:

```bash
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"yourpassword"}' | jq -r '.token')

echo $TOKEN
```

Upload a file:

```bash
curl -X POST http://localhost:3000/upload/custcorp \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf"
```

List files:

```bash
curl http://localhost:3000/files/custcorp \
  -H "Authorization: Bearer $TOKEN"
```

---

## Production Deployment

### Option 1: PM2 (Recommended)

```bash
# Build frontend
npm run build:frontend

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/darkdrop.hiveskill.com
sudo ln -s /etc/nginx/sites-available/darkdrop.hiveskill.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Setup SSL
sudo certbot --nginx -d darkdrop.hiveskill.com
```

### Option 2: Docker

```bash
docker-compose up -d
```

---

## Troubleshooting

### Port already in use

```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Database locked

```bash
# Stop servers
pm2 stop all  # or Ctrl+C in dev mode

# Remove lock
rm database/darkdrop.db-journal

# Restart
npm run dev  # or pm2 restart all
```

### Permission denied on /var/darkdrop

```bash
sudo chown -R $USER:$USER /var/darkdrop
sudo chmod -R 755 /var/darkdrop
```

### Frontend shows "Failed to fetch"

Check API is running on port 3000:
```bash
curl http://localhost:3000/health
```

Should return:
```json
{"status":"ok","service":"darkdrop-api"}
```

---

## Next Steps

- Read [README.md](README.md) for full documentation
- Read [API.md](API.md) for API reference
- Read [CLAUDE.md](CLAUDE.md) for project details
- Create more accounts with `node scripts/create-account.js`
- Invite users with `node scripts/create-user-permission.js`
- Create agents with `node scripts/create-agent.js`

---

## Useful Commands

```bash
# List all accounts
node scripts/list-accounts.js

# Create account
node scripts/create-account.js <id> <name> <domain>

# Grant user access
node scripts/create-user-permission.js <email> <account-id> <role>

# Create agent
node scripts/create-agent.js <name> <account-id> <role>

# Check PM2 status
pm2 status
pm2 logs darkdrop-api

# Check storage usage
du -sh /var/darkdrop/*

# Check database
sqlite3 database/darkdrop.db "SELECT * FROM accounts"
```

---

Happy file storing!
