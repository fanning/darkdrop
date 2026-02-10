# DarkDrop API Documentation

## Base URL

```
Development: http://localhost:3000
Production: https://darkdrop.com
```

## Authentication

DarkDrop supports two authentication methods:

### 1. JWT Token (for users)

```bash
# Login to get token
curl -X POST https://darkdrop.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Response
{
  "token": "abc123...",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "accounts": [
    {
      "id": "custcorp",
      "name": "CustCorp",
      "domain": "custcorp.com",
      "role": "write"
    }
  ]
}

# Use token in requests
curl -H "Authorization: Bearer abc123..." https://darkdrop.com/files/custcorp
```

### 2. API Key (for agents)

```bash
# Use API key in header
curl -H "x-api-key: your-api-key-here" https://darkdrop.com/files/custcorp
```

---

## Endpoints

### Authentication

#### Register User

```bash
POST /auth/register
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "User Name"
}
```

**Response**:
```json
{
  "message": "User created successfully",
  "userId": "user-id"
}
```

#### Login

```bash
POST /auth/login
```

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "token": "jwt-token",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name"
  },
  "accounts": [
    {
      "id": "custcorp",
      "name": "CustCorp",
      "domain": "custcorp.com",
      "role": "write"
    }
  ]
}
```

#### Logout

```bash
POST /auth/logout
Authorization: Bearer {token}
```

**Response**:
```json
{
  "message": "Logged out successfully"
}
```

---

### Accounts

#### List Accounts

```bash
GET /accounts
Authorization: Bearer {token}
# OR
x-api-key: {api-key}
```

**Response**:
```json
{
  "accounts": [
    {
      "id": "custcorp",
      "name": "CustCorp",
      "domain": "custcorp.com",
      "role": "write"
    }
  ]
}
```

#### Get Account Details

```bash
GET /accounts/:accountId
Authorization: Bearer {token}
# OR
x-api-key: {api-key}
```

**Response**:
```json
{
  "id": "custcorp",
  "name": "CustCorp",
  "domain": "custcorp.com",
  "storage_quota": 107374182400,
  "storage_used": 1048576,
  "created_at": "2026-01-30T12:00:00.000Z",
  "status": "active"
}
```

---

### Files

#### Upload File

```bash
POST /upload/:accountId
Authorization: Bearer {token}
# OR
x-api-key: {api-key}
Content-Type: multipart/form-data
```

**Form Data**:
- `file` (required): File to upload
- `type` (optional): Storage type (agents, users, shared) - defaults to 'users' for JWT, 'agents' for API key
- `folder` (optional): Folder path - defaults to '/'

**Example**:
```bash
curl -X POST https://darkdrop.com/upload/custcorp \
  -H "Authorization: Bearer {token}" \
  -F "file=@document.pdf" \
  -F "type=users" \
  -F "folder=/reports"
```

**Response**:
```json
{
  "fileId": "file-id",
  "name": "document.pdf",
  "size": 1048576,
  "mimeType": "application/pdf",
  "checksum": "sha256-hash"
}
```

#### Download File

```bash
GET /download/:fileId
Authorization: Bearer {token}
# OR
x-api-key: {api-key}
```

**Response**: File binary data with appropriate Content-Type header

**Example**:
```bash
curl -H "Authorization: Bearer {token}" \
  https://darkdrop.com/download/file-id \
  -o downloaded-file.pdf
