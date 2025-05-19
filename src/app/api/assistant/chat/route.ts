import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth';
import connectToDatabase from '@/lib/db';
import Task from '@/models/Task';
import User from '@/models/User';
import { getUserWorkload, getUpcomingDeadlines } from '@/lib/assistantFunctions';

// Hard-coded responses for common questions
const commonResponses = {
  'task': 'Tasks can be created by going to the Dashboard and clicking on "Create Task". You can set a title, description, assignee, due date, and priority.',
  'dashboard': 'The Dashboard provides an overview of your tasks, upcoming deadlines, and recent activities. You can navigate to it by clicking on the Dashboard icon in the sidebar.',
  'notification': 'Notifications appear in the bell icon at the top right corner. You\'ll be notified about task assignments, updates, and mentions.',
  'calendar': 'The Calendar integration allows you to sync your tasks with Google Calendar. You can set it up in your account settings.',
  'report': 'Reports can be generated from the Reports section. You can create reports based on tasks, users, or time periods.',
  'meeting': 'Meetings can be scheduled from the Meetings tab. You can create a meeting, invite participants, and optionally generate a Google Meet link.',
  'help': 'You can find help documentation by clicking on your profile and selecting "Help". For specific questions, feel free to ask me!',
  'deadline': 'Task deadlines can be set when creating or editing a task. You\'ll receive notifications as deadlines approach.',
  'progress': 'You can update task progress by opening a task and adding a progress update in the provided form.',
  'complete': 'To mark a task as complete, open the task and click the "Complete" button. You can also add final remarks.',
  'default': 'I\'m your Task Management System assistant. I can help you navigate the system, understand features, and provide guidance on tasks and workflow. What would you like to know about?'
};

// A set of possible greetings for variety
const greetings = [
  "Hi",
  "Hello",
  "Good to see you",
  "Welcome back",
  "Greetings"
];

// A set of conversation starters to add after responses
const conversationStarters = [
  "What else would you like to know?",
  "Is there anything specific you need help with today?",
  "Do you have any other questions?",
  "How else can I assist you with your tasks?",
  "Would you like information on any other feature?"
];

export async function POST(request: NextRequest) {
  return withAuth(request, async (user) => {
    try {
      const { message, history } = await request.json();

      if (!message) {
        return NextResponse.json(
          { success: false, message: 'Message is required' },
          { status: 400 }
        );
      }

      // Connect to database
      await connectToDatabase();

      // Get user-specific context
      const userData = await User.findById(user.userId).lean();
      const userName = userData?.name || 'there';
      
      // Get active tasks
      const tasks = await Task.find({
        assignedTo: user.userId,
        status: { $nin: ['COMPLETED'] }
      })
      .sort({ dueDate: 1 })
      .limit(3)
      .lean();
      
      // Get user workload
      const workload = await getUserWorkload(user.userId);
      
      // Format task information
      let tasksInfo = '';
      if (tasks && tasks.length > 0) {
        tasksInfo = `\n\nYou have ${workload.totalActive} active tasks. `;
        if (tasks.length === 1) {
          const dueDate = new Date(tasks[0].dueDate).toLocaleDateString();
          tasksInfo += `Your task "${tasks[0].title}" is due on ${dueDate}.`;
        } else {
          const nextDueDate = new Date(tasks[0].dueDate).toLocaleDateString();
          tasksInfo += `Your next deadline is for "${tasks[0].title}" on ${nextDueDate}.`;
          
          if (workload.totalActive > 3) {
            tasksInfo += ` You have ${workload.totalActive - 3} more tasks not shown here.`;
          }
        }
      }

      // Check if this is a new conversation or a follow-up
      const isNewConversation = !history || history.length === 0;
      
      // Find the most relevant response based on message content
      const lowercaseMessage = message.toLowerCase();
      let response = commonResponses.default;
      
      // Check for specific keywords in the message
      for (const [keyword, resp] of Object.entries(commonResponses)) {
        if (keyword !== 'default' && lowercaseMessage.includes(keyword)) {
          response = resp;
          break;
        }
      }
      
      // Get a random greeting and conversation starter for variety
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      const randomConversationStarter = conversationStarters[Math.floor(Math.random() * conversationStarters.length)];
      
      // Add personalization
      let personalizedResponse = '';
      
      if (isNewConversation) {
        // First message in conversation
        personalizedResponse = `${randomGreeting} ${userName}! ${response}${tasksInfo}`;
      } else {
        // Follow-up in existing conversation
        personalizedResponse = `${response} ${randomConversationStarter}`;
      }

      return NextResponse.json({
        success: true,
        message: personalizedResponse
      });
    } catch (error) {
      console.error('Error in assistant chat:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: 'An error occurred while processing your request' 
        },
        { status: 500 }
      );
    }
  });
} 