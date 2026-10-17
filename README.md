# CineLog

A cinematic discovery app and personal film journal built with React, Express, MongoDB and TMDB.

## Product

- Film and series discovery with URL-persisted genre, language, year, minimum rating and sorting filters.
- Weekly spotlight, regional cinema and title-based recommendations from TMDB.
- Movie/series/person search with pagination and request cancellation.
- Title pages with cast, trailers, seasons and episodes.
- Streaming, rental and purchase providers by region, attributed to JustWatch via TMDB.
- Personal library: want to watch, watching, watched, named collections, private notes, watched dates, search, sorting and JSON export.
- Reviews with spoilers, helpful votes and author/admin deletion; 1-10 ratings.
- Profile editing, recent reviews/ratings and viewing history.
- Protected admin catalogue, series, artists and user listing.

## Local setup

Use Node 22.12+ (Node 24 LTS recommended by the CI configuration). Run `npm ci` separately in Client and Server. Copy `Server/.env.example` to `Server/.env` and supply your own secrets. The frontend uses the Vite proxy on port 5001 locally.

```sh
cd Server
npm ci
npm run dev
```

In another terminal:

```sh
cd Client
npm ci
npm run dev
```

Open the URL printed by Vite. The API runs on port 5001 when the example environment is used. Production frontend builds require `VITE_API_URL` set to the API origin, without `/api`.

```sh
# Client
npm run lint
npm run build
# Server
npm run lint
npm test
```

The API tests start an ephemeral loopback server and replace database methods with isolated fixtures. They never connect to MongoDB. They verify authorization, input validation, filtering and ownership-scoped operations; they do not substitute for database integration/load testing.

## Configuration

| Variable | Purpose |
| --- | --- |
| PORT | API port, 5001 for the supplied Vite proxy |
| MONGO_URL or MONGO_URI | MongoDB connection string |
| JWT_SECRET | Required signing secret; no built-in fallback |
| CLIENT_ORIGIN | Comma-separated production frontend origins |
| NODE_ENV | Set to production on the API host |
| OMDB_API_KEY | Optional supplementary metadata |
| TMDB_API_KEY | Required catalogue and provider data |
| cloudinary_cloud_name / cloudinary_api_key / cloudinary_api_secret | Admin uploads |
| ADMIN_EMAIL / ADMIN_PASSWORD | Explicit admin bootstrap credentials; password at least 12 characters |
| VITE_API_URL | Frontend build-time API origin |

Admin setup: run `node scripts/createAdmin.js` only with explicit bootstrap environment values. It resets the matching account password, so do not run it on every deployment.

## Existing database upgrade

The old app placed two incompatible movie schemas in one `movies` collection. New TMDB references use `media_references`, while manual admin content stays in `movies`. User routes now share one `User` model. Existing `isAdmin` flags are intentionally not promoted to administrator roles automatically.

Back up the database first. Run `node scripts/migrateMediaReferences.js` to inspect the migration plan. With a verified backup, run the same command with `--apply` to copy existing references and remove the obsolete TMDB indexes from the manual catalogue. No source documents are deleted. The script refuses to proceed if reference identities or user reviews have duplicates. Resolve duplicates deliberately before applying. Apply explicit indexes before production traffic because automatic index building is disabled in production.

## Deployment and operational boundaries

Frontend: build `Client` on Vercel with `VITE_API_URL`. Backend: deploy `Server` to a Node host with MongoDB access and the required environment. Configure `CLIENT_ORIGIN` explicitly. `/api/health` checks process liveness; `/api/ready` returns 503 until MongoDB is connected.

This upgrade is implemented and locally tested, but it is not a claim of production certification. Before public launch: complete the backed-up database migration, configure backups/monitoring/error reporting, use HTTPS, and run authenticated end-to-end tests against staging. The login limiter is per-process; put shared rate limiting at the gateway when running multiple API instances. Current JWT sessions use browser localStorage; a secure-cookie/session redesign, email verification and password recovery need a deliberate authentication release. Provider offers may vary by region and time. Collections are private labels, not public social lists. Diary stores one latest viewing date per saved title, not a history of rewatches.

## Design

An editorial cinema direction: charcoal surfaces, ivory typography, brass accents, large film imagery, compact poster shelves, responsive filtering and clear empty/error states. Shared styles live in `Client/src/index.css`. New shared page implementations are `Discover`, `TitleDetails` and `Auth`.

See `UPGRADE_NOTES.md` for research, implementation decisions and verification details. `PROJECT_REVIEW.md` records the pre-upgrade audit and is historical.
