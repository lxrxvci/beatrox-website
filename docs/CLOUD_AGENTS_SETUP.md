# Cloud Agents Setup

This guide configures Cursor Cloud Agents for the BEATROX.COM project.

## Install & Start Scripts

The project uses `.cursor/environment.json` for runtime configuration:

- **Install**: `cd site && npm install` — installs dependencies in the `site/` Next.js + Payload CMS app
- **Terminals**: Starts the dev server (`npm run dev`) so the agent can work with a running app

**If configuring via the Cursor UI** (Cloud Agents → Runtime Configuration):

- **Install Script**: `cd site && npm install`
- **Start Script**: `cd site && npm run dev`
- **Default Terminals**: Add a terminal with command `cd site && npm run dev` (optional; start script may suffice)

**If using the committed config**: `.cursor/environment.json` is already set up.

## Secrets to Add

Add these in **Cursor → Cloud Agents → Secrets** at [cursor.com/dashboard](https://cursor.com/dashboard?tab=cloud-agents):

| Secret Name       | Required | Description |
|-------------------|----------|-------------|
| `PAYLOAD_SECRET`  | Yes      | Long random string for Payload CMS session encryption (e.g. 32+ chars) |
| `DATABASE_URI`    | No       | SQLite path; defaults to `file:./.cms-data/payload.db` in `site/` |
| `CMS_SEED_EMAIL`  | No       | Admin email for CMS seed scripts |
| `CMS_SEED_PASSWORD` | No    | Admin password for CMS seed scripts |
| `YOUTUBE_OAUTH_CLIENT_PATH` | No | Path to YouTube OAuth client JSON (if using YouTube sync) |
| `YOUTUBE_OAUTH_TOKEN_PATH`  | No | Path to YouTube OAuth token JSON |

### Minimum for Cloud Agents

For basic Cloud Agent usage, add at least:

```
PAYLOAD_SECRET=<generate-a-long-random-string>
```

Generate a secret with: `openssl rand -base64 32` or any secure random string.

### Optional: Paste .env

You can paste the contents of `site/.env` (or `.env.local`) into the Secrets UI — Cursor will parse key=value pairs and create secrets for each.

## Verification

1. Open [cursor.com/onboard](https://cursor.com/onboard) and connect GitHub
2. Select this repository
3. Add the required secrets
4. Let Cursor run the install and verify the dev server starts
