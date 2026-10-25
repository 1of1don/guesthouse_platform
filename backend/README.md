# Mi Casa Su Casa API (Java / Spring Boot)

Backend for **Mi Casa Su Casa**, the guesthouse discovery platform (web admin portal + mobile app).

Stack: Java 17, Spring Boot 3, Spring Web, Spring Data JPA, Spring Security (JWT), PostgreSQL, Cloudinary.

## Project layout

```
src/main/java/com/guesthub/
  GuesthubApiApplication.java   entry point
  config/                       SecurityConfig (JWT filter, CORS, URL rules) + DataSeeder
  security/                     JwtService (sign/verify) + JwtAuthFilter + AuthUser
  auth/                         signup, login, admin login, forgot/reset password
  guesthouse/                   entity, repository, service, controller (CRUD + search)
  rating/                       one rating per user; cached average on the guesthouse
  favorite/                     save favourites (composite key user_id + guesthouse_id)
  admin/                        Owner-only admin management (Figma page 6)
  stats/                        dashboard cards (total, top city, highest rated, this month)
  mail/                         password-reset emails (logs the link if SMTP not set)
  image/                        Cloudinary uploads (skipped if keys not configured)
  common/                       ApiException + global error handler + health check
src/main/resources/
  application.properties        all settings, overridable from your .env file
```

## Key concepts

- **Auth**: JWT in an httpOnly cookie (or `Authorization: Bearer` header). `/api/auth/admin/login`
  rejects consumer accounts, so only Owner/Admin can enter the portal.
- **Roles**: `@PreAuthorize("hasRole('OWNER')")` on controller classes/methods. Owners cannot be
  deleted (the Figma shows no "Remove" next to the Owner).
- **Tables**: created automatically by JPA (`spring.jpa.hibernate.ddl-auto=update`). The Owner
  account and the 3 demo guesthouses are seeded on startup if missing.
- **Images**: `logo` + `gallery` arrive as multipart files, are pushed to Cloudinary, and only
  the returned URLs are stored in PostgreSQL.
- **Dashboard**: `GET /api/stats/dashboard` returns totalGuesthouses, topCity, highestRated,
  addedThisMonth and the 5 most recent guesthouses.

## Build & run

```bash
# run in dev mode (VS Code: F5 or the Spring Boot Dashboard run button also works)
mvn spring-boot:run

# or build a jar and run it
mvn clean package
java -jar target/micasa-api-1.0.0.jar
```

Server starts on http://localhost:5000. See .env.example for configuration.

## Shared field names (web + mobile must match exactly)

Guesthouse JSON: `id, name, pricePerNight, city, country, description, amenities[], contact,
latitude, longitude, logoUrl, galleryUrls[], averageRating, ratingCount, createdAt, updatedAt`

## Main endpoints

| Method | Path | Who |
|---|---|---|
| POST | /api/auth/signup, /api/auth/login | anyone (mobile) |
| POST | /api/auth/admin/login | Owner/Admin (web portal) |
| GET | /api/auth/me | logged in |
| GET | /api/guesthouses?search=&city=&sort=price\|rating\|newest\|name&order=asc\|desc&page=&size= | public |
| GET | /api/guesthouses/{id} | public (includes latest ratings) |
| POST / PUT / DELETE | /api/guesthouses[/{id}] (multipart: fields + `logo` + up to 5 `gallery`) | Owner/Admin |
| POST | /api/guesthouses/{id}/ratings `{ "stars": 1-5 }` | logged in |
| POST / DELETE | /api/guesthouses/{id}/favorite | logged in |
| GET | /api/favorites | logged in |
| GET / POST / DELETE | /api/admins[/{id}] | Owner only |
| GET | /api/stats/dashboard | Owner/Admin |

Errors always come back as `{ "error": "message" }` with 400/401/403/404/409/413.

## Tests

```bash
mvn test   # rule tests + a full API flow test on an in-memory database (no Postgres needed)
```

## Changelog (fixes in this version)

- Deleting a guesthouse with ratings/favourites no longer crashes (foreign-key error).
- Rating a guesthouse no longer crashes (average/count query fixed).
- Favourites composite key fixed (`FavoriteId` is now a proper `@Embeddable`).
- `GET /api/auth/me` without a token returns 401 instead of 500.
- Removed admins lose access immediately (role re-checked on every request).
- Owner cannot remove themselves; removing an admin cleans up their ratings, favourites and reset tokens.
- Field names aligned with web/mobile: `latitude`, `longitude`, `averageRating`.
- Validation: price > 0, valid map coordinates, max 5 gallery images, JPG/PNG/WEBP only,
  unique guesthouse names (case-insensitive) on create *and* edit.
- "Highest rated" only counts guesthouses that actually have ratings; seed data starts at 0 ratings.
- Clean JSON errors for 401/403, bad JSON, too-large uploads, duplicates and unknown endpoints.
- Search also matches country; LIKE wildcards in search text are escaped; stable paging.
- Startup warnings when JWT_SECRET or OWNER_PASSWORD are still the defaults.
