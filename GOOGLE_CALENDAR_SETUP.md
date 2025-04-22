# Google Calendar Integration Setup Guide

This document provides instructions for setting up the Google Calendar integration for the Hearing Hope Task Management System.

## Prerequisites

- A Google Cloud Platform account
- Node.js and npm installed (for local development)
- The Task Management System application codebase

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "NEW PROJECT"
4. Enter a project name (e.g., "Hearing Hope TMS")
5. Click "CREATE"

### 2. Enable the Google Calendar API

1. In your new project, go to "APIs & Services" > "Library"
2. Search for "Google Calendar API"
3. Click on the "Google Calendar API" card
4. Click "ENABLE"

### 3. Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" for User Type and click "CREATE"
3. Fill in the required fields:
   - App name: "Hearing Hope TMS"
   - User support email: Your email address
   - Developer contact information: Your email address
4. Click "SAVE AND CONTINUE"
5. Add scopes:
   - Click "ADD OR REMOVE SCOPES"
   - Search for and select:
     - `.../auth/calendar` (See, edit, share, and permanently delete all the calendars)
     - `.../auth/calendar.events` (View and edit events on all your calendars)
   - Click "UPDATE"
6. Click "SAVE AND CONTINUE"
7. Add test users (your email) and click "SAVE AND CONTINUE"
8. Review your settings and click "BACK TO DASHBOARD"

### 4. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "CREATE CREDENTIALS" > "OAuth client ID"
3. For Application type, select "Web application"
4. Give your client a name (e.g., "Hearing Hope TMS Web Client")
5. Add Authorized JavaScript Origins:
   - For local development: `http://localhost:3000`
   - For production: Your application domain (e.g., `https://hearing-hope-tms.vercel.app`)
6. Add Authorized Redirect URIs:
   - For local development: `http://localhost:3000/api/google/callback`
   - For production: `https://your-production-domain.com/api/google/callback`
7. Click "CREATE"
8. Copy your Client ID and Client Secret

### 5. Configure Environment Variables

1. Add the following variables to your `.env.local` file:

```
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

2. If you're deploying to production, add these variables to your hosting provider's environment variable settings.

### 6. Test the Integration

1. Start your application (locally or on your hosting provider)
2. Log in to the application
3. Navigate to the Calendar page
4. Click the "Connect Google Calendar" button
5. Follow the Google OAuth flow to grant permissions
6. After successful connection, you should be redirected back to the Calendar page with "Connected" status
7. Test syncing tasks by clicking the "Sync Now" button

## Troubleshooting

### Common Issues

1. **"Error: redirect_uri_mismatch"**: Ensure the redirect URI in your Google Cloud Console matches exactly with your application's callback URL.

2. **"This app isn't verified"**: When testing, you can proceed by clicking "Advanced" and then "Go to [App Name] (unsafe)".

3. **"Error: invalid_grant"**: This can occur if you're using an expired authorization code or if the user has revoked access. Try the connection flow again.

4. **Missing Refresh Token**: Ensure you have `prompt=consent` in the authorization URL to force the consent screen and receive a refresh token.

## Production Considerations

- For production deployment, you'll need to verify your OAuth app with Google if you plan to make it available to more than 100 users.
- Consider implementing token refresh logic to handle expired access tokens.
- Add proper error handling and user feedback in the UI for connection issues.
- Implement background sync functionality based on user preferences.

## Additional Resources

- [Google Calendar API Documentation](https://developers.google.com/calendar/api/guides/overview)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google API Node.js Client](https://github.com/googleapis/google-api-nodejs-client) 