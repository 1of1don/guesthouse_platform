# Mi Casa Es Su Casa

Guesthouse discovery platform (no booking). Customers browse, search, favourite and rate guesthouses in a mobile app. Staff manage the listings through a web admin portal. Both use one Firebase project.

BIUST, Department of Computing and Informatics, COMP 311 group project.

## Parts

| Folder | What it is | Tech |
|---|---|---|
| `mobile/` | Customer app | Expo (React Native), TypeScript, Firebase |
| `backend/` | Admin API used by the web portal | Node.js, Express, Firebase Admin SDK |
| `web/` | Admin portal (kept by the web team, not in this upload) | React, TypeScript |
| `docs/` | System document, web integration guide, UML, database schema | Markdown |
| `prototype/` | Clickable HTML design prototype | HTML, CSS, JavaScript |
| `firestore.rules` | Database security rules | Firestore rules |

How the parts connect: see [docs/UML.md](docs/UML.md). Short version: the mobile app talks to Firebase directly (browse, log in, favourite, rate). The web portal talks to the backend for everything staff do. Firestore is the shared database.

## Quick start

Requires Node 22 or newer.

### 1. Firebase (one person, once)
1. Create a project at console.firebase.google.com and register a **Web** app. Copy its config.
2. Authentication > Sign-in method > enable **Email/Password**.
3. Firestore Database > create database. Then Rules > paste `firestore.rules` > Publish.
4. Project settings > Service accounts > **Generate new private key**. Save it as `backend/serviceAccountKey.json`. It is git-ignored. Never commit it.

### 2. Backend
```
cd backend
npm install
cp .env.example .env        # then edit .env
npm run create-superadmin -- you@example.com "StrongPassword" "Your Name"
npm run seed                # optional sample guesthouses
npm start                   # http://localhost:4000/api/health
npm test                    # 14 tests, no Firebase needed
```

### 3. Mobile
```
cd mobile
npm install --legacy-peer-deps
cp .env.example .env        # paste the Firebase web config
npx expo start -c           # scan the QR code with Expo Go
```
Demo flow: browse without an account, sign up, heart a guesthouse, leave a rating.

### 4. Web portal
Follow [docs/WEB_INTEGRATION.md](docs/WEB_INTEGRATION.md).

## Environment variables

| Where | Name | Meaning |
|---|---|---|
| backend | `PORT` | API port, default 4000 |
| backend | `FIREBASE_PROJECT_ID` | Firebase project id |
| backend | `GOOGLE_APPLICATION_CREDENTIALS` | Path to the service account key file |
| backend | `FIREBASE_SERVICE_ACCOUNT` | Alternative: the key file as one line of JSON |
| backend | `ALLOWED_ORIGINS` | Web app addresses allowed to call the API (comma separated) |
| mobile | `EXPO_PUBLIC_FIREBASE_*` | Six values from the Firebase web config (see `mobile/.env.example`) |

Use the `.env.example` files as templates. Real `.env` files are git-ignored.

## Documentation

| File | Read it to |
|---|---|
| [docs/SYSTEM.md](docs/SYSTEM.md) | Understand every part of the code and how to change it |
| [docs/WEB_INTEGRATION.md](docs/WEB_INTEGRATION.md) | Connect the web portal: login, endpoints, schema, roles |
| [docs/UML.md](docs/UML.md) | See the diagrams: architecture, classes, sequences, data model |
| [docs/DATABASE.md](docs/DATABASE.md) | Look up collections and fields |
| [docs/CONTRIBUTION_LOG.md](docs/CONTRIBUTION_LOG.md) | Who did what |

## Group members

| Name | Student number | Area |
|---|---|---|
| (fill in) | (fill in) | |
