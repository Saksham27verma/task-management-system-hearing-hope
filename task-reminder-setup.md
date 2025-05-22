# Task Deadline Reminder System Setup

This guide explains how to set up automatic task reminders for the Hearing Hope Task Management System. The reminder system will automatically send email and in-app notifications to users for tasks that are approaching their deadlines.

## How It Works

The Task Reminder System works as follows:

1. A cron job or scheduled task calls the task reminder API endpoint regularly
2. The endpoint checks for any tasks due within the next 24 hours
3. If tasks are found, reminders are sent at specific intervals (24 hours, 6 hours, and 1 hour before deadline) 
4. Users receive both email notifications and in-app notifications for approaching deadlines

## Setting Up Reminder Cron Jobs

### For Linux/Mac:

1. Open your terminal
2. Edit your crontab file:
   ```
   crontab -e
   ```

3. Add the following line to run the reminder check every hour:
   ```
   0 * * * * curl -X GET "https://your-domain.com/api/tasks/upcoming-reminders?apiKey=YOUR_API_KEY" > /path/to/your/project/logs/reminders.log 2>&1
   ```

   Make sure to replace:
   - `https://your-domain.com` with your actual domain
   - `YOUR_API_KEY` with the value from your REMINDER_API_KEY environment variable
   - `/path/to/your/project` with the actual path to your project directory

### For Windows:

1. Open Task Scheduler
2. Create a new Basic Task
3. Name it "TMS Task Reminders"
4. Set the trigger to Daily, and set it to repeat every 1 hour for 24 hours
5. Set the action to Start a Program
6. Program/script: `curl` or `powershell`
7. Add arguments: 
   - For curl: `-X GET "https://your-domain.com/api/tasks/upcoming-reminders?apiKey=YOUR_API_KEY"`
   - For PowerShell: `-Command "Invoke-WebRequest -Uri 'https://your-domain.com/api/tasks/upcoming-reminders?apiKey=YOUR_API_KEY' -Method GET"`

### For Cloud Providers:

#### Vercel Cron Jobs:

If your application is hosted on Vercel, you can use Vercel Cron Jobs:

1. Update the `vercel.json` file with your actual API key:
   ```json
   {
     "crons": [
       {
         "path": "/api/tasks/upcoming-reminders?apiKey=YOUR_REMINDER_API_KEY",
         "schedule": "0 * * * *"
       }
     ]
   }
   ```

   **IMPORTANT:** Replace `YOUR_REMINDER_API_KEY` with the actual value from your environment variables before deploying. Vercel does not support environment variable interpolation in the cron paths.

#### AWS Lambda with EventBridge:

1. Create a Lambda function that calls your API endpoint
2. Set up an EventBridge (CloudWatch Events) rule to trigger the Lambda function hourly

## Environment Variables

Make sure to set the following environment variables:

```
REMINDER_API_KEY=your_secure_random_key_here
```

This key helps secure the reminder endpoint so only authorized cron jobs can trigger it.

## Verifying Setup

After setting up the cron job:

1. Check if reminders are being sent by monitoring the logs
2. You can manually trigger the reminder system for testing:
   ```
   curl -X GET "https://your-domain.com/api/tasks/upcoming-reminders?apiKey=YOUR_API_KEY"
   ```

## Adjusting Reminder Timing

The default reminder times are:
- 24 hours before deadline
- 6 hours before deadline
- 1 hour before deadline

If you need to adjust these intervals, modify the `REMINDER_PERIODS` array in the `src/app/api/tasks/upcoming-reminders/route.ts` file.

## Support

If you need assistance with this setup, please contact your system administrator. 