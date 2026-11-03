# Update notes (1 Nov)

Everything from `main` (Victor's map + suspend, Don's suspend boolean) plus the
fixes below. Gorata's and Simo's work is pulled in by hand because their
branches can't be merged directly.

## What changed

**Fixes**
- **Ratings now show on the dashboard.** The web app was reading a field called
  `rating`, but the mobile app saves `averageRating` / `ratingSum` / `ratingCount`.
  Web now reads those. New guesthouses start with those three set to 0.
- **Dashboard and guesthouse list update live.** They listen to Firestore instead
  of loading once, so new ratings and suspends show without a refresh.
- **Suspend uses the `isSuspended` boolean.** `true` = hidden from the mobile app,
  `false` = live. (The chat had it the other way round, this way matches the name.)
  Suspended counts show on the dashboard.
- If the guesthouses collection is empty, the web no longer shows old cached ones.
- Mobile app type error in the tab bar fixed. `app.json` pointed at two icon files
  that don't exist, which would have broken the APK build.

**From Simo's branch (the Figma "loading states and feedback" design)**
- Toasts (success / error / Undo), loading buttons, confirm modal, skeleton cards,
  "Updating guesthouse database..." overlay when saving.
- Admin Profile page (click your name at the bottom of the sidebar): change name and password.
- Suspend now asks first, then shows a toast with **Undo**, like the design.
  Kept our existing brown colours rather than the plum ones in the Figma so it
  doesn't look half changed.

**From Gorata's branch**
- User Management page, now **Customers & Reviews**. It reads the `customers`
  collection (her version read `users`, which doesn't exist, and the rules blocked it).

**New (Airbnb-style trust & safety)**
- **Suspend a customer**: they can still browse but can't rate or review. Undo toast.
- **Moderate reviews**: hide / restore / delete. Hidden reviews disappear from the
  app and stop counting in the average (totals are fixed in a transaction).
  Filter "Needs a look" shows 1 and 2 star reviews.
- **Reports page**: live / suspended listings, customers, reviews, platform rating,
  rating breakdown, last 6 months, top rated, most reviewed, needs attention, CSV export.
- Firestore rules enforce all of this, so it isn't just hidden in the UI.

## The Firebase issue, and how to fix it

1. **Why Gorata's branch won't merge.** Her branch was made from a fresh copy of the
   repo, so git sees no shared history ("no merge base"). Merging it would also undo
   the map and suspend work. Don't merge it. Copy single files instead:
   ```
   git checkout origin/gorata-dube-final-version -- web/src/pages/UserManagement.tsx
   ```
   (Already done here.)

2. **Deploy the rules. Do this before 3 November.** The dev rules only allow access
   until 3 Nov 2026, after that the web and app stop working. The new rules are
   also needed for the Customers page, suspending and hiding reviews
   (you'll see "Missing or insufficient permissions" without them):
   ```
   cd web
   npx firebase-tools login
   npx firebase-tools deploy --only firestore:rules,storage
   ```

3. **Every admin needs a document at `admins/{their uid}`** with `role` = `owner`
   or `admin`. The uid is in Firebase console > Authentication. If it's missing,
   login says "not registered as an authorized guesthouse admin", and saves fail.

4. **Env files.** Both apps need their own `.env` (copy `.env.example`):
   - `web/.env` uses `VITE_FIREBASE_...`
   - `mobile/.env` uses `EXPO_PUBLIC_FIREBASE_...`
   Same Firebase project for both (`mi-casa-es-su-casa-d4499`). Restart after
   changing: `npm run dev` / `npx expo start -c`.

## Building the APK

The Android SDK isn't installed on this laptop, so the APK is built on Expo's
servers (free account):
```
cd mobile
npm install
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile apk
```
It gives a link to download the `.apk` when it's done (about 10 to 15 min).
`mobile/.env` must exist first. `.easignore` makes sure it gets uploaded
(normally it's left out because of `.gitignore`).

## Checks

```
cd web
npx tsc --noEmit
node scripts/test-suspension.cjs
npm run build

cd ../mobile
npx tsc --noEmit
```
