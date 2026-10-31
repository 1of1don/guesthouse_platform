# System document

Explains every part of the code, how a request travels through it, and how to change things safely. Written for someone new to the code base.

## 1. The big picture

```
Customer phone                 Staff browser
  mobile/ (Expo)                 web/ (React)
     |                               |
     | Firebase SDK                  | HTTPS + login token
     |                               v
     |                          backend/ (Express)
     |                               |
     |                               | Firebase Admin SDK
     v                               v
  Firebase Authentication  <-->  Cloud Firestore (shared database)
```

- The **mobile app never calls the backend**. Customers only need to read guesthouses and write their own favourites and ratings. Firestore security rules (`firestore.rules`) already protect that, so a server in the middle would add code and no safety.
- The **web portal calls only the backend** for anything that changes data. Staff actions need checks that rules cannot express well (roles, creating logins, fixing totals).
- **Firestore is the shared back end.** Whatever the backend saves, the phone shows.

## 2. Repository map

```
mobile/         customer app
backend/        admin API
docs/           these documents
prototype/      HTML design prototype
firestore.rules database security rules
```

## 3. Mobile app (`mobile/src`)

### Screens (`src/app`, one file = one screen)

| File | Screen | What it does |
|---|---|---|
| `_layout.tsx` | Root | Wraps the app in SettingsProvider and AuthProvider, sets up screen navigation |
| `(tabs)/_layout.tsx` | Tab bar | The Explore, Saved, Profile tabs and their icons |
| `(tabs)/index.tsx` | Explore | Loads guesthouses, search box, sort chips, list, loading/error/empty states |
| `(tabs)/saved.tsx` | Saved | Favourites list. Asks guests to log in |
| `(tabs)/profile.tsx` | Profile | Account info, log in/out, link to Settings |
| `guesthouse/[id].tsx` | Details | Gallery, info, map link, favourite, rating form, reviews. `[id]` is the guesthouse id |
| `auth/login.tsx`, `auth/register.tsx` | Auth | Log in and sign up forms |
| `settings.tsx` | Settings | Currency picker and "use my location" |

### Logic

| File | Job |
|---|---|
| `firebase.ts` | Connects to Firebase using the `EXPO_PUBLIC_FIREBASE_*` values from `.env` |
| `services/guesthouses.ts` | Every Firestore read/write: list, get, reviews, submit review (transaction), favourites |
| `services/auth.ts` | Sign up, log in, log out, session listener (Firebase Authentication) |
| `context/AuthContext.tsx` | Holds "who is logged in" and their favourites so any screen can read them |
| `context/SettingsContext.tsx` | Currency choice: detected from location, saved on the phone, live rates with a fallback table |
| `utils/search.ts` | Filters by name/city/country and sorts. Default is cheapest first |
| `utils/currency.ts` | Currency list, symbols, country to currency map, price formatting |
| `utils/errors.ts` | Turns Firebase errors into readable messages |
| `types/index.ts` | The shapes of Guesthouse, Review, Customer. Field names must match `docs/DATABASE.md` |
| `theme.ts` | Colours and corner radius used by the screens |

### Components (`src/components`)

| File | Job |
|---|---|
| `GuesthouseCard.tsx` | One guesthouse in a list. Heart button sends guests to log in |
| `RatingStars.tsx` | Shows stars, or lets the user tap to set 1 to 5 |
| `SortBar.tsx` | The four sort chips |

### Rules the mobile code follows
- Screens do not talk to Firestore. They call `services/`.
- Prices are stored in BWP. Conversion happens only when displaying (`formatPrice`). Sorting always uses the BWP value.
- Guests can browse everything. Anything that writes (heart, rate) checks the login first.

## 4. Backend (`backend/server`)

### Layers

```
routes/api/routes.js   ->   functions/*.js   ->   models/*.js   ->   Firestore
 URLs, role check,          business logic,       collection names,
 send JSON                  returns Promises      field lists, cleaning
```

A layer may only call the layer to its right. Routes never touch Firestore. Models never know about HTTP.

### Files

