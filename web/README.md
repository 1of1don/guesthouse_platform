# Web admin portal

Admins log in here to register and manage guesthouses, see the dashboard, add other admins, and
moderate customers and reviews.

## Tech stack

React 19 + TypeScript (Vite), Tailwind CSS, Firebase Authentication + Firestore, Cloudinary for photos,
Leaflet + OpenStreetMap for the map, and a small Express server (`server.ts`) that serves the site.
Why these: see `../DOCUMENTATION.md`, section 1.

## Set up and run

```bash
npm install
cp .env.example .env      # then fill in the values below
npm run dev               # http://localhost:3000
```

| Variable | Example placeholder |
|---|---|
| `VITE_FIREBASE_API_KEY` | `your-api-key` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project-id.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_URL` | optional |
| `VITE_FIREBASE_PROJECT_ID` | `your-project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-project-id.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `your-sender-id` |
| `VITE_FIREBASE_APP_ID` | `your-app-id` |
| `VITE_CLOUDINARY_CLOUD_NAME` | `your-cloud-name` |
| `VITE_CLOUDINARY_UPLOAD_PRESET` | `your-unsigned-preset` |

First admin: create a user in Firebase Authentication, then a Firestore document `admins/<their uid>`
with `name`, `email` and `role: "Owner"`. Deploy the rules: `npx firebase-tools deploy --only firestore:rules`.

## Checks

```bash
npx tsc --noEmit
node scripts/test-suspension.cjs
npm run build
```
