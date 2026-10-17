# CineLog upgrade - 16 October 2026

## Research and direction

The product direction combines personal film tracking with practical discovery. Letterboxd documents watchlists, diary entries, reviews and curated lists; JustWatch emphasizes regional availability and discovery filters. CineLog adopts private collections, a simple watched-date journal, stronger catalogue filters and regional streaming offers. It does not claim to reproduce their social networks or personalized recommendation algorithms.

Sources:
- https://letterboxd.com/welcome/
- https://letterboxd.com/faq/
- https://www.justwatch.com/us
- https://support.justwatch.com/article/what-are-custom-lists

The design is a cohesive editorial cinema interface: charcoal/ivory/lime, Manrope and DM Sans, prominent cinematic imagery, poster shelves, quieter metadata and consistent form controls. It replaces the previous broad CSS overrides, duplicated detail screens and disconnected page treatments.

## Implemented

- Responsive home, movie/series discovery, search, movie/TV details, people, library, profile, login and registration.
- URL-backed filtering and sorting, real TMDB image/data loading, explicit empty/error/loading states, independent home-section failure handling.
- Library watch statuses, private collection names, notes, viewing dates, filtering/search/sort and JSON export; shared Redux library avoids a separate watchlist query for each poster.
- Streaming/rental/purchase offers for India, US, UK, Canada and Australia, with JustWatch attribution and links to provider offer pages.
- Repaired spoiler rendering, author identity, helpful votes, review pagination, rating state and poster storage.
- Reusable movie/series detail page with trailers, cast, seasons, episodes and title-related recommendations.
- Profile editing, recent rating/review activity and watched-title journal.
- Unified JWT validation; required secret; active/admin checks on legacy management routes; disabled old public mass-assignment registration route.
- Registration input validation and per-process attempt limits; removed password logging and fixed bootstrap credentials.
- Separate TMDB reference collection and explicit migration script; safe creator field projections; input-scoped atomic library changes.
- Bounded in-memory uploads with image MIME filtering; HTTPS OMDb requests; explicit production CORS; readiness endpoint and safer global errors.
- Modernized dependency/build stack, removed unused server packages from the browser, switched backend development watching to Node, added lockfiles, CI and environment/setup documentation.
- Keyboard focus trapping, Escape dismissal and focus restoration for trailer/journal dialogs; reduced-motion CSS support.

## Verification

- 15 automated API checks pass with mocked database operations (no live DB writes).
- Both package installations report zero known npm audit vulnerabilities after upgrades.
- Production build passes on Vite 8; both frontend and backend lint checks pass.
- Browser verified: live home catalogue, language/rating filters with URL updates and four matching results, responsive discovery without horizontal overflow, 3 Idiots detail/cast/streaming offers, trailer opening and Escape closing, and signed-out library state.
- Local MongoDB connection succeeded; real public catalogue/provider requests succeeded. Some TMDB requests encountered transient connection resets. Optional OMDb enrichment returned HTTP 401 with the current configuration; its API key needs correction.
- Signed-in browser mutations, external Cloudinary uploads, public hosting and load tests have not been performed.
- Existing-data migration has not been run. Automatic approval review rejected execution of the migration script because its optional apply path writes records and modifies indexes. Source data was not migrated or deleted by this task. A backed-up migration review remains necessary before production rollout.

Preview: [Redesigned home](docs/cinelog-preview.png). Local preview servers were stopped after verification.

## Boundaries

The library journal stores the latest watched date per title; it is not a multi-entry rewatch diary. Collections are private labels. Recommendations come from TMDB title relationships. No fabricated AI personalization, fake social activity or simulated streaming links are presented. Email verification/password recovery, secure-cookie sessions, shared rate limiting, monitoring and backups remain release work described in README. The admin area is retained and repaired, not replaced with a new content business model.

Migration guidance for the upgraded tooling was checked against official documentation:
- https://reactrouter.com/changelog
- https://tailwindcss.com/docs/upgrade-guide
- https://vite.dev/guide/migration
