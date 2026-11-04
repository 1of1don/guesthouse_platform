# Mobile customer app

Customers browse, search and filter guesthouses without an account. After signing up they can save
favourites and rate guesthouses. It reads the same Firestore data the admins create on the website.

## Tech stack

React Native with Expo SDK 57 and expo-router (TypeScript), Firebase Authentication + Firestore,
Leaflet + OpenStreetMap in a WebView for the Map tab (no API key). Every file in `src/` starts with a
comment saying what it is. The full file map is in `../DOCUMENTATION.md`, section 5.

## Set up and run

```bash
npm install
cp .env.example .env      # then fill in the values below
npx expo start            # scan the QR code with Expo Go, or press w for the browser
```

| Variable | Example placeholder |
|---|---|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | `your-api-key` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | `your-project-id.firebaseapp.com` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | `your-project-id` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | `your-project-id.firebasestorage.app` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `your-sender-id` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | `your-app-id` |

Use the same Firebase project as the website. After changing `.env`, restart with `npx expo start -c`.

## Build an Android APK

```bash
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile apk
```

## Checks

```bash
npx tsc --noEmit
npx expo lint
```
