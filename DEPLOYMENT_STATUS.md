# DarkDrop Deployment Status - 2026-02-10

## SITE IS LIVE

**Primary URL**: https://darkdrop.com
**API URL**: https://api.darkdrop.com
**Status**: FULLY OPERATIONAL

---

## Services

| Service | Port | PM2 Name | Status |
|---------|------|----------|--------|
| API Server | 3001 | darkdrop-api | Running |
| Coordinator | 3020 | darkdrop-coordinator | Running |
| File Watcher | 3120 | darkdrop-service | Running |
| RAG Service | 8090 | darkdrop-rag | Running |

---

## Infrastructure

### Frontend
- **Technology**: React + Vite SPA
- **Deployment**: Netlify (auto-deploy from GitHub)
- **URL**: https://darkdrop.com
- **Repository**: https://github.com/fanning/darkdrop

### Backend API
- **Port**: 3001
- **Process Manager**: PM2 (darkdrop-api)
- **Database**: SQLite
- **Storage**: /var/darkdrop/

### DNS
- **Provider**: Netlify (NSOne)
- **A Record**: darkdrop.com → Netlify CDN
- **API**: api.darkdrop.com → 44.219.6.212 (nginx → localhost:3001)

### Nginx Configuration
- **Frontend**: Netlify CDN serves static assets
- **API proxy**: /etc/nginx/sites-available/darkdrop.com
- **SSL**: Let's Encrypt (auto-renewed)

---

## Architecture

```
User Browser
    |
darkdrop.com (Netlify DNS)
    |
Netlify CDN (Frontend)
    |
API Requests → api.darkdrop.com
    |
Nginx (44.219.6.212)
    |
darkdrop-api (localhost:3001)
    |
SQLite + File Storage (/var/darkdrop/)
```

---

## Current Access

### Production
```
https://darkdrop.com          # Frontend
https://api.darkdrop.com      # API
```

### Health Checks
```bash
curl -s http://localhost:3001/health    # API
curl -s http://localhost:3020/health    # Coordinator
curl -s http://localhost:8090/health    # RAG
```

---

## Monitoring

```bash
# Service status
pm2 status | grep darkdrop

# Logs
pm2 logs darkdrop-api --lines 50
pm2 logs darkdrop-coordinator --lines 50

# DNS
dig +short darkdrop.com A

# Nginx
sudo nginx -t
```

---

**Last Updated**: 2026-02-10
**Deployed By**: Claude Opus 4.6
