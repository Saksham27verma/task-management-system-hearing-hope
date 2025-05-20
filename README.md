# Task Management System for Hearing Hope

A comprehensive task management system built for Hearing Hope organization. The application helps team members track, manage, and collaborate on various tasks.

## Features

- **Enhanced Loading Screens**: Beautiful branded loading screens with multiple animation styles
- **Task Management**: Create, assign, track, and complete tasks
- **User Management**: Admin controls for managing user roles and permissions
- **Dashboard**: Role-specific dashboards for admins, managers, and employees
- **Reports**: Generate custom reports and analytics
- **Notifications**: In-app notifications for task updates and assignments
- **Calendar Integration**: Google Calendar sync capability
- **Responsive Design**: Works on desktop and mobile devices

## Technologies

- **Frontend**: Next.js, React, Material-UI
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Authentication**: JWT-based authentication
- **Styling**: Material-UI with custom theming

## Getting Started

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- MongoDB connection

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/task-management-system-hearing-hope.git
   cd task-management-system-hearing-hope
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_GOOGLE_API_KEY=YOUR_API_KEY_HERE
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
   HUGGINGFACE_API_KEY=your_token_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Production Deployment

1. Build the project:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. Run the production server:
   ```bash
   npm start
   # or
   yarn start
   ```

## Screenshots

(Screenshots will be added here)

## License

This project is proprietary and confidential. All rights reserved.

## Acknowledgments

- Hearing Hope organization for the opportunity to develop this system
- Material-UI team for the excellent component library
- Next.js team for the robust framework

## Google Meet Integration

To use the Google Meet integration feature in the meetings module:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Ensure the Google Calendar API is enabled for your project (the same one used for calendar syncing)
3. Use your existing OAuth 2.0 credentials that were set up for calendar integration
4. Make sure your credentials have:
   - The proper scopes including `https://www.googleapis.com/auth/calendar`
   - Your application URL (e.g., `http://localhost:3000`) in Authorized JavaScript origins
   - Your application URL with path (e.g., `http://localhost:3000/dashboard/meetings`) in Authorized redirect URIs
5. Add your existing API key and Client ID to your `.env.local` file:
   ```
   NEXT_PUBLIC_GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
   ```

### Meeting Functionality

- Create Google Meet meetings that automatically appear in your Google Calendar
- The Google Calendar API is used to create events with Google Meet conferencing
- Join and manage meetings directly from the dashboard
- Uses the same Google authentication as the calendar integration 

## AI Assistant

The task management system includes a built-in AI assistant that helps users with various tasks and questions.

### Features

- Provides instant answers to common task management questions
- Shows personalized information based on user's tasks and deadlines
- Offers guidance on how to use system features
- Works entirely offline with no external API dependencies

### Using the Assistant

- Click the AI icon in the bottom right corner of the screen
- Ask questions about tasks, system navigation, or request help
- Get contextual responses based on your current tasks

### Example Questions

- "How do I create a task?"
- "Where can I find my notifications?"
- "How do I update task progress?"
- "What are my upcoming deadlines?"
- "How do I complete a task?" 