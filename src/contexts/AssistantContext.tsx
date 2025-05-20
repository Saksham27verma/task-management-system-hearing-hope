import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { Task, TaskStatus, TaskPriority } from '@/types/Task';
import { useTask } from './TaskContext';
import { useUsers } from './UserContext';
import { useNotifications } from './NotificationContext';
import { NotificationType } from '@/types/Notification';
import { UserRole } from '../types/User';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isUser?: boolean;
}

interface AssistantContextType {
  messages: Message[];
  sendMessage: (content: string) => void;
  isLoading: boolean;
  createTask: (title: string, description: string, assignedTo: string[], dueDate: Date, priority: TaskPriority) => Promise<void>;
  listTasks: (status?: TaskStatus, userId?: string) => void;
  sendReminder: (taskId: string, userId: string) => Promise<void>;
  sendReminders: (taskIds: string[], userId: string) => Promise<string[]>;
  markTaskAsComplete: (taskId: string) => Promise<void>;
  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  openTaskCreationDialog: () => void;
  openNoticeCreationDialog: () => void;
  openMessageSendingDialog: (recipientId?: string) => void;
  resetMessages: () => void;
  getTaskProgressUpdates: (taskIds?: string[], userId?: string) => Promise<void>;
}

const AssistantContext = createContext<AssistantContextType | undefined>(undefined);

