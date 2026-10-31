# Web portal integration guide

How the separate React web app connects to the backend and the shared database.

## 1. How the web app fits

```
React web app --(1) log in--> Firebase Authentication
      |  <--(2) ID token--------'
      |
      '--(3) HTTPS + "Authorization: Bearer <token>"--> backend /api --> Firestore
      |
      '--(4) upload images--> Firebase Storage  (URLs are then saved through the API)
```

Rules for the web team:
- Log in with the Firebase Authentication **client** SDK. Send the ID token to the API.
- **Write only through the API.** Do not write to Firestore directly: security rules block it, and it would skip validation.
- Reading guesthouses directly from Firestore is allowed (public), or use `GET /api/guesthouses`.

## 2. Setup

1. Use the same Firebase project as the mobile app. Register the web app config in the web project's `.env`:
```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_APP_ID=...
VITE_API_URL=http://localhost:4000/api
```
2. In `backend/.env`, add the web app's address to `ALLOWED_ORIGINS` (for example `http://localhost:5173`).
3. The first super admin comes from `npm run create-superadmin` in `backend/`. Everyone else is created from the portal.

## 3. Login flow (TypeScript)

```ts
import { signInWithEmailAndPassword, getAuth } from 'firebase/auth';

const API = import.meta.env.VITE_API_URL;

// Calls the API with the current user's token. Throws the API's message on failure.
export async function api<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = await getAuth().currentUser?.getIdToken();
  const res = await fetch(API + path, {
    method: options.method ?? 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.message);
  return json.data as T;
}

// 1) Firebase login  2) ask the API who this is. A 403 means "logged in but not staff".
export async function login(email: string, password: string) {
  await signInWithEmailAndPassword(getAuth(), email, password);
  return api<{ uid: string; name: string; email: string; role: string }>('/auth/verify', { method: 'POST' });
}
```
Keep the returned `role` in app state and use it to hide menu items. The server enforces roles regardless, so hiding is for convenience only.

## 4. Roles

| Action | superadmin | admin | moderator |
|---|---|---|---|
| Dashboard | yes | yes | yes |
| Add, edit, suspend and restore guesthouses | yes | yes | no |
| List, suspend and restore reviews | yes | yes | yes |
| List, add, suspend and restore staff | yes | no | no |

Change this in `backend/server/config/roles.js`.

## 5. Replies and errors

Success: `{ "code": 200, "success": true, "data": ... }`
Error: `{ "code": 400, "success": false, "message": "Missing required fields: name, city" }`

| Code | Meaning |
|---|---|
| 400 | Invalid input. `message` says which field |
| 401 | No token, or token invalid or expired. Log in again |
| 403 | Logged in, but not staff, suspended, or role not allowed |
| 404 | Guesthouse, review or staff member not found |
| 409 | Email already used (create staff) |
| 500 | Server error |

## 6. Endpoints

Base URL: `VITE_API_URL`. "Public" needs no token.

| Method and path | Who | Body | Returns |
|---|---|---|---|
| `GET /health` | public | none | `{ status: "ok" }` |
| `POST /auth/verify` | any staff | none | `{ uid, name, email, role }` |
| `GET /guesthouses` | public | none | array of guesthouses |
| `GET /guesthouses/:id` | public | none | one guesthouse |
| `POST /guesthouses` | admin, superadmin | guesthouse fields | created guesthouse (201) |
| `PUT /guesthouses/:id` | admin, superadmin | any guesthouse fields | updated guesthouse |
| `GET /guesthouses/suspended` | admin, superadmin | none | array of suspended guesthouses |
| `DELETE /guesthouses/:id` | admin, superadmin | none | `{ id }`. Suspends, does not delete |
| `POST /guesthouses/:id/restore` | admin, superadmin | none | the restored guesthouse |
| `GET /dashboard` | any staff | none | statistics |
| `GET /reviews?guesthouseId=` | any staff | none | up to 100 reviews, newest first |
| `DELETE /reviews/:id` | any staff | none | `{ id }`. Suspends, totals are corrected |
| `POST /reviews/:id/restore` | any staff | none | `{ id }` |
| `GET /admins` | superadmin | none | array of staff |
| `POST /admins` | superadmin | `{ name, email, password, role }` | `{ id, name, email, role }` (201) |
| `DELETE /admins/:uid` | superadmin | none | `{ id }`. Suspends the staff member and disables their login |
| `POST /admins/:uid/restore` | superadmin | none | `{ id }` |

### Guesthouse fields (create and update)

| Field | Type | Required on create | Notes |
|---|---|---|---|
| `name` | text | yes | |
| `description` | text | yes | |
| `city` | text | yes | The dashboard groups by city. Keep spelling consistent |
| `country` | text | yes | |
| `contactDetails` | text | yes | Phone number |
| `pricePerNight` | number | yes | In BWP. Not negative |
| `latitude` | number | yes | -90 to 90 |
| `longitude` | number | yes | -180 to 180 |
| `amenities` | list of text, or comma separated text | no | `["Wifi","Pool"]` or `"Wifi, Pool"` |
| `logoUrl` | text | no | Image URL |
| `galleryUrls` | list of text | no | Image URLs |

Any other field in the request is ignored. In particular `ratingSum`, `ratingCount` and `averageRating` cannot be set through the API, and `createdBy` and `createdAt` are set by the server.

Example:
```
POST /api/guesthouses
{ "name": "Riverside Guesthouse", "description": "Garden views.", "city": "Gaborone",
  "country": "Botswana", "contactDetails": "+267 71 234 567", "pricePerNight": 650,
  "latitude": -24.6282, "longitude": 25.9231, "amenities": "Wifi, Parking" }
```

### Dashboard reply
```
{ "totalGuesthouses": 14,
  "topCity": { "city": "Gaborone", "count": 3 },
  "highestRated": { "id": "savanna-sunset-lodge", "name": "Savanna Sunset Lodge", "averageRating": 4.75, "ratingCount": 4 },
  "addedThisMonth": 5,
  "averagePriceByCity": { "Gaborone": 817, "Maun": 685 } }
```
`topCity` and `highestRated` are `null` when there is no data. `highestRated` ignores guesthouses with no ratings.

## 7. Images

The API stores image URLs only. Suggested flow for the add/edit form:
1. `POST /guesthouses` with the text fields. The reply contains the new `id`.
2. Upload the logo and gallery files to Firebase Storage (for example under `guesthouses/{id}/`) with the Firebase client SDK.
3. Read the download URLs, then `PUT /guesthouses/:id` with `logoUrl` and `galleryUrls`.

Storage security rules are the web team's decision. A minimum: public read, write only when signed in. That allows any signed-in customer to upload, so tighten it before release.

## 8. Wiring checklist

- [ ] Same Firebase project as mobile
- [ ] Email/Password sign-in enabled
- [ ] `firestore.rules` published
- [ ] `backend/.env` filled, first super admin created
- [ ] Web origin in `ALLOWED_ORIGINS`
- [ ] Login calls `/auth/verify` and rejects non-staff
- [ ] Every write goes through the API
- [ ] Field names exactly as in section 6
- [ ] Add/Edit form sends `latitude` and `longitude` as numbers
