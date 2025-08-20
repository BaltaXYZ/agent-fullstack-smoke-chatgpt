# agent-fullstack-smoke-chatgpt

This is a minimal guestbook app built with Node.js, Express and PostgreSQL. It demonstrates a simple full‑stack setup with GitHub, Neon (Postgres) and Koyeb for hosting.

## Features

- Add notes with an optional name. If no name is provided, the note is saved as **Anonym**.
- List the 50 most recent notes on the home page.
- Edit or delete any existing note via the UI.
- REST API with CRUD endpoints.

## Endpoints

- **GET /health** – returns `{ "status": "ok" }` to indicate the server is running.
- **GET /notes** – returns a JSON array of up to the 50 most recent notes. Each note has `id`, `name`, `content` and `created_at`.
- **POST /notes** – accepts JSON `{ "content": "...", "name": "..." }`. `name` is optional; if omitted or empty the note uses `"Anonym"`. Returns the inserted note.
- **PATCH /notes/:id** – accepts JSON with optional `"name"` and/or `"content"` fields. Updates the specified note and returns the updated row.
- **DELETE /notes/:id** – deletes the specified note and returns `{ "deleted": true }` if successful.

## Running locally

1. Install [Node.js](https://nodejs.org/) (v20 or later).
2. Clone this repository and install dependencies:

   ```bash
   git clone https://github.com/BaltaXYZ/agent-fullstack-smoke-chatgpt.git
   cd agent-fullstack-smoke-chatgpt
   npm install
   ```

3. Create a `.env` file with your database connection string (Neon or other Postgres) and optional port:

   ````
   DATABASE_URL=postgresql://user:pass@host:port/dbname?sslmode=require
   PORT=3000
   ```

4. Start the server:

   ```bash
   npm start
   ```

5. Open `http://localhost:3000` in your browser. You should see the guestbook interface.

## Deployment

The app is configured for automated deployment via GitHub Actions and Koyeb. On each push to the `main` branch:

1. GitHub Actions installs dependencies and runs `scripts/migrate.js` to ensure the `notes` table (and `name` column) exists.
2. Koyeb automatically builds the Docker image and deploys the new version.

## Changelog

- **2025‑08‑18:** Initial version with note content.
- **2025‑08‑20:** Added support for storing a `name` with each note, defaulting to *Anonym*. Introduced `PATCH` and `DELETE` endpoints, editing and deleting via the UI, and updated migrations to alter the `notes` table.
