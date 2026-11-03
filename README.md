# Mi Casa Es Su Casa: Guesthouse Discovery Platform

BIUST group project, an Airbnb-style guesthouse **discovery** platform (no booking).

- `web/`: admin portal (React + TypeScript), see [web/README.md](web/README.md)
- `mobile/`: customer app (React Native + Expo), see [mobile/README.md](mobile/README.md)
- [DOCUMENTATION.md](DOCUMENTATION.md): full documentation, API keys, and the checklist against the brief
- [DATABASE.md](DATABASE.md): Firestore collections and the entity diagram
- [CONTRIBUTION_LOG.md](CONTRIBUTION_LOG.md): who did what
- `demos/`: click-through demos with fake data (open in a browser)

## Team

| Name | Student number |
|---|---|
| Anthony Kebadilwe | 24019851|
| Don (1of1don) | (fill in) |
| Victor Matenge | (fill in) |
| Simo (Simo061005) | (fill in) |
| Beatrice Sefofu | (fill in) |
| Matlhogonolo Ketshabile | (fill in) |
| Gorata Dube | (fill in) |

## Quick start

1. Copy `web/.env.example` to `web/.env` and `mobile/.env.example` to `mobile/.env`, and fill them in
   (DOCUMENTATION.md, section 2).
2. Web: `cd web && npm install && npm run dev`, then open http://localhost:3000.
3. Mobile: `cd mobile && npm install && npx expo start`, then scan the QR code with Expo Go.