export const AssistantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  
  // Dialog control
  const [openCreateTaskDialog, setOpenCreateTaskDialog] = useState(false);
  const [openCreateNoticeDialog, setOpenCreateNoticeDialog] = useState(false);
  const [openSendMessageDialog, setOpenSendMessageDialog] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | undefined>(undefined);

  // Get hooks
  const auth = useAuth();
  const tasksContext = useTask();
  const usersContext = useUsers();
  const notificationsContext = useNotifications();

  // Create refs to avoid unnecessary rerenders
  const contextRef = useRef({
    user: auth.user,
    tasks: tasksContext.tasks,
    addTask: tasksContext.addTask,
    updateTask: tasksContext.updateTask,
    deleteTask: tasksContext.deleteTask,
    users: usersContext.users,
    addNotification: notificationsContext.addNotification,
  });

  // Update refs when dependencies change
  useEffect(() => {
    contextRef.current = {
      user: auth.user,
      tasks: tasksContext.tasks,
      addTask: tasksContext.addTask,
      updateTask: tasksContext.updateTask,
      deleteTask: tasksContext.deleteTask,
      users: usersContext.users,
      addNotification: notificationsContext.addNotification,
    };
    
    setInitialized(true);
  }, [
    auth.user,
    tasksContext.tasks,
    tasksContext.addTask,
    tasksContext.updateTask,
    tasksContext.deleteTask,
    usersContext.users,
    notificationsContext.addNotification,
  ]);

  // Function to process message input and generate response
  const processMessage = async (userMessage: string): Promise<string> => {
    const messageLower = userMessage.toLowerCase();
    const { user, users, tasks } = contextRef.current;
    
    // Check for task details requests
    if (messageLower.includes('task details') || 
        messageLower.includes('task progress details') || 
        messageLower.includes('completion remarks') ||
        messageLower.includes('task remarks') ||
        messageLower.includes('task updates') ||
        messageLower.match(/details (?:of|for) task/i)) {
      
      // Try to find a task ID or task name in the message
      let targetTaskId = null;
      
      // Check for task ID pattern
      const taskIdMatch = messageLower.match(/task[- ](?:id)?[: ]?([a-z0-9-]+)/i);
      if (taskIdMatch && taskIdMatch[1]) {
        targetTaskId = taskIdMatch[1];
      }
      
      // If no ID found, look for task title mentions
      if (!targetTaskId) {
        // Look for task by title
        for (const task of tasks) {
          if (messageLower.includes(task.title.toLowerCase())) {
            targetTaskId = task.id;
            break;
          }
        }
      }
      
      if (targetTaskId) {
        // Validate that the task actually exists
        const taskExists = tasks.some(t => t.id === targetTaskId);
        if (taskExists) {
          // Return a message that instructs the Assistant widget to open the task details dialog
          return `__OPEN_TASK_DETAILS:${targetTaskId}__`;
        } else {
          return `I couldn't find a task with ID "${targetTaskId}". Please check the ID and try again.`;
        }
      } else {
        if (messageLower === "task details" || 
            messageLower === "show task details" || 
            messageLower === "view task details") {
          
          // If no specific task is mentioned, show a list of available tasks
          const availableTasks = tasks.slice(0, 5); // Show first 5 tasks
          
          if (availableTasks.length > 0) {
            let taskListMessage = "Please specify which task you want to see details for. Here are some of your available tasks:\n\n";
            
            availableTasks.forEach((task, index) => {
              taskListMessage += `${index + 1}. **${task.title}** (ID: ${task.id})\n`;
            });
            
            if (tasks.length > 5) {
              taskListMessage += `\n...and ${tasks.length - 5} more tasks.`;
            }
            
            taskListMessage += "\n\nYou can ask for details about a specific task by name or ID.";
            
            return taskListMessage;
          } else {
            return "There are no tasks available in the system yet. Would you like to create a new task?";
          }
        }
        
        return "I couldn't identify which task you're asking about. Please specify the task name or ID more clearly.";
      }
    }
    
    // Simple intent detection
    if (messageLower === 'create a task' || messageLower === 'create task' || messageLower === 'new task' || messageLower === 'add task') {
      setOpenCreateTaskDialog(true);
      return "Opening the task creation dialog...";
    }
    
    if (messageLower === 'create a notice' || messageLower === 'create notice' || messageLower === 'post notice' || messageLower === 'new announcement') {
      setOpenCreateNoticeDialog(true);
      return "Opening the notice creation dialog...";
    }
    
    if (messageLower === 'send a message' || messageLower === 'send message' || messageLower === 'message someone') {
      setOpenSendMessageDialog(true);
      return "Opening the message composer...";
    }
    
    if (messageLower.includes('create task') || messageLower.includes('add task') || messageLower.includes('new task')) {
      return "I can help you create a new task. Would you like to:\n\n1. Use the task creation form (easier)\n2. Enter details here in chat\n\nReply with '1' to open the form or '2' to continue in chat.";
    }
    
    // Handle task progress update requests
    if (messageLower.includes('progress') || 
        messageLower.includes('status update') || 
        messageLower.includes('task update') || 
        messageLower.includes('progress report') ||
        messageLower.includes('task progress') ||
        messageLower.includes('task status') ||
        messageLower === 'show me task progress updates') {
      
      console.log('Processing progress update request:', userMessage);
      
      // Check if asking about a specific user
      let targetUserId = undefined;
      
      // Look for user mentions in the message
      users.forEach(u => {
        if (messageLower.includes(u.username.toLowerCase())) {
          // Only allow admins or managers to view others' tasks
          if (user?.role === 'admin' as UserRole || user?.role === 'manager' as UserRole) {
            targetUserId = u.id;
          }
        }
      });
      
      // If no specific user is mentioned, default to current user
      if (!targetUserId && user) {
        targetUserId = user.id;
      }
      
      // Show a temporary response to indicate we're processing
      const initialResponse = "Generating task progress report...";
      
      // Go ahead and call the task progress update function directly
      // We'll use setTimeout to ensure the UI updates with the "Generating..." message first
      setTimeout(() => {
        getTaskProgressUpdates(undefined, targetUserId)
          .catch(err => console.error('Error generating task progress report:', err));
      }, 100);
      
      // Return the initial response
      return initialResponse;
    }
    
    if (messageLower.includes('list tasks') || messageLower.includes('show tasks') || messageLower.includes('my tasks')) {
      // Determine which tasks to show
      let status: TaskStatus | undefined;
      let targetUser = user?.id;
      
      if (messageLower.includes('pending')) status = 'pending';
      if (messageLower.includes('completed')) status = 'completed';
      if (messageLower.includes('in progress')) status = 'in-progress';
      if (messageLower.includes('overdue')) status = 'overdue';
      
      // Check if asking about another user's tasks
      users.forEach(u => {
        if (messageLower.includes(u.username.toLowerCase())) {
          // Check if current user has permission to view other's tasks
          if (user?.role === 'admin' || user?.role === 'manager') {
            targetUser = u.id;
          }
        }
      });
      
      return await formatTaskList(status, targetUser);
    }
    
    if (messageLower.includes('send reminder') || messageLower.includes('remind') || messageLower.includes('give reminder')) {
      // Extract potential target username from message with more flexible patterns
      const userMatch = messageLower.match(/remind\s+(.+?)(?:\s+about|\s+of|\s+for|$)/i) || 
                       messageLower.match(/send\s+(?:a\s+)?reminder\s+(?:to\s+)?(.+?)(?:\s+about|\s+of|\s+for|$)/i) ||
                       messageLower.match(/(?:send|give)\s+(.+?)\s+(?:a\s+)?reminder/i);
      
      let potentialUsername = '';
      if (userMatch && userMatch[1]) {
        potentialUsername = userMatch[1].trim().toLowerCase();
        
        // More permissive user matching
        const targetUser = users.find(u => 
          u.username.toLowerCase() === potentialUsername ||
          u.username.toLowerCase().includes(potentialUsername) ||
          potentialUsername.includes(u.username.toLowerCase())
        );
        
        if (targetUser) {
          return `I can help you send reminders to ${targetUser.username}. Please select the tasks you'd like to remind them about.`;
        }
      }
      
      // No username match, provide clear instructions
      return "To send a reminder, please specify a user by name. For example, 'Send a reminder to John about his tasks.'";
    }
    
    if (messageLower.includes('send message to') || messageLower.includes('message to')) {
      // Extract potential target username
      const userMatch = messageLower.match(/message\s+to\s+(.+?)(?:\s+about|\s+on|\s+for|$)/i) || 
                       messageLower.match(/send\s+(?:a\s+)?message\s+(?:to\s+)?(.+?)(?:\s+about|\s+on|\s+for|$)/i);
      
      if (userMatch && userMatch[1]) {
        const potentialUsername = userMatch[1].trim().toLowerCase();
        
        // Find the user
        const targetUser = users.find(u => 
          u.username.toLowerCase() === potentialUsername ||
          u.username.toLowerCase().includes(potentialUsername) ||
          potentialUsername.includes(u.username.toLowerCase())
        );
        
        if (targetUser) {
          setSelectedRecipientId(targetUser.id);
          setOpenSendMessageDialog(true);
          return `Opening message composer to send a message to ${targetUser.username}...`;
        }
      }
      
      // No username match, provide clear instructions
      return "To send a message to a specific user, please use their correct username. For example, 'Send a message to John'";
    }
    
    if (messageLower.includes('complete task') || messageLower.includes('mark as completed') || messageLower.includes('finish task')) {
      return "Please provide the task ID that you want to mark as completed.";
    }
    
    if (messageLower.includes('update status') || messageLower.includes('change status')) {
      return "To update a task status, please provide the task ID and the new status (pending, in-progress, completed, overdue).";
    }

    if (messageLower === '1' && messages.length > 0) {
      const prevMessage = messages[messages.length - 1];
      if (prevMessage.role === 'assistant' && 
          prevMessage.content.includes('Reply with \'1\' to open the form')) {
        setOpenCreateTaskDialog(true);
        return "Opening the task creation form...";
      }
    }
    
    if (messageLower === 'how to' || messageLower.includes('how to do')) {
      return "Here's how to use the different features:\n\n" +
        "1. **Creating Tasks** - Type 'create task' and either use the form or follow the chat prompts\n\n" +
        "2. **Creating Notices** - Type 'create notice' to open the notice creation form\n\n" +
        "3. **Sending Messages** - Type 'send message' or 'send message to [username]' to open the message composer\n\n" +
        "4. **Reminders** - Type 'send reminder to [username]' to select tasks and send reminders\n\n" +
        "Would you like to try one of these features now?";
    }
    
    // Default response
    return "Hello! I'm your Hope Task Assistant. I can help you with:\n\n" +
      "• Creating tasks - Just say 'create a task'\n" +
      "• Viewing tasks - Try 'show my pending tasks' or 'show overdue tasks'\n" +
      "• Updating tasks - Say 'mark task as completed' or 'change task status'\n" +
      "• Sending reminders - Ask 'send reminder to [username]'\n" +
      "• Creating notices - Say 'create notice'\n" +
      "• Messaging - Say 'send message to [username]'\n\n" +
      "What would you like to do today?";
  };
  
  // Format task list as a readable string
  const formatTaskList = async (status?: TaskStatus, userId?: string): Promise<string> => {
    const { tasks, users } = contextRef.current;
    let filteredTasks = tasks;
    
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    
    if (userId) {
      filteredTasks = filteredTasks.filter(task => 
        task.assignedTo.includes(userId)
      );
    }
    
    if (filteredTasks.length === 0) {
      return "No tasks found with these criteria.";
    }
    
    let response = `Found ${filteredTasks.length} task(s):\n\n`;
    
    filteredTasks.forEach((task, index) => {
      const assignedUsers = task.assignedTo.map(userId => {
        const user = users.find(u => u.id === userId);
        return user ? user.username : 'Unknown user';
      }).join(', ');
      
      response += `${index + 1}. ID: ${task.id}\n   Title: ${task.title}\n   Status: ${task.status}\n   Due: ${task.dueDate.toLocaleDateString()}\n   Assigned to: ${assignedUsers}\n   Priority: ${task.priority}\n\n`;
    });
    
    return response;
  };

  // Parse user input to create a task
  const parseTaskCreation = (content: string) => {
    const { users } = contextRef.current;
    const lines = content.split('\n');
    const taskDetails: any = {};
    
    lines.forEach(line => {
      const parts = line.split(':').map(part => part.trim());
      if (parts.length >= 2) {
        const key = parts[0].toLowerCase();
        const value = parts.slice(1).join(':').trim();
        
        if (key.includes('title')) taskDetails.title = value;
        else if (key.includes('desc')) taskDetails.description = value;
        else if (key.includes('assign')) {
          const usernames = value.split(',').map(name => name.trim());
          const userIds = usernames.map(username => {
            const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
            return user ? user.id : null;
          }).filter(id => id !== null) as string[];
          taskDetails.assignedTo = userIds;
        }
        else if (key.includes('due')) {
          try {
            taskDetails.dueDate = new Date(value);
          } catch (e) {
            taskDetails.dueDate = new Date();
            taskDetails.dueDate.setDate(taskDetails.dueDate.getDate() + 7); // Default to 1 week
          }
        }
        else if (key.includes('priority')) {
          const priority = value.toLowerCase();
          if (priority.includes('high')) taskDetails.priority = 'high';
          else if (priority.includes('med')) taskDetails.priority = 'medium';
          else taskDetails.priority = 'low';
        }
      }
    });
    
    return taskDetails;
  };

  // Process reminders
  const parseReminder = (content: string) => {
    const { users } = contextRef.current;
    const taskIdMatch = content.match(/task\s+id\s*:\s*([a-zA-Z0-9-]+)/i) || content.match(/id\s*:\s*([a-zA-Z0-9-]+)/i);
    const userMatch = content.match(/user\s*:\s*([a-zA-Z0-9_\s]+)/i) || content.match(/to\s*:\s*([a-zA-Z0-9_\s]+)/i);
    
    const taskId = taskIdMatch ? taskIdMatch[1].trim() : null;
    const username = userMatch ? userMatch[1].trim() : null;
    
    const user = username ? users.find(u => u.username.toLowerCase() === username.toLowerCase()) : null;
    
    return { taskId, userId: user?.id };
  };

  // Send a message to the assistant
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: new Date(),
      isUser: true
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Process previous assistant message to check for expected input
      const prevAssistantMessage = [...messages].reverse().find(msg => msg.role === 'assistant')?.content;
      
      let response = '';
      
      // Check if user message is a confirmation of sending reminders
      if (content.match(/^send reminder(s)? to .+ for \d+ task\(s\)$/i)) {
        response = "Reminders have been sent successfully! The users will be notified about their tasks.";
      }
      // Check for created task confirmation message
      else if (content.match(/^Created new task: .+$/i)) {
        response = "Great! The task has been created successfully. Is there anything else you'd like to do?";
      }
      // Check for created notice confirmation message
      else if (content.match(/^Posted new notice: .+$/i)) {
        response = "The notice has been posted successfully! All users will be notified.";
      }
      // Check for sent message confirmation message
      else if (content.match(/^Sent message to .+: .+$/i)) {
        response = "Your message has been sent successfully!";
      }
      // Check if we're expecting task creation details
      else if (prevAssistantMessage?.includes('create a new task') || prevAssistantMessage?.includes('provide the following details')) {
        const taskDetails = parseTaskCreation(content);
        
        if (taskDetails.title && taskDetails.assignedTo && taskDetails.assignedTo.length > 0) {
          await createTask(
            taskDetails.title,
            taskDetails.description || '',
            taskDetails.assignedTo,
            taskDetails.dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            taskDetails.priority || 'medium'
          );
          response = `Task "${taskDetails.title}" has been created successfully!`;
        } else {
          response = "I couldn't create the task because some required information was missing. Please make sure to include at least a title and assigned users.";
        }
      }
      // Check if we're expecting a reminder request - we now handle this in the UI
      else if (prevAssistantMessage?.includes('send a reminder')) {
        if (content.includes('cancel') || content.includes('nevermind')) {
          response = "No problem, reminder request canceled.";
        } else {
          // This will now be handled by the TaskSelectionDialog component
          const { taskId, userId } = parseReminder(content);
          
          if (taskId && userId) {
            await sendReminder(taskId, userId);
            response = "Reminder sent successfully!";
          } else {
            response = "I couldn't send the reminder because the task ID or user information was missing or invalid.";
          }
        }
      }
      // Check if we're expecting a task completion request
      else if (prevAssistantMessage?.includes('mark as completed')) {
        const taskIdMatch = content.match(/([a-zA-Z0-9-]+)/);
        const taskId = taskIdMatch ? taskIdMatch[0].trim() : null;
        
        if (taskId) {
          await markTaskAsComplete(taskId);
          response = "Task marked as completed!";
        } else {
          response = "I couldn't update the task because the task ID was missing or invalid.";
        }
      }
      // Check if we're expecting a status update request
      else if (prevAssistantMessage?.includes('update a task status')) {
        const taskIdMatch = content.match(/id\s*:\s*([a-zA-Z0-9-]+)/i) || content.match(/([a-zA-Z0-9-]+)/);
        const statusMatch = content.match(/status\s*:\s*([a-zA-Z-]+)/i) || content.match(/to\s+([a-zA-Z-]+)/i);
        
        const taskId = taskIdMatch ? taskIdMatch[1]?.trim() || taskIdMatch[0].trim() : null;
        const statusText = statusMatch ? statusMatch[1].trim().toLowerCase() : null;
        
        let status: TaskStatus | null = null;
        if (statusText?.includes('pend')) status = 'pending';
        else if (statusText?.includes('progress') || statusText?.includes('in-prog')) status = 'in-progress';
        else if (statusText?.includes('complete')) status = 'completed';
        else if (statusText?.includes('over')) status = 'overdue';
        
        if (taskId && status) {
          await updateTaskStatus(taskId, status);
          response = `Task status updated to ${status}!`;
        } else {
          response = "I couldn't update the task because the task ID or status was missing or invalid.";
        }
      }
      // Process as a new request
      else {
        response = await processMessage(content);
      }
      
      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        isUser: false
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error response
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request.',
        timestamp: new Date(),
        isUser: false
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  // Create a new task
  const createTask = async (
    title: string,
    description: string,
    assignedTo: string[],
    dueDate: Date,
    priority: TaskPriority
  ) => {
    const { user, addTask, addNotification } = contextRef.current;
    
    if (!user) throw new Error("You must be logged in to create tasks");
    
    const newTask: Omit<Task, 'id'> = {
      title,
      description,
      status: 'pending',
      createdBy: user.id,
      assignedTo,
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate,
      priority,
    };
    
    const taskId = await addTask(newTask);
    
    // Send notifications to assigned users
    assignedTo.forEach(userId => {
      addNotification({
        type: NotificationType.TASK_ASSIGNED,
        message: `You have been assigned to task: ${title}`,
        userId,
        relatedId: taskId,
        read: false,
        createdAt: new Date(),
        title: 'New Task Assignment',
      });
    });
    
    return taskId;
  };
  
  // List tasks based on criteria
  const listTasks = async (status?: TaskStatus, userId?: string) => {
    const response = await formatTaskList(status, userId);
    
    const assistantMessage: Message = {
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, assistantMessage]);
  };
  
  // Send a reminder for multiple tasks
  const sendReminders = async (taskIds: string[], userId: string): Promise<string[]> => {
    const { tasks, addNotification } = contextRef.current;
    const taskTitles: string[] = [];
    
    // Process each task ID
    for (const taskId of taskIds) {
      const task = tasks.find(t => t.id === taskId);
      if (!task) continue;
      
      // Create notification
      addNotification({
        type: NotificationType.TASK_REMINDER,
        message: `Reminder: Task "${task.title}" is due on ${task.dueDate.toLocaleDateString()}`,
        userId,
        relatedId: taskId,
        read: false,
        createdAt: new Date(),
        title: 'Task Reminder',
      });
      
      taskTitles.push(task.title);
    }
    
    return taskTitles;
  };

  // Send a reminder for a single task
  const sendReminder = async (taskId: string, userId: string): Promise<void> => {
    const { tasks, addNotification } = contextRef.current;
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) throw new Error("Task not found");
    
    // Create notification
    addNotification({
      type: NotificationType.TASK_REMINDER,
      message: `Reminder: Task "${task.title}" is due on ${task.dueDate.toLocaleDateString()}`,
      userId,
      relatedId: taskId,
      read: false,
      createdAt: new Date(),
      title: 'Task Reminder',
    });
  };
  
  // Mark a task as complete
  const markTaskAsComplete = async (taskId: string) => {
    const { tasks, updateTask, addNotification } = contextRef.current;
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) throw new Error("Task not found");
    
    await updateTask(taskId, {
      ...task,
      status: 'completed',
      updatedAt: new Date(),
    });
    
    // Notify the task creator
    addNotification({
      type: NotificationType.TASK_COMPLETED,
      message: `Task "${task.title}" has been marked as completed`,
      userId: task.createdBy,
      relatedId: taskId,
      read: false,
      createdAt: new Date(),
      title: 'Task Completed',
    });
  };
  
  // Update a task's status
  const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
    const { tasks, updateTask, addNotification } = contextRef.current;
    const task = tasks.find(t => t.id === taskId);
    
    if (!task) throw new Error("Task not found");
    
    await updateTask(taskId, {
      ...task,
      status,
      updatedAt: new Date(),
    });
    
    // Notify relevant users
    addNotification({
      type: NotificationType.TASK_UPDATED,
      message: `Task "${task.title}" status has been updated to ${status}`,
      userId: task.createdBy,
      relatedId: taskId,
      read: false,
      createdAt: new Date(),
      title: 'Task Status Updated',
    });
  };
  
  // Open task creation dialog
  const openTaskCreationDialog = useCallback(() => {
    setOpenCreateTaskDialog(true);
  }, []);

  // Open notice creation dialog
  const openNoticeCreationDialog = useCallback(() => {
    setOpenCreateNoticeDialog(true);
  }, []);

  // Open message sending dialog
  const openMessageSendingDialog = useCallback((recipientId?: string) => {
    setSelectedRecipientId(recipientId);
    setOpenSendMessageDialog(true);
  }, []);

  // Set up global state for assistant dialogs
  useEffect(() => {
    (window as any).__assistantState = {
      openCreateTaskDialog,
      setOpenCreateTaskDialog,
      openCreateNoticeDialog,
      setOpenCreateNoticeDialog,
      openSendMessageDialog,
      setOpenSendMessageDialog,
      selectedRecipientId
    };
  }, [
    openCreateTaskDialog,
    openCreateNoticeDialog,
    openSendMessageDialog,
    selectedRecipientId
  ]);

  // Reset all messages to start a new conversation
  const resetMessages = useCallback(() => {
    setMessages([]);
    console.log('AssistantContext - Messages reset');
  }, []);

  // Get task progress updates for specific tasks or users
  const getTaskProgressUpdates = async (taskIds?: string[], userId?: string): Promise<void> => {
    console.log('getTaskProgressUpdates called with:', { taskIds, userId });
    const { tasks, users } = contextRef.current;
    
    console.log('Available tasks:', tasks.length);
    console.log('Available users:', users.length);
    
    // Filter tasks based on parameters
    let filteredTasks = tasks;
    
    if (taskIds && taskIds.length > 0) {
      // Filter by specific task IDs
      filteredTasks = filteredTasks.filter(task => taskIds.includes(task.id));
      console.log('Filtered by taskIds:', filteredTasks.length);
    }
    
    if (userId) {
      // Filter by specific user ID
      filteredTasks = filteredTasks.filter(task => task.assignedTo.includes(userId));
      console.log('Filtered by userId:', filteredTasks.length);
    }
    
    console.log('Final filtered tasks:', filteredTasks.length);
    
    // Sort tasks by status and due date
    filteredTasks.sort((a, b) => {
      // Sort by status (pending first, then in-progress, then completed, then overdue)
      const statusOrder = { 'pending': 0, 'in-progress': 1, 'completed': 2, 'overdue': 3 };
      const statusComparison = statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
      
      if (statusComparison !== 0) return statusComparison;
      
      // If same status, sort by due date (ascending)
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
    
    // Format progress updates
    let response = `# Task Progress Updates\n\n`;
    
    if (userId) {
      const user = users.find(u => u.id === userId);
      if (user) {
        response += `Progress for user: **${user.username}**\n\n`;
      }
    }
    
    if (filteredTasks.length === 0) {
      response += "No tasks found matching the criteria.";
    } else {
      // Group tasks by status
      const tasksByStatus: Record<string, Task[]> = {
        'pending': [],
        'in-progress': [],
        'completed': [],
        'overdue': []
      };
      
      filteredTasks.forEach(task => {
        if (tasksByStatus[task.status]) {
          tasksByStatus[task.status].push(task);
        }
      });
      
      // Generate progress report
      for (const [status, tasksWithStatus] of Object.entries(tasksByStatus)) {
        if (tasksWithStatus.length > 0) {
          response += `## ${status.toUpperCase()} Tasks (${tasksWithStatus.length})\n\n`;
          
          tasksWithStatus.forEach(task => {
            const assignedUsers = task.assignedTo.map(userId => {
              const user = users.find(u => u.id === userId);
              return user ? user.username : 'Unknown user';
            }).join(', ');
            
            const dueDate = new Date(task.dueDate).toLocaleDateString();
            const createdDate = new Date(task.createdAt).toLocaleDateString();
            const daysSinceCreation = Math.floor((Date.now() - new Date(task.createdAt).getTime()) / (1000 * 60 * 60 * 24));
            const daysUntilDue = Math.floor((new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            
            response += `### ${task.title}\n`;
            response += `- **Status:** ${task.status}\n`;
            response += `- **Priority:** ${task.priority}\n`;
            response += `- **Assigned to:** ${assignedUsers}\n`;
            response += `- **Created on:** ${createdDate} (${daysSinceCreation} days ago)\n`;
            response += `- **Due on:** ${dueDate} (${daysUntilDue > 0 ? daysUntilDue + ' days left' : 'Overdue'})\n`;
            
            if (task.description) {
              response += `- **Description:** ${task.description}\n`;
            }
            
            response += '\n';
          });
        }
      }
    }
    
    // Add the response as an assistant message
    const assistantMessage: Message = {
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, assistantMessage]);
  };

  // Only provide functionality when properly initialized
  const value: AssistantContextType = {
    messages,
    sendMessage,
    isLoading,
    createTask,
    listTasks,
    sendReminder,
    sendReminders,
    markTaskAsComplete,
    updateTaskStatus,
    openTaskCreationDialog,
    openNoticeCreationDialog,
    openMessageSendingDialog,
    resetMessages,
    getTaskProgressUpdates
  };

  return (
    <AssistantContext.Provider value={value}>
      {children}
    </AssistantContext.Provider>
  );
};

export const useAssistant = () => {
  const context = useContext(AssistantContext);
  if (context === undefined) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return context;
}; 