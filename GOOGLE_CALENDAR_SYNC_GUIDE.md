# Google Calendar Sync Implementation Guide

This guide explains how the Google Calendar synchronization works in the Task Management System and how to set up the scheduled syncing functionality.

## Sync Types Implemented

The application supports four types of synchronization with Google Calendar:

1. **Real-time Sync**: Tasks are synced immediately when created or updated
2. **Hourly Sync**: Tasks are synced automatically every hour
3. **Daily Sync**: Tasks are synced automatically once a day
4. **Manual Sync**: Tasks are only synced when the user clicks the "Sync Now" button

## How Real-Time Sync Works

Real-time sync is implemented directly in the task creation and update APIs:

- When a task is created, the system checks if the assigned user has Google Calendar connected with "realtime" sync enabled
- If real-time sync is enabled, and the task type is included in the user's sync settings, it's immediately pushed to Google Calendar
- The same process happens when a task is updated

## Setting Up Scheduled Sync

For hourly and daily sync to work, you need to set up a scheduler that calls the scheduled sync API endpoint:

### 1. Set Up a Cron Job or Scheduler

#### Option A: If using a traditional server/VPS

Create a cron job that calls the scheduled sync endpoint:

```bash
# For hourly sync (run every hour)
0 * * * * curl -X GET "https://your-domain.com/api/google/scheduled-sync?key=your-scheduler-secret-key&type=hourly"

# For daily sync (run once a day at midnight)
0 0 * * * curl -X GET "https://your-domain.com/api/google/scheduled-sync?key=your-scheduler-secret-key&type=daily"
```

Replace `your-domain.com` with your actual domain, and `your-scheduler-secret-key` with the value in your `.env.local` file.

#### Option B: If using Vercel or similar serverless hosting

Use a service like [Upstash](https://upstash.com/), [Cron-job.org](https://cron-job.org/), or [GitHub Actions](https://github.com/features/actions) to set up scheduled HTTP requests:

1. Create an account on the service of your choice
2. Set up a cron job that sends GET requests to your API endpoint
3. Configure the job to run at the desired frequency (hourly or daily)

### 2. Configure Environment Variables

Make sure the `SCHEDULER_SECRET_KEY` is set in your environment variables:

```
SCHEDULER_SECRET_KEY=your-secure-random-string
```

This key is used to authenticate the scheduler calling your API.

### 3. Monitor Logs

Check your application logs regularly to ensure the scheduled sync is working properly. Each sync operation logs information about:

- How many users had their tasks synced
- How many tasks were synced successfully
- Any errors that occurred during the sync process

## Troubleshooting Sync Issues

If users are experiencing issues with calendar sync:

1. **Check Connection Status**: Verify that the user's Google Calendar is connected by checking the `GoogleCalendarToken` collection in the database

2. **Verify Sync Settings**: Make sure the user has the appropriate task types enabled for syncing

3. **Check API Permissions**: Ensure the Google Calendar API is still enabled in the Google Cloud Console and the OAuth credentials are valid

4. **Refresh Tokens**: If access tokens have expired, the system should automatically refresh them. If this isn't working, users may need to reconnect their Google Calendar

5. **Check Scheduled Jobs**: If hourly/daily sync isn't working, verify that your cron jobs or scheduled tasks are running properly

## Implementation Details

The Google Calendar sync functionality is implemented in the following files:

- `src/models/GoogleCalendarToken.ts`: Model for storing Google OAuth tokens and sync settings
- `src/services/googleCalendar.ts`: Service for interacting with the Google Calendar API
- `src/app/api/google/auth/route.ts`: API endpoint for initiating OAuth flow
- `src/app/api/google/callback/route.ts`: OAuth callback handler
- `src/app/api/google/tokens/route.ts`: API for managing tokens and sync settings
- `src/app/api/google/sync/route.ts`: API for manual syncing
- `src/app/api/google/scheduled-sync/route.ts`: API for scheduled syncing
- `src/app/api/tasks/route.ts`: Task creation with real-time sync
- `src/app/api/tasks/[id]/route.ts`: Task update with real-time sync

## Security Considerations

- OAuth tokens are stored securely in the database
- The scheduled sync API is protected with a secret key
- Access to sync functionalities is restricted to the task owner only 