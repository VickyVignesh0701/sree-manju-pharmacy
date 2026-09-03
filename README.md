# Sree Manju Pharmacy — Management System

A pharmacy management system: inventory with batch/FEFO tracking, billing (POS),
dealer purchase orders, patient records, staff accounts, and an audit log.
React/Vite frontend, PHP API backend, MySQL database.

## Stack

- **Frontend:** React + Vite (`src/`)
- **Backend:** Plain PHP, no framework (`api/`)
- **Database:** MySQL / MariaDB (`database/`)

## Prerequisites

- Node.js 18+
- PHP 8.1+ with the `pdo_mysql` extension
- MySQL 8+ or MariaDB 10.6+
- Apache with `mod_rewrite` (or an equivalent rewrite setup - the routing rules live in `.htaccess`)

## First-time setup

### 1. Database

Create a database, then import the base schema followed by every file in
`database/migrations/`, in filename order:

```bash
mysql -u youruser -p -e "CREATE DATABASE sree_manju_pharmacy CHARACTER SET utf8mb4"
mysql -u youruser -p sree_manju_pharmacy < database/sree_manju_pharmacy.sql
for f in database/migrations/*.sql; do
  mysql -u youruser -p sree_manju_pharmacy < "$f"
done
```

All migrations use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`, so re-running
this is safe if you're not sure what's already applied.

### 2. Backend configuration

```bash
cp api/.env.example api/.env
```

Then edit `api/.env`:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` — your database credentials.
- `API_TOKEN_SECRET` — a long random string, used to sign session tokens. Generate one with:
  ```bash
  php -r "echo bin2hex(random_bytes(32));"
  ```
- `TOKEN_TTL` — session lifetime in seconds (default 28800 = 8 hours).
- `APP_URL` — the real URL this app is served from (e.g. `https://your-domain.example`). This
  matters: it's what the CORS check and password-reset links use. Leaving it blank is only safe
  for local development, where it falls back to allowing `localhost`/`127.0.0.1` only.

**Never commit `api/.env`.** It's already covered by `.gitignore`, and `.htaccess` blocks it from
being served directly even if it ends up in the web root.

### 3. Frontend

```bash
npm install
npm run dev
```

The dev server proxies `/pharmacy/sree-manju-pharmacy/api/*` requests to a PHP server on
`127.0.0.1:80` (see `vite.config.js`) — point that at wherever Apache/PHP is serving the `api/`
folder locally.

### 4. First run

Open the app in your browser. Since the database has no staff accounts yet, you'll land on the
installer, which walks through pharmacy details and creates the first Owner account for real
(hashed, through the actual backend — not a demo account).

## Building for production

```bash
npm run build
```

Deploy the built `dist/` output together with `api/` and `.htaccess` behind Apache. Make sure:

- `api/.env` is present on the server with real values (never in the repo).
- `APP_URL` in `api/.env` matches the real domain.
- HTTPS is available — `.htaccess` redirects to it automatically outside local dev.
- The database migrations have been applied.

## Project structure

```
src/                  React frontend
  pages/              One file per screen
  context/AppContext.jsx   Shared app state, wraps the API calls
  services/           api.js (generic fetch wrapper), auth.js, pharmacyApi.js
api/                  PHP backend, one file per resource area
  index.php           Router
  config.php          DB connection, CORS, env loading
  auth.php            Login, registration, password reset, activity log
database/
  sree_manju_pharmacy.sql   Base schema
  migrations/               Incremental changes, run in filename order
```

## Backups

See [`BACKUP.md`](./BACKUP.md) for the database backup and restore procedure.

## Testing

See [`TESTING.md`](./TESTING.md) — includes an honest note on what's actually been verified to
run versus what's written but untested in this environment.

## Security

This project has been through several rounds of security hardening — real backend
authentication with hashed passwords, an HttpOnly session cookie, login rate limiting, and a
token-based password reset flow, among other fixes. See [`SECURITY_AUDIT.md`](./SECURITY_AUDIT.md)
for the original findings and an honest, itemized account of what's fixed and what's still open —
in particular, password-reset **emails aren't actually sent yet** (the link is logged server-side
for now), and there's no automated test suite.

## SMS / WhatsApp receipts (optional)

Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_SMS_FROM` (and `TWILIO_WHATSAPP_FROM`
if you also want WhatsApp) in `api/.env` to enable receipt texts after checkout. Leave them blank
to disable the feature entirely - sales complete normally either way, since sending a receipt is
best-effort and can never fail or block a sale.

**This was written without a Twilio account or outbound network access to test against, and has
not been verified to actually work.** Before relying on it, send yourself a test message: as an
Owner/Co-owner, `POST /api/sms-test` with `{"phone": "+91...", "whatsapp": false}`. If nothing
arrives, check the PHP error log — Twilio's response is logged there on any failure.

## Known limitations

- Draft/pending bills (`CartList.jsx`) are stored locally in the browser, not synced to the
  server — this is intentional, since an in-progress sale isn't committed business data yet.
- Purchase-order and receipt-verification workflows live on each dealer's own page
  (`/dealers/:id`), not as a standalone module.
