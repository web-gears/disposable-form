# Disposable Form

A temporary form service that auto-deletes after expiration. Perfect for one-time surveys, event registrations, or collecting sensitive data securely.

## Features

- Create forms with expiration time
- Auto-delete after expiration
- Supports various field types: text, textarea, number, email, password, select, checkbox, radio, date, datetime, range, switch
- Client-side validation
- Session-based access

## Routes

### GET /

Landing page. Enter a session ID to access your form.

### POST /create

Create a new form session.

```bash
curl -X POST localhost:3000/create \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "my-session-id",
    "fields": [
      {"id": "name", "name": "Name", "type": "text", "required": true},
      {"id": "email", "name": "Email", "type": "email", "required": true}
    ],
    "timeoutSeconds": 3600
  }'
```

Response:
```json
{
  "sessionId": "my-session-id",
  "formUrl": "http://localhost:3000/my-session-id",
  "expiresAt": "2026-04-26T13:00:00.000Z"
}
```

Optionally, pass a `seed` parameter to encrypt submitted form data:

```bash
curl -X POST localhost:3000/create \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "encrypted-session",
    "fields": [
      {"id": "message", "name": "Message", "type": "text", "required": true}
    ],
    "timeoutSeconds": 3600,
    "seed": "my-secret-key"
  }'
```

When a seed is used, the submitted data is encrypted with AES-256-GCM before storage and the seed is discarded. The result endpoint returns only `encryptedData` instead of raw values.

### GET /:sessionId

View and fill the form. Sessions auto-delete after expiration.

### GET /result/:sessionId

View submitted form results.

Response (200 OK, unencrypted):
```json
{
  "sessionId": "my-session-id",
  "submittedAt": "2026-04-26T12:00:00.000Z",
  "expiresAt": "2026-04-26T13:00:00.000Z",
  "values": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

Response (200 OK, encrypted — when `seed` was used on creation):
```json
{
  "encryptedData": "eyJzb2x0IjoiLi4uIiwiaXYiOiIuLi4iLCJ0YWciOiIuLi4iLCJkYXRhIjoiLi4uIn0="
}
```

To decrypt the data, use the same seed with any tool that supports AES-256-GCM, or use the built-in utility:

```bash
curl -s localhost:3000/result/encrypted-session | \
  node -e "
    const { decrypt } = require('./dist/utils/encryption.cjs');
    let body = '';
    process.stdin.on('data', d => body += d);
    process.stdin.on('end', () => {
      const data = JSON.parse(body);
      const decrypted = decrypt(data.encryptedData, 'my-secret-key');
      console.log(JSON.parse(decrypted));
    });
  "
```

Output:
```json
{ "message": "Hello, world!" }
```

### GET /health

Health check endpoint. Returns `{ "status": "ok" }`.

### GET /stats

Stats page with UI showing active sessions, today/week/month totals, total sessions, and uptime.

### GET /get-stats

Get stats as JSON.

```json
{
  "activeSessions": 5,
  "sessionsToday": 10,
  "sessionsWeek": 25,
  "sessionsMonth": 100,
  "totalSessions": 150,
  "uptimeSeconds": 3600
}
```

Error responses:
- `404`: Session not found
- `410`: Session expired
- `202`: Form not yet submitted

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm run start
```

## Free Usage

The hosted service at https://disposable.webgears.org/ is free for all users.

## License

See [LICENCE](./LICENCE) file for usage restrictions.