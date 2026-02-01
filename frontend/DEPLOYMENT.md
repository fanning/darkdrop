# DarkDrop Frontend Deployment

## Overview

DarkDrop is a multi-tenant file storage service with a polished dark-themed UI featuring the Dark Logo (fedora hat icon) from the Dark brand family.

## Features

- ✅ **Dark Logo Integration** - Fedora hat icon in all pages
- ✅ **User Authentication** - Login/Register with JWT tokens
- ✅ **Multi-Account Support** - Dashboard for selecting accounts
- ✅ **File Upload** - Drag-and-drop interface with 5GB max file size
- ✅ **File Management** - Browse, download, delete, share files
- ✅ **Public Sharing** - Generate public links for files
- ✅ **Responsive Design** - Works on desktop and mobile
- ✅ **Dark Theme** - Professional dark UI (#0a0a0a background)

## Tech Stack

- React 18
- Vite (build tool)
- React Router (navigation)
- Axios (HTTP client)
- Modern CSS (no framework dependencies)

## Logo Assets

Located in `public/`:
- `logo-hat-white.png` - White fedora icon (used in dark theme)
- `logo-hat-black.png` - Black fedora icon
- `df_favicon.png` - Favicon
- `dark-final_white.png` - Full Dark logo white
- `dark-final_black.png` - Full Dark logo black

## Local Development

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:5173
Backend API required on: http://localhost:3000

## Production Build

```bash
npm run build
```

Output: `dist/` folder

## Netlify Deployment to darkdrop.com

### Configuration Files

1. **netlify.toml** - Build settings and redirects
2. **public/_redirects** - Netlify redirect rules for SPA

### API Integration

Production frontend calls: `https://api.darkdrop.com`
All `/auth`, `/files`, `/upload`, `/download` endpoints are proxied

### Deploy Steps

1. **Connect to Netlify**:
   - Go to netlify.com
   - New site from Git
   - Select darkdrop repository
   - Base directory: `frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`

2. **Configure Domain**:
   - Add custom domain: `darkdrop.com`
   - Netlify will provide DNS instructions
   - HTTPS automatically via Let's Encrypt

3. **Environment Variables** (if needed):
   - None required - API URL hardcoded in redirects

### Backend Requirement

The frontend requires a backend API at `https://api.darkdrop.com` with these endpoints:

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /accounts` - List user accounts
- `POST /upload/:accountId` - File upload
- `GET /files/:accountId` - List files
- `GET /download/:fileId` - Download file
- `DELETE /files/:fileId` - Delete file
- `POST /files/:fileId/share` - Create public share link
- `GET /public/:token` - Public file download

Backend should:
- Support CORS for darkdrop.com origin
- Accept JWT Bearer tokens in Authorization header
- Handle multipart/form-data for uploads

## Design System

### Colors

- Primary: `#007bff` (Blue)
- Background: `#0a0a0a` (Dark black)
- Card background: `#1a1a1a` (Dark gray)
- Border: `#333` (Medium gray)
- Text: `#ffffff` (White)
- Muted text: `#888` (Gray)
- Success: `#28a745` (Green)
- Danger: `#dc3545` (Red)

### Components

- `.header` - Site header with logo
- `.card` - Content card container
- `.btn` - Button (primary, secondary, danger variants)
- `.form-group` - Form input group
- `.upload-zone` - Drag-drop upload area
- `.file-list` - File browser grid
- `.account-card` - Account selector card
- `.modal` - Modal overlay dialog

## Branding

DarkDrop uses the Dark brand identity:
- Logo: Fedora/cowboy hat with angular wings
- Theme: Mystery, security, professionalism
- Typography: System fonts (Apple/Segoe UI)
- Style: Dark, minimal, modern

## Security

- JWT tokens stored in localStorage
- HTTPS enforced in production
- CORS configured for specific origins
- File size limits (5GB)
- Password requirements (8+ chars)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Future Enhancements

- [ ] Folder organization
- [ ] Bulk file operations
- [ ] Search functionality
- [ ] File preview
- [ ] Upload progress indicator
- [ ] Dark/light theme toggle
- [ ] Mobile app

---

**Last Updated**: 2026-02-01
**Version**: 1.0.0
