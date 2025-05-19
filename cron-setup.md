# Data Retention Cron Job Setup

This guide will help you set up automated data retention through a cron job to regularly clean up your MongoDB database.

## What This Does

The data retention script:
1. Archives notifications older than 1 month to JSON files
2. Removes these archived notifications from the database
3. Archives completed tasks older than 2 months to JSON files
4. Removes these archived tasks from the database

All archived data is saved to an `archives` folder in your project root.

## Setting Up Cron Jobs

### For Linux/Mac:

1. Open your terminal
2. Edit your crontab file:
   ```
   crontab -e
   ```

3. Add the following line to run the script once a week (Sunday at 2:00 AM):
   ```
   0 2 * * 0 cd /path/to/your/project && npm run data:retention >> /path/to/your/project/logs/retention.log 2>&1
   ```

   Make sure to replace `/path/to/your/project` with the actual path to your project directory.

### For Windows:

1. Open Task Scheduler
2. Create a new Basic Task
3. Name it "TMS Data Retention"
4. Set the trigger to Weekly, on Sunday
5. Set the action to Start a Program
6. Program/script: `npm`
7. Add arguments: `run data:retention`
8. Start in: `C:\path\to\your\project`

## Verifying Setup

After setting up the cron job:

1. Run it manually once to verify it works:
   ```
   npm run data:retention
   ```

2. Check the `archives` directory to confirm files are being created properly.

## Monitoring Storage Usage

You can monitor your MongoDB Atlas storage usage through:
- MongoDB Atlas Dashboard: https://cloud.mongodb.com
- The "Metrics" tab in your cluster view

## Support

If you need assistance with this setup, please contact your system administrator. 