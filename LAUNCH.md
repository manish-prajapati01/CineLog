# CineLog release and service setup

## Deploy existing site

The existing production branch is `update`. Keep the Vercel project/domain and Render service.

- Render: root `Server`, build `npm ci --omit=dev`, start `npm start`. `prestart` creates only the new operational indexes. Existing rating/review identity indexes still use the documented migration script; review its dry-run before applying it.
- Required Render variables: existing `MONGO_URL`, `JWT_SECRET`, `TMDB_API_KEY`; `NODE_ENV=production`; `PUBLIC_SITE_URL=https://cinelog-two.vercel.app`; `CLIENT_ORIGIN=https://cinelog-two.vercel.app`. Render proxy hops default to one.
- Vercel: root `Client`, Vite, build `npm run build`, output `dist`. Keep `VITE_API_URL=https://cinelog-p441.onrender.com`. Optional server-only `CINELOG_API_URL` has the same default. Server-rendered title HTML is served by `api/title.js`; its bundle includes `dist/index.html`.
- Deploy backend first, then frontend. Verify with `SMOKE_API_URL` and `SMOKE_SITE_URL` using `node Server/scripts/smoke.js`.
- Confirm `robots.txt` is text, `/sitemap.xml` is XML, a title's initial HTML has its own title/canonical, and a nonexistent title returns 404. Submit the sitemap in Search Console once domain ownership is verified. Rankings cannot be guaranteed by code.
- Roll back by redeploying the last known-good commit. New database fields are additive. Never restore a backup over the live database as a routine rollback.

## Services that need an owner account or configuration

No credentials for these services were present in the original configuration. Never put secret keys in `VITE_*` variables or Git.

1. Email: configure a verified sending domain with Resend, then set `RESEND_API_KEY`, `MAIL_FROM`, and `PUBLIC_SITE_URL` on Render. Before this, recovery/verification explicitly report unavailable. No fake success is shown for a globally unconfigured mail service. Check inbox delivery before announcing password recovery.
2. Film backup: set `OMDB_API_KEY`. The adapter uses stored, exact IMDb identities; it does not guess remakes by title. Review OMDb's commercial terms before monetizing.
3. Series backup: TVmaze needs no public API key. It is enabled by default and includes source and CC BY-SA attribution in fallback title views. Set `TVMAZE_ENABLED=false` if your usage cannot satisfy its terms. Backup details and seasons only work after a title's TMDB/IMDb identity has been saved. Unseen titles and discovery queries are not a full independent catalogue.
4. Audio/subtitle data: set `STREAMING_AVAILABILITY_API_KEY` for Movie of the Night v4. Set `STREAMING_AVAILABILITY_PLATFORM=rapidapi` only for a RapidAPI-issued key. Data is scoped to country and offer type, cached for six hours, and never guessed from story language. Manual entries expire after 30 days. Test real paid-provider responses before declaring full coverage.
5. Sponsorship: admin Profile → Manage sponsor placements. Configure an agreed sponsor label, HTTPS URL, start/end times and enabled state. Home and discovery slots are available. No sponsor is invented; no tracking SDK is loaded; no payment collection or ad-network account is included.
6. Support and policies: set public `VITE_SUPPORT_EMAIL` and review the privacy/terms text for your actual operator, provider arrangements, retention and jurisdiction before commercial launch.
7. Commercial data rights: resolve TMDB and other data-provider commercial terms before ad monetization. Implemented attribution does not itself grant a commercial licence.

## Backups and restoration

`Server/scripts/backup.js` creates AES-256-GCM encrypted, gzipped BSON-preserving logical exports. It excludes transient rate/cache collections. It supports up to 128 MiB of serialized records; use managed snapshots or official MongoDB tools beyond that size. It is a logical export, not a point-in-time snapshot across concurrent writes. Prefer Atlas continuous/snapshot backups for production disaster recovery.

Keep a separately stored random 32-byte hex `BACKUP_ENCRYPTION_KEY`. Losing the key makes backups unrecoverable. Use a backup-only database credential where possible.

```text
node scripts/backup.js backup backup.enc
node scripts/backup.js restore backup.enc --database=cinelog-restore-drill
node scripts/backup.js restore backup.enc --database=cinelog-restore-drill --apply
```

Restore refuses non-restore-prefixed databases and nonempty targets. It authenticates the ciphertext before writing. Verify counts and representative records, recreate indexes, and plan a separate cutover; the restore command never switches production.

The operations workflow checks production hourly. With GitHub Actions secrets `BACKUP_MONGO_URL` and `BACKUP_ENCRYPTION_KEY`, it exports daily at 02:17 UTC and retains encrypted artifacts for seven days. Enable scheduled Actions on the default branch and confirm your GitHub Actions failure notifications. Without those secrets, no backup is taken. A workflow committed only to `update` does not gain a scheduled run until it is on the repository's default branch.

## Validation

`npm test` in Server includes a disposable MongoDB replica-set integration suite. The first run downloads an official MongoDB binary. It does not use the production database. Tests cover reset/verification expiry and reuse, session revocation, ownership, deletion transactions, shared rate limits, sponsorship, provider identity matching, persistent cache, HTML escaping, and encrypted restore/tamper rejection.

Browser QA uses `NODE_ENV=test node scripts/previewFixture.js` and the frontend dev server. Its known fixture login is only valid in the disposable database; never run this fixture as production. Real email delivery, real automatic-language coverage, production backup credentials, alert notifications, Search Console ownership and cross-device accessibility require operational verification with the configured services.
