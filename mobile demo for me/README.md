# MiCasa SuCasa

Guesthouse finder. Three parts share one Firebase project.

| Part | Folder | Status |
|---|---|---|
| Mobile demo (HTML, mock data) | `mobile-demo/` | Runs as is. Open `index.html`. |
| Backend (Firebase rules and config) | `backend/` | Deploy with the Firebase CLI. |
| Web portal (add and control data) | separate repository | Not in this repo. Contract in `docs/WEB_WIRING.md`. |

The production mobile app is a separate Expo project. The demo is a design and behaviour reference for it.

## Documents

| File | Read it to |
|---|---|
| `docs/SYSTEM.md` | Understand every section of the demo code and how to change it. |
| `docs/WEB_WIRING.md` | Connect the web portal and the mobile app to the same data. |
| `docs/UML.md` | See component, data, sequence and state diagrams. |

## Run the demo

Open `mobile-demo/index.html` in a browser. Use a phone-sized window.
Demo login: `demo@micasa.app` / `password123`.
Fonts and map tiles load from the internet; the app still runs offline with fallbacks.

## Deploy the backend

1. Create a Firebase project. Enable Authentication (email and password), Firestore and Storage.
2. Install the Firebase CLI and log in.
3. In `backend/`: copy `.firebaserc.example` to `.firebaserc` and set your project id.
4. Deploy: `firebase deploy --only firestore:rules,firestore:indexes,storage` [1]
5. Add the first admin by hand: Firestore, collection `admins`, document id = that user's `uid`.

While building, publish `backend/firestore.dev.rules` instead of `firestore.rules`. It is open until 3 November 2026, then locks. Seed data: `backend/scripts/seed.mjs` (needs the dev rules and a `.env`, see `backend/.env.example`).

## Rules

- Never commit `.env`, `.firebaserc` or a Maps key. `.gitignore` covers the first two. Values prefixed `EXPO_PUBLIC_` are inlined into the app bundle and are readable by anyone with the app [2].
- Security is enforced by the Firestore and Storage rules, not by hiding the Firebase config [3].

## Status of verification

Executed: the demo was loaded in a headless browser and its tabs, sheets and screens were opened; the only failing handler found (`closeSheet`) is fixed.
Not executed: `firestore.rules` and `storage.rules` were not run against the Firebase emulator or a live project. Test them before relying on them.

## Sources

1. https://www.rapidevelopers.com/md/firebase-tutorial/how-to-use-firebase-cli-for-deployment
2. https://docs.expo.dev/guides/environment-variables/
3. https://www.mintlify.com/J0nnyGM/pixeltechcol/development/firebase-setup (third-party write-up)
