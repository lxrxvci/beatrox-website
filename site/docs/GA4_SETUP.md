# GA4 Setup — Dashboard Traffic Analytics

The admin dashboard (`/admin`) shows traffic stats (sessions, users, pageviews,
top pages, top sources, 30-day trend) pulled from the Google Analytics 4
property that the public site already reports to. The integration is
read-only and uses a Google service account.

## One-time setup

1. **Find the GA4 property ID** — Google Analytics → Admin → Property Settings
   → *Property ID* (a number, e.g. `412345678`). This is the property whose
   measurement ID matches `NEXT_PUBLIC_GA_MEASUREMENT_ID`.

2. **Create a service account** — Google Cloud Console (same project used for
   the Calendar OAuth credentials is fine):
   - APIs & Services → Library → enable **Google Analytics Data API (GA4)**.
   - APIs & Services → Credentials → Create Credentials → Service Account.
   - Open the service account → Keys → Add Key → JSON. Download the file.

3. **Grant the service account read access to GA4** — Google Analytics →
   Admin → Property Access Management → add the service account email
   (`...@....iam.gserviceaccount.com`) with the **Viewer** role.

4. **Set environment variables** (local `.env` and Vercel):

   ```bash
   GA4_PROPERTY_ID=412345678
   GA4_CLIENT_EMAIL=beatrox-analytics@....iam.gserviceaccount.com
   GA4_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

   `GA4_PRIVATE_KEY` comes from the downloaded JSON (`private_key` field).
   Keep the `\n` escapes inside quotes — the code converts them to real
   newlines. On Vercel, paste the whole key including the BEGIN/END lines.

## Behavior

- Data is cached for 1 hour (`unstable_cache`) so the dashboard never blocks
  on Google.
- If any of the three env vars is missing, or the API call fails, the
  dashboard renders a "GA4 is not connected" placeholder card instead of
  erroring — nothing else is affected.

## Code

- `site/lib/analytics/ga4.ts` — client + report queries (`getGa4Dashboard`).
- `site/components/payload/dashboard/DashboardView.tsx` — renders the card.