```

#### List Files

```bash
GET /files/:accountId?folder=/&type=users
Authorization: Bearer {token}
# OR
x-api-key: {api-key}
```

**Query Parameters**:
- `folder` (optional): Folder path - defaults to '/'
- `type` (optional): Filter by type (agents, users, shared)

**Response**:
```json
{
  "files": [
    {
      "id": "file-id",
      "name": "document.pdf",
      "size": 1048576,
      "mimeType": "application/pdf",
      "type": "users",
      "folder": "/",
      "isPublic": false,
      "downloadCount": 5,
      "createdAt": "2026-01-30T12:00:00.000Z"
    }
  ]
}
```

#### Search Files

```bash
GET /files/:accountId/search?q=query
Authorization: Bearer {token}
# OR
x-api-key: {api-key}
```

**Query Parameters**:
- `q` (required): Search query (searches file names)

**Response**:
```json
{
  "files": [
    {
      "id": "file-id",
      "name": "report-2026.pdf",
      "size": 1048576,
      "mimeType": "application/pdf",
      "type": "users",
      "folder": "/reports",
      "createdAt": "2026-01-30T12:00:00.000Z"
    }
  ]
}
```

#### Delete File

```bash
DELETE /files/:fileId
Authorization: Bearer {token}
# OR
x-api-key: {api-key}
```

**Response**:
```json
{
  "message": "File deleted successfully"
}
```

**Note**: Requires 'write' or 'admin' role

#### Create Share Link

```bash
POST /files/:fileId/share
Authorization: Bearer {token}
# OR
x-api-key: {api-key}
```

**Response**:
```json
{
  "publicUrl": "https://darkdrop.com/public/abc123",
  "token": "abc123"
}
```

**Note**: Requires 'write' or 'admin' role

#### Download Public File

```bash
GET /public/:token
```

**No authentication required**

**Response**: File binary data

**Example**:
```bash
curl https://darkdrop.com/public/abc123 -o file.pdf
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized (no auth or invalid auth)
- `403` - Forbidden (valid auth but insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error

### Common Errors

```json
// No authentication provided
{
  "error": "No authentication provided"
}

// Invalid token/API key
{
  "error": "Invalid token"
}

// Insufficient permissions
{
  "error": "Access denied"
}

// Account not found
{
  "error": "Account ID required"
}

// File not found
{
  "error": "File not found"
}

// Upload failed
{
  "error": "Upload failed"
}
```

---

## Rate Limits

Currently no rate limits are enforced, but this may change in production.

---

## File Size Limits

- Maximum file size: 5GB
- Configurable via Nginx `client_max_body_size`

---

## Examples

### Complete Upload/Download Flow

```bash
# 1. Register user
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# 2. Login
TOKEN=$(curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' | jq -r '.token')

# 3. Upload file
FILE_ID=$(curl -X POST http://localhost:3000/upload/custcorp \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test.pdf" | jq -r '.fileId')

# 4. List files
curl http://localhost:3000/files/custcorp \
  -H "Authorization: Bearer $TOKEN"

# 5. Download file
curl http://localhost:3000/download/$FILE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded.pdf

# 6. Create share link
SHARE_URL=$(curl -X POST http://localhost:3000/files/$FILE_ID/share \
  -H "Authorization: Bearer $TOKEN" | jq -r '.publicUrl')

# 7. Download via public link (no auth)
curl $SHARE_URL -o public-download.pdf

# 8. Delete file
curl -X DELETE http://localhost:3000/files/$FILE_ID \
  -H "Authorization: Bearer $TOKEN"

# 9. Logout
curl -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

### Using with API Key (Agent)

```bash
# Get API key from admin
API_KEY="your-api-key-here"

# List files
curl http://localhost:3000/files/custcorp \
  -H "x-api-key: $API_KEY"

# Upload file
curl -X POST http://localhost:3000/upload/custcorp \
  -H "x-api-key: $API_KEY" \
  -F "file=@document.pdf" \
  -F "type=agents"

# Download file
curl http://localhost:3000/download/file-id \
  -H "x-api-key: $API_KEY" \
  -o file.pdf
```

---

## WebSocket Support

Not currently supported. All operations are HTTP REST.

---

## Versioning

Current API version: v1 (no version prefix in URLs)

Future versions will use `/v2/` prefix when breaking changes are introduced.

---

## Support

For API issues or questions:
- GitHub: github.com/fanning/darkdrop
- Email: support@hiveskill.com
