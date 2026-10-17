# CineLog project review

Reviewed on 16 October 2026. This is a source and local tooling review, not a certification of every runtime path. No application code was changed. No live database writes, account creation, uploads, or deployment were performed.

## What the project does

CineLog is a movie and TV discovery and community review application. Users browse Indian and international content, filter categories and genres, search movies/TV/people, inspect cast and trailers, explore TV seasons, rate titles from 1–10, write reviews, and maintain a watchlist. A profile aggregates personal activity. A separate admin interface manages manually entered movies, series, artists, and users.

The public catalogue comes from TMDB. Admin-created catalogue records are a separate feature path; public browsing does not query the legacy admin catalogue. Recommendations shown through TMDB are title-related; I did not find a user-personalized recommendation engine.

## Architecture and navigation

| Area | Implementation | Responsibility |
| --- | --- | --- |
| Frontend | React 18, Vite 4, React Router 6 | Browser SPA with lazy-loaded pages |
| State | Redux Toolkit | Persisted user identity and global loading state |
| UI | Custom CSS, Tailwind, Ant Design | Dark charcoal/yellow design; Ant Design admin forms and tables |
| HTTP | Axios | Bearer token injection, 15-second timeout, global 401 logout |
| Backend | Express 4, CommonJS | REST routes, CORS, JSON parsing, error responses |
| Database | MongoDB, Mongoose 7 | Users, ratings, reviews, watchlists, movie references and legacy content |
| Catalogue | TMDB service | Discovery, genres, search, people, credits, videos, seasons |
| Extra metadata | OMDb service | Awards and external ratings, optional fallback |
| Uploads | Multer and Cloudinary | Legacy admin image uploads |
| Hosting configuration | Vercel frontend configuration; Render origin in server | SPA routing and external API setup |

Frontend entry: `Client/src/main.jsx` → Redux/Ant Design providers → `Client/src/App.jsx`.

Routes: `/`, `/movies`, `/tv`, `/movie/:id`, `/tv/:id`, `/person/:id`, `/search`, `/watchlist`, `/profile`, `/login`, `/register`, and `/admin/*`.

Shared UI includes Navbar search suggestions, HeroCarousel, MovieCard, FeaturedSection, CastList, ReviewSection, RatingModal, VideoModal, skeleton loaders, dropdowns, and Footer. The component barrel currently selects `CastListFixed`; other cast-list implementations remain in the repository.

Backend entry: `Server/server.js`. Public API groups are `/api/movies`, `/api/tv`, `/api/person`, and `/api/search`. User features use `/api/auth`, `/api/ratings`, `/api/reviews`, and `/api/watchlist`. Legacy routes remain mounted under `/api/admin/movies`, `/api/admin/series`, `/api/artists`, `/api/images`, and `/api/users`.

Typical catalogue flow: page → frontend service → Express route → TMDB cache/request → JSON response. User actions pass JWT verification and persist through Mongoose. Ratings/reviews also update a lightweight movie reference and its aggregate statistics.

TMDB responses have an in-process one-hour cache and retry transient failures up to three attempts. OMDb responses have a 24-hour cache. Both caches are local to each server process.

## Verification results

| Check | Result |
| --- | --- |
| Frontend `npm run build` | Passed; 3,061 modules transformed |
| Build warnings | Chunk about 822 kB minified; stale Browserslist data; CSS `align-items: start` compatibility warning |
| Frontend `npm run lint` | Failed: 56 errors and 3 warnings |
| Backend `npm run lint` | Failed: ESLint 9 cannot find its expected configuration |
| Backend `node --check` | Passed for all 30 JavaScript files in server entry/config/middleware/models/routes/scripts/services |
| Mongoose collection inspection without DB connection | Confirmed `User` and `users` both resolve to `users`; `Movie` and `movies` both resolve to `movies` |
| Automated test suite | None found; backend test script is a failing placeholder |
| Live/browser tests | Not performed; credentials, hosted environment, actual database indexes, and visual behavior are not verified |

## Priority 1: authentication, permissions, and data integrity

1. **Legacy admin APIs lack server-side admin checks.** `Server/middlewares/authMiddlewares.js` checks only a token, without loading the user, checking active status, or enforcing a role. Movies, series, artist changes, uploads, and user listing rely on it. Once a token passes this verifier, regular users are not distinguished from administrators. The role check in the React admin page does not protect API access. Apply the modern `protect` and `adminOnly` middleware consistently.

