# Backend (Admin API)

Express API for the web admin portal. Reads and writes Firestore with the Firebase Admin SDK.

## Why it exists
The Admin SDK bypasses Firestore security rules, so the backend is the only place that can safely:
- create, edit and suspend guesthouses,
- create staff logins (doing this in the browser would sign the super admin out),
- suspend reviews and correct the rating totals,
- compute dashboard statistics.

## Run
```
npm install
cp .env.example .env     # fill in
npm run create-superadmin -- you@example.com "StrongPassword" "Your Name"
npm start
```

## Scripts

| Command | Does |
|---|---|
| `npm start` | Start the API |
| `npm run dev` | Start and restart on file changes |
| `npm test` | Run the tests against an in-memory fake of Firebase |
| `npm run seed` | Write sample guesthouses and reviews (`-- --reset` suspends the existing ones first) |
| `npm run create-superadmin -- <email> <password> [name]` | Create the first super admin |

## Folder layout
```
index.js                  starts the server
server/app.js             Express setup and the JSON error handler
server/routes/            URLs only: check role, call a function, send JSON
server/functions/         business logic, one file per topic
server/models/            Firestore collections and input cleaning
server/config/            Firebase connection and the role lists
scripts/                  seed and first super admin
test/                     tests and the Firebase fake
```
Rule: routes call functions, functions call models. See [../docs/SYSTEM.md](../docs/SYSTEM.md).

API reference: [../docs/WEB_INTEGRATION.md](../docs/WEB_INTEGRATION.md).
