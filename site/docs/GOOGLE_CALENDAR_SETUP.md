# Google Calendar + Google Meet Setup

The Beatrox booking system can create Google Calendar events with Google Meet conferences automatically. This requires a one-time OAuth setup.

## 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g. `beatrox-website`).
3. Enable the **Google Calendar API**:
   - APIs & Services → Library → Search "Google Calendar API" → Enable.

## 2. Create OAuth 2.0 Credentials

1. APIs & Services → Credentials → Create Credentials → OAuth client ID.
2. If prompted, configure the consent screen:
   - User Type: **External** (or Internal if you have Google Workspace).
   - App name: `Beatrox Booking`.
   - User support email: your Beatrox Google account.
   - Developer contact: your email.
3. Create OAuth client ID:
   - Application type: **Web application**.
   - Name: `Beatrox Website`.
   - Authorized redirect URIs: `http://localhost` (temporary; only used for token generation).
   - Click Create.
4. Copy the **Client ID** and **Client Secret**.

## 3. Generate a Refresh Token

Use a temporary OAuth flow to get a refresh token for the Google account that will own the calendar events.

### Option A: Use Google's OAuth Playground (quickest)

1. Open [Google OAuth2 Playground](https://developers.google.com/oauthplayground).
2. Click the gear icon and check **Use your own OAuth credentials**.
3. Enter your Client ID and Client Secret.
4. In the left panel, select scope `https://www.googleapis.com/auth/calendar.events`.
5. Click **Authorize APIs** and sign in with the Beatrox Google account.
6. Click **Exchange authorization code for tokens**.
7. Copy the **Refresh token**.

### Option B: Local Node script

```bash
npx google-auth-cli --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET --scope https://www.googleapis.com/auth/calendar.events
```

Or write a small script using the `googleapis` package to perform the OAuth flow with `http://localhost` redirect.

## 4. Configure Environment Variables

Add these to your Vercel project environment variables (and `site/.env` for local development):

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REFRESH_TOKEN=your-refresh-token
GOOGLE_CALENDAR_ID=primary
```

`GOOGLE_CALENDAR_ID` is optional and defaults to `primary` (the signed-in account's primary calendar). You can also use a specific calendar ID.

## 5. Test

1. Create at least one enabled `consultation-type` and at least one `availability-rule` in the Payload admin.
2. Visit `/book` and complete a booking.
3. Check the Google Calendar of the authorized account: an event with a Google Meet link should appear.
4. The `consultations` doc in Payload will show the `googleCalendarEventId` and `googleMeetLink`.

## Troubleshooting

- **Refresh token expires**: OAuth apps in "Testing" mode expire refresh tokens after 7 days. Publish the app status to "In production" in the Google Cloud Console to get long-lived tokens. You may need to verify the app for sensitive scopes.
- **Meet link not created**: Ensure the Google Calendar API is enabled and the refresh token has the `calendar.events` scope.
- **Events created in wrong calendar**: Verify `GOOGLE_CALENDAR_ID` or leave it as `primary`.
- **"This app isn't verified" warning**: This is expected in Testing mode. Click Advanced → Go to beatrox.com (unsafe) during the OAuth flow, then publish the app to remove the warning.