2. **Artist creation is unauthenticated.** `Server/routes/artistRoutes.js` exposes `POST /add1` without authentication. The artist model does not require `createdBy`, so lack of an authenticated user does not prevent creation.

3. **JWT configuration is inconsistent.** Modern authentication uses `JWT_SECRET`, then `secret_jwt`, then a hardcoded fallback. Legacy login signs with `secret_jwt`; legacy middleware verifies with `jwt_secret`. The local environment file declares `JWT_SECRET`, but neither legacy spelling. Normal login tokens therefore cannot be verified by the legacy middleware using the declared local configuration. Standardize one required secret and remove the fallback.

4. **Registration logs plaintext passwords.** `Server/routes/authRoutes.js` logs the entire registration request body. Remove that log. `Server/scripts/createAdmin.js` also contains a fixed default admin password, resets existing matching accounts to it, and prints it. Use an explicit setup input instead. The setup script was not executed during this review.

5. **Incompatible models share collections.** `User` uses `role`, `avatar`, validation and password exclusion, while legacy `users` uses `isAdmin`, `profilePic`, and includes passwords by default. Both resolve to `users`. Likewise, lightweight TMDB `Movie` and manually managed `movies` both resolve to `movies`, despite requiring completely different fields. Legacy admin lists can encounter TMDB reference records. Consolidate user schemas and deliberately separate or migrate the two movie collections.

6. **Movie reference uniqueness is wrong across media types.** `Server/models/Movie.js` declares both unique `tmdbId` and unique `(tmdbId, mediaType)`. If the declared indexes exist, a movie and TV show sharing a numeric ID cannot both be stored. The unique single-field index can also conflict with multiple legacy movies lacking `tmdbId`. Actual deployed indexes need inspection before migration.

7. **Legacy populated creator records can expose password hashes.** Movie/series queries populate `createdBy` using the legacy user schema, whose password field is not excluded by default. Explicitly select safe fields and unify the schema.

8. **Legacy registration accepts privileged fields.** `/api/users/register` passes the request body to `User.create`, allowing submission of legacy fields such as `isAdmin`. Current React authorization uses `role`, so this does not by itself demonstrate modern admin access, but the registration path should whitelist allowed inputs.

## Priority 2: broken or inconsistent user flows

| Finding | Evidence and effect |
| --- | --- |
| Artist creation URL mismatch | `Client/src/apis/artists.js` posts `/artists/add`; server implements `/artists/add1`, producing a 404 for the normal form |
| Artist upload runtime error | `ArtistModalForm.jsx` declares `upadtedData` inside an `if` block and reads it outside that block; lint confirms `no-undef` |
| Upload host mismatch | `Client/src/apis/images.js` uses the old Axios wrapper with a relative URL; it ignores `VITE_API_URL`, so a separately hosted frontend sends uploads to its own origin |
| Spoilers are not hidden correctly | Review API stores/returns `containsSpoilers`; `ReviewSection.jsx` checks `rev.isSpoiler` |
| Review author fields do not match | Server populates `userId.name`; component reads `authorName` and `user`, so authors default to “User” and links can target `/profile/undefined` |
| Public profile links have no route | Review links use `/profile/:id`, but App defines only `/profile` |
| Unwired Helpful button | ReviewSection renders a button without a handler despite a backend like endpoint |
| Stale reviews service URL | `getMyReviews` calls `/reviews/user/me`; implemented route is `/reviews/user/my-reviews`. Profile bypasses this service and uses the correct URL |
| Review errors masquerade as success | The personal-review route catches failures and responds with success plus an empty array, hiding an outage as no reviews |
| Watchlist removes too much from UI | Watchlist page filters only `tmdbId` after deletion, so movie and TV items sharing an ID both disappear locally; server correctly distinguishes media type |
| Profile counters become stale | Removing watchlist entries or reviews updates arrays but does not update the separately stored totals |
| Profile join date is misleading | Login/register user responses omit `createdAt`; profile falls back to today, and the stored user is not refreshed through `/auth/me` on startup |
| Previous title rating can persist | Detail pages only set `userRating` when a truthy score is returned, rather than resetting to zero for an unrated next title |
| Rating modal state can be stale | It initializes rating once from props without synchronizing later changes; it also does not send a poster path, leaving profile rating posters missing |
| Admin dashboard has placeholder/incompatible fields | Series total is fixed at zero; movie table expects `title`/`poster` while legacy records use `name`/`posters`; “recent” lists are sliced without an explicit newest-first query |
| OMDb fields are read at the wrong level | Service returns `omdb.imdbRating` and `certification_code`; MovieDetails reads `movie.imdbRating` and `movie.certification`, so enrichment is not consistently displayed |

