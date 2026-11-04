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
| Don (1of1don) | 24019363 |
| Victor Matenge | 24019722 |
| Susana (Simo061005) | 24019739 |
| Beatrice Sefofu | 18001321 |
| Matlhogonolo Ketshabile | 24019708 |
| Gorata Dube | 24020011 |

## Quick start

1. Copy `web/.env.example` to `web/.env` and `mobile/.env.example` to `mobile/.env`, and fill them in
   (DOCUMENTATION.md, section 2).
2. Web: `cd web && npm install && npm run dev`, then open http://localhost:3000.
3. Mobile: `cd mobile && npm install && npx expo start`, then scan the QR code with Expo Go.
