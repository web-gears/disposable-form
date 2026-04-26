# Disposable Form

A temporary form service that auto-deletes after expiration. Perfect for one-time surveys, event registrations, or collecting sensitive data securely.

## Features

- Create forms with expiration time
- Auto-delete after expiration
- Supports various field types: text, textarea, number, email, password, select, checkbox, radio, date, datetime, range, switch
- Client-side validation
- Session-based access

## API

**Production URL:** https://disposable.webgears.org/

### Create Form

```bash
curl -X POST https://disposable.webgears.org/create \
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

### Submit Form

```bash
curl -X POST https://disposable.webgears.org/my-session-id/submit \
  -H "Content-Type: application/json" \
  -d '{
    "values": {
      "name": "John Doe",
      "email": "john@example.com"
    }
  }'
```

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