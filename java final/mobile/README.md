# Mobile app (customers)

Expo (React Native) + TypeScript. Reads guesthouses straight from Firestore, so it shows whatever the admin portal saves.

## Features
- Browse and search by name, city or country without an account. Cheapest first by default.
- Sort by price and rating, either direction.
- Guesthouse details: gallery, amenities, contact, "Open in Google Maps", reviews.
- Sign up and log in (Firebase Authentication).
- Logged in: favourites, 1 to 5 star rating with a comment (one per guesthouse, editable).
- Currency picked from the device location, changeable in Settings.
- No booking anywhere.

## Run
```
npm install --legacy-peer-deps
cp .env.example .env     # paste the Firebase web config
npx expo start -c
```
Open with Expo Go. Restart with `-c` whenever `.env` changes.

## Check types
```
npm run typecheck
```

## Tech choices
| Choice | Reason |
|---|---|
| Expo + Expo Router | File-based screens, runs on a phone with no native setup |
| Firebase JS SDK | Same project as the web portal, no server needed for customer features |
| Plain React state and context | The app is small, no state library needed |

Folder guide: [../docs/SYSTEM.md](../docs/SYSTEM.md).
