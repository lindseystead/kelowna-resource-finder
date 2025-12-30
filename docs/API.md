# API Reference

API endpoints for Help Kelowna.

## Resources

- `GET /api/resources` - List resources (supports `?categoryId=` and `?search=`)
- `GET /api/resources/:id` - Get resource details
- `PATCH /api/resources/:id` - Update resource (admin only)

## Categories

- `GET /api/categories` - List all categories
- `GET /api/categories/:slug` - Get category by slug

## Update Requests

- `GET /api/update-requests` - List update requests (admin only)
- `POST /api/update-requests` - Submit update request (public)
- `PATCH /api/update-requests/:id` - Update request status (admin only)

## Chat

- `GET /api/conversations` - List conversations
- `GET /api/conversations/:id` - Get conversation with messages
- `POST /api/conversations` - Create conversation
- `DELETE /api/conversations/:id` - Delete conversation
- `POST /api/conversations/:id/messages` - Send message (SSE streaming)

## Authentication

- `POST /api/auth/login` - Authenticate user
- `POST /api/auth/logout` - End session
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - Register new user (admin only)

## Health & Status

- `GET /health` - Health check endpoint. Returns `200` with `{ status: 'healthy', timestamp: string }` if database is connected, `503` if connection fails.
- `GET /ready` - Readiness check endpoint. Returns `200` with `{ status: 'ready', timestamp: string, categories: number, resources: number }` if data is loaded, `503` if not ready.

## Other

- `GET /api/stats` - Application statistics (admin only)
- `GET /api/config` - Public configuration (support email, base URL)
- `POST /api/test-email` - Test email configuration (admin only)
- `GET /sitemap.xml` - SEO sitemap

## Auth Details

Most endpoints use session cookies. Admin endpoints require the `admin` role.

## Rate Limiting

Rate limiting is applied via `express-rate-limit`:
- Auth endpoints: 5 requests per 15 minutes
- Login endpoint: 3 requests per 15 minutes  
- General API (`/api/*`): 100 requests per 15 minutes
- Strict endpoints: 20 requests per 15 minutes

## Errors

```json
{
  "error": "Error type",
  "message": "Error message"
}
```

Status codes: `400` (bad request), `401` (unauthorized), `403` (forbidden), `404` (not found), `500` (server error)
