# Web app additions (2 Nov)

What changed in the admin website (`web/`), why, and what you have to set up.
The mobile app changes are listed at the bottom, because some of them need the same setup.

## 1. AI chatbot removed

The answers were poor, so it is gone completely:

- Deleted `src/pages/Assistant.tsx` and the floating chat bubble (`src/components/chat/`).
- Removed the "AI Concierge" link (sidebar), its page title (header) and its route (`App.tsx`).
- `server.ts` no longer talks to Gemini. It only serves the website now.
- Removed the `@google/genai` and `dotenv` packages and `GEMINI_API_KEY` from `.env.example`.
  You can delete `GEMINI_API_KEY` from your own `web/.env` too.

## 2. Images now go to Cloudinary (fixes the endless loading)

**Why it spun forever:** photos were uploaded to Firebase Storage, which isn't switched on for this
Firebase project (it now needs a paid plan). The upload never finished, so the page waited forever.

**What changed:** `uploadImage()` in `src/services/api.ts` now sends each photo to Cloudinary and saves
the address Cloudinary gives back (`logoUrl`, `galleryUrls`) in Firestore, the same fields as before.
The mobile app needed no change to show them.

**Set it up (5 minutes, free):**

1. Make a free account at cloudinary.com.
2. On the Dashboard, copy your **Cloud name**.
3. Go to **Settings > Upload > Upload presets > Add upload preset**.
   Set **Signing mode** to **Unsigned**, save, and copy the preset name.
4. Add both to `web/.env`:
   ```
   VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
   VITE_CLOUDINARY_UPLOAD_PRESET=your-preset-name
   ```
5. Stop and restart `npm run dev`.

These two values are not secret. Never put the Cloudinary **API secret** in the web app.
Because of that, deleting a guesthouse does not delete its photos. Remove them in the Cloudinary
Media Library if you need to.

## 3. 20-second limit on saving a guesthouse

If adding or editing a guesthouse takes more than 20 seconds, the page stops waiting. It shows
**"Failed to upload guesthouse. Please try again."** as a red toast and above the form.

- Helper: `src/utils/withTimeout.ts` (8 lines). It races the save against a 20-second timer.
- Used in `handleSubmit` in `src/pages/AddEditGuesthouse.tsx`. The limit is `SAVE_TIME_LIMIT_MS`.

## 4. Customer suspension fixed

The admin side (Customers & Reviews > Suspend) already wrote `isSuspended: true` on the customer.
The holes were on the app side and in the rules:

- `firestore.rules`: suspended customers **can't add saved guesthouses** any more. Before, the
  favourites rule had no suspension check at all. They also still can't rate or review.
  They can still browse and remove old saves.
- The mobile app now listens to the customer's record live. Suspending takes effect at once:
  the save button shows "Your account is suspended…" and the review form is replaced by a notice.

**You must deploy the rules, or this only works in the app and not on the server.** This is urgent:
the old development rules stop working on **3 November** (tomorrow).
```
cd web
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules
```
(`storage.rules` is no longer needed now that photos use Cloudinary.)

## 5. Godiraone's / Simo's Figma updates (loading states + admin profile)

Compared with the Figma ("Admin profile page – loading state and feedback"):

| Figma item | Status |
|---|---|
| Loading button ("Adding…" with spinner) | Already in (`LoadingButton`) |
| Success / error / Undo toasts | Already in (`Toast.tsx`) |
| "Updating guesthouse database…" overlay | Already in (Add/Edit page) |
| "Suspend guesthouse?" confirm box | Already in (`ConfirmModal`) |
| Skeleton cards while loading | Already in (`GuesthouseSkeleton`) |
| Profile: **Phone number** field with "Include your country code" hint | **Added** (saved on `admins/{uid}.phone`) |
| Profile: password rule "8 characters, a number and a special character" | **Added** (hint and check) |

We kept the brown colours instead of the Figma's plum, so the site doesn't look half changed.

## 6. Checks I ran

```
cd web
npx tsc --noEmit      # passes
```

## 7. Ideas for later (not done)

- Let admins pick a photo to delete from the gallery on the Edit page.
- Show the customer's suspension date and who suspended them.

---

## Mobile app changes (for reference)

- **Map tab** next to Explore. It uses a free OpenStreetMap map (Leaflet in a WebView), so no Google
  Maps key is needed. Tap a price pin to open the guesthouse.
- **Themes**: the 17 themes from the design, plus "Classic" (the original look, the default).
  Classic, Warm Cream, Sky Blue and Rose Quartz are free; the rest unlock when logged in.
  You pick them in Profile > Settings. The colours live in `mobile/src/theme.ts`, and screens read
  them with `useColors()`.
- **Beatrice's work merged:** profile picture (camera or gallery), username, forgot password, and
  skeleton loading screens.
- **Matlhogonolo's splash screen merged:** the blue "Mi Casa / Es Su Casa" opening screen with
  bouncing dots. It shows for about 2 seconds at start-up (`components/SplashScreen.tsx`).
- **Explore top fixed:** the sort chips were cut off. They're gone, replaced by a **filter button**
  next to the search box. It opens one sheet with sort, price and rating, plus a live "Show 3 stays"
  count. A number on the button shows how many filters are on, and "Clear filters" resets them.
  The header now has the currency and your profile picture, like the design.
- **Settings decluttered:** one Theme row (it opens a separate Themes screen) and a small currency card.
- **Amenity icons** on the guesthouse page (Wi-Fi, parking, pool…), from the design assets.
- Checked all 7 branch zips against GitHub: they match exactly, so nobody's work is missing.
  Gorata, Simo, Victor, Don, Beatrice and Matlhogonolo are all included.
- **Suspension**: see section 4.
- Package name fixed (`stickersmash` → `mi-casa-es-su-casa`). The Expo packages were updated to
  matching versions.

## Demos (no Firebase, nothing to install)

`demos/mobile-demo.html` and `demos/admin-demo.html` run on fake data. Double-click them to open in a
browser. They are for showing the features, not part of the real apps.
- Mobile demo accounts: `demo@micasa.app` / `password123`, and `suspended@micasa.app` / `password123`
  (a suspended customer).
- Admin demo: on the Add Guesthouse page, "Demo controls" lets you pick a slow network to see the
  20-second limit.