| File | Job |
|---|---|
| `../index.js` | Starts the server |
| `app.js` | Express setup, CORS, JSON parsing, the single error handler |
| `errors.js` | `fail(status, message)` stops a function and sets the reply status |
| `config/firebase.js` | The only file that connects to Firebase |
| `config/roles.js` | Role names and which roles may do what |
| `routes/middleware.js` | `requireRole(...)`: login and role check before a route runs |
| `routes/api/routes.js` | Every endpoint, one line each |
| `functions/auth.js` | `verifyAccount`: checks the token, loads the staff record |
| `functions/guesthouse.js` | list, get, create, update, suspend (`remove`), restore |
| `functions/review.js` | list reviews, suspend or restore a review and fix the totals |
| `functions/admin.js` | list, create, suspend, restore staff |
| `functions/stats.js` | Dashboard numbers. `compute()` is a pure function |
| `models/guesthouse.js` | Field lists, `clean()` and `requireFields()` |
| `models/review.js`, `models/admin.js` | Collection references |
| `models/plain.js` | Firestore document to plain JSON (adds `id`, timestamps to text) |
| `../scripts/seed.js` | Sample data |
| `../scripts/createSuperadmin.js` | First super admin |
| `../test/` | Tests and the Firebase fake |

### Life of one request: `POST /api/guesthouses`
1. `app.js` applies CORS and parses the JSON body.
2. `routes.js` matches the URL and runs `requireRole('superadmin', 'admin')`.
3. `middleware.js` calls `auth.verifyAccount`: reads the `Authorization: Bearer <token>` header, asks Firebase to verify it, loads `admins/{uid}`. No token is a 401. Not staff, or a role that is not allowed, is a 403.
4. `routes.js` calls `guesthouse.create(req.body, req.staff.uid)`.
5. `functions/guesthouse.js` calls `clean()` (drops unknown fields, fixes types), `requireFields()`, then writes the document with zero ratings, `createdBy` and `createdAt`.
6. The result goes back as `{ code: 201, success: true, data }`. Any error goes to the handler in `app.js` as `{ code, success: false, message }`.

## 5. Data

Collections, fields and the entity diagram: [DATABASE.md](DATABASE.md) and [UML.md](UML.md).

Rating totals (`ratingSum`, `ratingCount`, `averageRating`) live on the guesthouse so lists can sort by rating without reading every review. They change in exactly two places, both inside a transaction: `submitReview` in the mobile app, and `review.js` in the backend (suspend and restore).

## 6. How to change things

### Add a field to guesthouses (example: `checkInTime`)
1. `backend/server/models/guesthouse.js`: add `'checkInTime'` to `TEXT` (and to `REQUIRED` if mandatory).
2. `mobile/src/types/index.ts`: add it to `Guesthouse`.
3. `mobile/src/services/guesthouses.ts`: add one line in `toGuesthouse`.
4. Show it in `mobile/src/app/guesthouse/[id].tsx`.
5. Add it to the web form, `docs/DATABASE.md`, and `backend/scripts/sampleData.js` if useful.

### Add an endpoint
1. Write the logic as a function in `backend/server/functions/`.
2. Add one line in `routes.js`: `router.get('/path', requireRole(...roles.X), handle((req) => yourFunction(...)))`.
3. Add a test in `backend/test/api.test.js` and a row in `docs/WEB_INTEGRATION.md`.

### Change who may do what
Edit the lists in `backend/server/config/roles.js`. Nothing else changes.

### Add a staff role
1. Add the name to `roles.js` and to `ROLES`.
2. Add it to whichever permission lists should include it.
3. Add it to the role table in the web integration guide.

### Add a currency
Add it to `CURRENCIES`, `SYMBOLS` and `FALLBACK_RATES` in `mobile/src/utils/currency.ts`. Optionally map countries in `COUNTRY_CURRENCY`.

## 7. Design principles used

| Principle | Where it shows |
|---|---|
| KISS | Plain functions, no framework beyond Express, no state library |
| YAGNI | No image upload endpoint, no role editing endpoint, no caching, no rate limiting |
| Single responsibility | One file per topic. Routes route, functions decide, models describe data |
| Open for extension | New endpoint = one route line + one function. New permission = edit a list |
| Dependency inversion | Only `config/firebase.js` knows about Firebase. Tests swap it for a fake |

## 8. Known limits

- Rating totals can be changed by any signed-in customer who edits the three fields directly, because Firestore rules cannot check that a total matches the reviews. Safe fix: a Cloud Function that recalculates totals. Not done to keep the project simple.
- Search runs on the phone after loading all guesthouses. Fine for hundreds of listings, not for tens of thousands.
- Nothing is hard-deleted any more. A suspended guesthouse keeps its favourites, so they come back when it is restored.
- The mobile app hides suspended items by filtering after it loads them. The Firestore rules still let anyone read the documents, so this is about what the app shows, not secrecy.
- The web portal in the other repo still deletes guesthouses straight from Firestore. It needs the same suspend change.
- The backend has no rate limiting.
- Tests use an in-memory fake, not real Firebase. A real Firebase smoke test is manual (`npm run seed`, then call the API).
- The mobile `.env` values are bundled into the app. They identify the project and are not secrets, so the security rules are what protect the data.