## Reliability, performance, and maintenance

- Reviews enforce one review per user/title through a read-before-create check without a unique compound index; simultaneous submissions can bypass the check.
- Rating/review writes happen before reference creation and aggregate updates. A later failure can return an error after the primary write succeeded. Define transactional or explicitly best-effort behavior.
- Review popularity sorting uses `likes.length` as a MongoDB sort field; array length is not stored there. Use an aggregate count or maintained like count.
- Watchlist creation and duplicate checking also use separate reads and writes; concurrent requests need an atomic design.
- Review pagination and several IDs/filter inputs lack bounded validation. Validation failures often become HTTP 500 responses instead of clear client errors.
- Each MovieCard requests watchlist status independently for logged-in users, producing many requests and repeated DB reads on catalogue pages.
- Home uses one `Promise.all` for seven sections. A single failure prevents all seven results from being applied. Detail pages likewise depend on several requests even though TMDB detail responses already append much of that information.
- Browser requests time out after 15 seconds while one backend TMDB operation can take roughly 32 seconds with retries, and some operations make several sequential requests.
- Search/category/detail effects generally lack request cancellation or stale-response protection. Search does not reset pagination when only the query changes.
- Regional and TV blacklist filtering occurs after upstream pagination, retaining upstream totals. Pages can be short or empty while reported totals remain high. Broad title patterns such as `star` or `comedy` can exclude unrelated shows.
- Some language/filter parameters are discarded by frontend helper signatures or backend route destructuring, particularly top-rated regional requests.
- The server starts listening even if MongoDB connection fails, and `/api/health` reports liveness without database readiness.
- Uploads have no explicit file-size/type limits or temporary-file cleanup. Cloudinary errors do not clean the uploaded local file.
- OMDb uses HTTP rather than HTTPS.
- Modal components lack explicit focus trapping, dialog semantics and Escape handling; visual/accessibility browser checks remain to be done.
- Multiple cast components, duplicate ESLint configs, legacy API helpers and unused starter assets increase maintenance ambiguity.
- `prop-types` is imported directly but is not declared in the frontend package dependencies; the current installation resolves it transitively.
- Backend lint additionally targets a nonexistent `src` directory and its old config references undeclared Next.js/TypeScript plugins.
- Lockfiles are ignored, reducing reproducibility. No README, example environment file, test suite or CI configuration was found in the project inventory.

## Configuration map

Required backend settings: `PORT` as desired, `MONGO_URL` or `MONGO_URI`, `JWT_SECRET`, and `TMDB_API_KEY`. Database name is forced to `movie-review` in `Server/config/dbConfig.js`.

Optional integrations: `OMDB_API_KEY`, `cloudinary_cloud_name`, `cloudinary_api_key`, and `cloudinary_api_secret`. Those optional keys are not declared in the inspected local `.env`; they could still be supplied externally. Secret values were not printed.

Frontend setting: `VITE_API_URL` should be the API origin because the client appends `/api`. Without it, requests use the frontend origin. The Vite development proxy points to port 5001, whereas the server fallback is 5000; an explicit matching `PORT` is needed. Vercel rewrites serve the SPA and do not proxy API requests.

The local `.env` is ignored and not tracked. `Server/server.log` is tracked; its contents were not inspected in this review.

## Suggested repair order

1. Unify JWT verification and user authorization; protect admin APIs and artist creation; remove password logging.
2. Plan collection/schema and index migration against a backed-up database, including safe creator projections.
3. Fix artist creation/upload paths and the runtime variable error.
4. Align review, rating and profile response contracts; correct stale UI state and error handling.
5. Repair lint configuration and establish focused authentication, permissions and data-integrity tests.
6. Reduce redundant catalogue/watchlist requests, handle partial upstream failures, and finish browser/mobile/accessibility checks.
7. Add setup documentation, example environment names, committed dependency lockfiles and CI checks.
