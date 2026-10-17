# CineLog

A movie and series discovery app built with React, Express and MongoDB.

## Run locally

Use Node.js 22.12 or later. Install dependencies with `npm ci` in both `Client` and `Server`.

Copy `Server/.env.example` to `Server/.env` and fill in the database connection, JWT secret and TMDB API key.

Run `npm run dev` in `Server`, then in `Client` in a second terminal.

Open http://localhost:5173.

## Deployment

Build the frontend from `Client` with `npm run build`. Set `VITE_API_URL` to the backend URL without `/api`.

Run the backend from `Server` with `npm start`. Set `CLIENT_ORIGIN` to the frontend URL and configure the variables listed in `Server/.env.example`.

For an existing database, back it up before using `Server/scripts/migrateMediaReferences.js`. Running the script without arguments prints its migration plan; `--apply` applies it.
