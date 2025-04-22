# Production Deployment Guide

This guide outlines the steps required to deploy the Hearing Hope Task Management System to production. Follow these instructions to ensure a secure and reliable deployment.

## Prerequisites

- Vercel account for hosting
- MongoDB Atlas account for database
- Sentry account for error monitoring
- Google Cloud account (for Google Calendar integration)
- Access to the project's GitHub repository

## Step 1: Set Up MongoDB Atlas

1. Create a new MongoDB Atlas cluster (or use an existing one)
2. Set up database user credentials with proper access restrictions
3. Configure IP whitelist to allow connections from application servers
4. Create the following indexes for performance:
   ```
   db.users.createIndex({ email: 1 }, { unique: true })
   db.tasks.createIndex({ assignedTo: 1, dueDate: 1 })
   db.tasks.createIndex({ assignedBy: 1 })
   db.notices.createIndex({ createdAt: -1 })
   db.notices.createIndex({ isImportant: 1 })
   db.messages.createIndex({ recipient: 1, isRead: 1 })
   db.messages.createIndex({ sender: 1 })
   db.messages.createIndex({ createdAt: -1 })
   ```

## Step 2: Configure Environment Variables

1. Make a copy of `.env.production` with your actual production values
2. Generate new secure random strings for:
   - JWT_SECRET
   - NEXTAUTH_SECRET
   - SCHEDULER_SECRET_KEY

3. Update MongoDB connection string to point to your production cluster
4. Configure email settings for production notifications
5. Set up Google OAuth credentials for the production domain

## Step 3: Set Up Sentry

1. Create a new Sentry project for the application
2. Get your Sentry DSN and add it to the environment variables
3. Configure Sentry to monitor for performance issues
4. Set up alert rules for critical errors

## Step 4: Deploy to Vercel

1. Connect your GitHub repository to Vercel
2. Configure the production branch (usually `main`)
3. Add all environment variables to Vercel project settings
4. Deploy the application
5. Set up a custom domain and SSL

## Step 5: Configure Scheduled Tasks

For scheduled tasks (like Google Calendar sync), set up a cron job to hit the scheduled endpoints:

```
# For hourly sync
0 * * * * curl -X GET "https://your-production-domain.com/api/google/scheduled-sync?key=YOUR_SCHEDULER_SECRET_KEY&type=hourly"

# For daily sync (midnight)
0 0 * * * curl -X GET "https://your-production-domain.com/api/google/scheduled-sync?key=YOUR_SCHEDULER_SECRET_KEY&type=daily"
```

## Step 6: Initial Setup

1. Run the seed script to create the initial admin user:
   ```
   NODE_ENV=production npm run seed
   ```

2. Login with the default credentials:
   - Email: admin@hearinghope.org
   - Password: admin123

3. **IMPORTANT**: Change the default admin password immediately after first login

## Step 7: Post-Deployment Checks

1. Verify all API endpoints are working
2. Test user roles and permissions
3. Confirm email notifications are being sent
4. Check that Google Calendar integration works
5. Verify error logging is properly capturing issues

## Monitoring and Maintenance

- Set up uptime monitoring for the application
- Configure regular database backups
- Monitor Sentry for errors and performance issues
- Regularly review logs for security concerns

## Security Best Practices

- Rotate JWT secrets periodically
- Keep dependencies updated
- Review user access regularly
- Audit authentication logs for suspicious activity

For detailed deployment instructions, refer to the Next.js and Vercel documentation. 