/**
 * WhatsApp Bot Module
 * 
 * This module implements a dedicated WhatsApp bot with a permanent phone number
 * for sending notifications automatically.
 */

import { formatPhoneNumber, generateWhatsAppUrlWithMessage } from './whatsapp-url';
import axios from 'axios';

// Configuration 
const BOT_PHONE_NUMBER = process.env.WHATSAPP_BOT_NUMBER || ''; // Set this in your .env file
const WHATSAPP_ENABLED = process.env.ENABLE_WHATSAPP_NOTIFICATIONS === 'true';
const WHATSAPP_BOT_URL = process.env.WHATSAPP_BOT_URL || 'http://localhost:3100';

/**
 * Get the bot's phone number
 * @returns Formatted WhatsApp bot phone number
 */
export function getBotPhoneNumber(): string {
  return formatPhoneNumber(BOT_PHONE_NUMBER);
}

/**
 * Generate a message link that opens WhatsApp with the bot's number
 * @param message Message to pre-fill
 * @returns WhatsApp URL
 */
export function generateBotMessageLink(message: string): string {
  const botNumber = getBotPhoneNumber();
  if (!botNumber) {
    throw new Error('WhatsApp bot phone number is not configured');
  }
  
  return generateWhatsAppUrlWithMessage(botNumber, message);
}

/**
 * Check if the bot server is available
 * @returns Promise resolving to whether the server is connected
 */
export async function checkBotStatus(): Promise<{
  connected: boolean;
  uptime: string;
  botNumber: string;
}> {
  try {
    const response = await axios.get(`${WHATSAPP_BOT_URL}/health`);
    return response.data;
  } catch (error) {
    console.error('[WhatsApp Bot] Error checking status:', error);
    return { connected: false, uptime: '0s', botNumber: '' };
  }
}

/**
 * Send a message from the bot (generates URL to open chat with bot)
 * This can be used when the bot needs to send a message to users
 * @param to Recipient phone number
 * @param message Message content
 * @returns Promise resolving to success status
 */
export async function sendBotMessage(to: string, message: string): Promise<boolean> {
  if (!WHATSAPP_ENABLED) {
    console.log('[WhatsApp Bot] Notifications disabled. Would have sent:', message);
    return false;
  }
  
  try {
    const response = await axios.post(`${WHATSAPP_BOT_URL}/api/send`, {
      to,
      message
    });
    
    return response.data.success === true;
  } catch (error) {
    console.error('[WhatsApp Bot] Error sending message:', error);
    return false;
  }
}

/**
 * Format a task notification message for the bot
 * @param taskTitle Task title
 * @param taskDescription Task description
 * @param dueDate Due date
 * @param assignee Assignee name
 * @param assigner Assigner name
 * @returns Formatted message
 */
export function formatTaskAssignmentMessage(
  taskTitle: string,
  taskDescription: string,
  dueDate: Date,
  assignee: string,
  assigner: string
): string {
  return `
*New Task Assigned - Hearing Hope*

Hello ${assignee},

You have been assigned a new task by ${assigner}:

*${taskTitle}*

${taskDescription}

Due: ${dueDate.toLocaleDateString()}

Please check the Task Management System for more details.
`;
}

/**
 * Format a task reminder message for the bot
 * @param taskTitle Task title
 * @param assignee Assignee name
 * @param timeRemaining Time remaining
 * @returns Formatted message
 */
export function formatTaskReminderMessage(
  taskTitle: string,
  assignee: string,
  timeRemaining: string
): string {
  return `
*Task Reminder - Hearing Hope*

Hello ${assignee},

Your task *${taskTitle}* is due in ${timeRemaining}.

Please complete it as soon as possible.
`;
}

/**
 * Format an admin notification message for the bot
 * @param message Message content
 * @returns Formatted message
 */
export function formatAdminNotificationMessage(message: string): string {
  return `
*Admin Notification - Hearing Hope*

${message}
`;
}

/**
 * Format a task status change notification message
 * @param taskTitle Task title
 * @param previousStatus Previous status
 * @param newStatus New status
 * @param userName User's name
 * @returns Formatted message
 */
export function formatTaskStatusChangeMessage(
  taskTitle: string,
  previousStatus: string,
  newStatus: string,
  userName: string
): string {
  return `
*Task Status Update - Hearing Hope*

Hello ${userName},

The status of task "${taskTitle}" has changed from *${previousStatus}* to *${newStatus}*.

Please check the Task Management System for more details.
`;
}

/**
 * Format a task completion notification message
 * @param taskTitle Task title
 * @param completedBy Who completed the task
 * @param completionDate When the task was completed
 * @param userName User's name
 * @returns Formatted message
 */
export function formatTaskCompletionMessage(
  taskTitle: string,
  completedBy: string,
  completionDate: string,
  userName: string
): string {
  return `
*Task Completed - Hearing Hope*

Hello ${userName},

The task "${taskTitle}" has been marked as complete by ${completedBy} on ${completionDate}.

Please check the Task Management System for more details.
`;
}

/**
 * Format a task revocation notification message
 * @param taskTitle Task title
 * @param revokedBy Who revoked the completion
 * @param reason Reason for revocation
 * @param userName User's name
 * @returns Formatted message
 */
export function formatTaskRevocationMessage(
  taskTitle: string,
  revokedBy: string,
  reason: string,
  userName: string
): string {
  return `
*Task Completion Revoked - Hearing Hope*

Hello ${userName},

The completion status of task "${taskTitle}" has been revoked by ${revokedBy}.
${reason ? `\nReason: ${reason}` : ''}

Please check the Task Management System for more details.
`;
}

/**
 * Send a task assignment notification
 * @param phone Recipient phone number
 * @param taskTitle Task title
 * @param taskDescription Task description
 * @param dueDate Due date
 * @param assigneeName Assignee name
 * @param assignerName Assigner name
 * @returns Promise resolving to success status
 */
export async function sendTaskAssignmentNotification(
  phone: string,
  taskTitle: string,
  taskDescription: string,
  dueDate: Date,
  assigneeName: string,
  assignerName: string
): Promise<boolean> {
  try {
    const response = await axios.post(`${WHATSAPP_BOT_URL}/api/notify-task`, {
      phone,
      taskTitle,
      taskDescription,
      dueDate,
      assigneeName,
      assignerName
    });
    
    return response.data.success === true;
  } catch (error) {
    console.error('[WhatsApp Bot] Error sending task notification:', error);
    return false;
  }
}

/**
 * Send a task reminder notification
 * @param phone Recipient phone number
 * @param taskTitle Task title
 * @param assigneeName Assignee name
 * @param timeRemaining Time remaining
 * @returns Promise resolving to success status
 */
export async function sendTaskReminderNotification(
  phone: string,
  taskTitle: string,
  assigneeName: string,
  timeRemaining: string
): Promise<boolean> {
  try {
    const response = await axios.post(`${WHATSAPP_BOT_URL}/api/notify-reminder`, {
      phone,
      taskTitle,
      assigneeName,
      timeRemaining
    });
    
    return response.data.success === true;
  } catch (error) {
    console.error('[WhatsApp Bot] Error sending reminder notification:', error);
    return false;
  }
}

/**
 * Send an admin notification
 * @param phone Admin phone number
 * @param message Message content
 * @returns Promise resolving to success status
 */
export async function sendAdminNotification(
  phone: string,
  message: string
): Promise<boolean> {
  try {
    const response = await axios.post(`${WHATSAPP_BOT_URL}/api/notify-admin`, {
      phone,
      message
    });
    
    return response.data.success === true;
  } catch (error) {
    console.error('[WhatsApp Bot] Error sending admin notification:', error);
    return false;
  }
}

/**
 * Send a task status change notification
 * @param phone Recipient phone number
 * @param taskTitle Task title
 * @param previousStatus Previous status
 * @param newStatus New status
 * @param userName User's name
 * @returns Promise resolving to success status
 */
export async function sendTaskStatusChangeNotification(
  phone: string,
  taskTitle: string,
  previousStatus: string,
  newStatus: string,
  userName: string
): Promise<boolean> {
  try {
    const response = await axios.post(`${WHATSAPP_BOT_URL}/api/notify-task-status`, {
      phone,
      taskTitle,
      previousStatus,
      newStatus,
      userName
    });
    
    return response.data.success === true;
  } catch (error) {
    console.error('[WhatsApp Bot] Error sending status change notification:', error);
    return false;
  }
}

/**
 * Send a task completion notification
 * @param phone Recipient phone number
 * @param taskTitle Task title
 * @param completedBy Who completed the task
 * @param completedDate When the task was completed
 * @param userName User's name
 * @returns Promise resolving to success status
 */
export async function sendTaskCompletionNotification(
  phone: string,
  taskTitle: string,
  completedBy: string,
  completedDate: Date | null,
  userName: string
): Promise<boolean> {
  try {
    const response = await axios.post(`${WHATSAPP_BOT_URL}/api/notify-task-completion`, {
      phone,
      taskTitle,
      completedBy,
      completedDate,
      userName
    });
    
    return response.data.success === true;
  } catch (error) {
    console.error('[WhatsApp Bot] Error sending completion notification:', error);
    return false;
  }
}

/**
 * Send a task completion revocation notification
 * @param phone Recipient phone number
 * @param taskTitle Task title
 * @param revokedBy Who revoked the completion
 * @param reason Reason for revocation
 * @param userName User's name
 * @returns Promise resolving to success status
 */
export async function sendTaskRevocationNotification(
  phone: string,
  taskTitle: string,
  revokedBy: string,
  reason: string,
  userName: string
): Promise<boolean> {
  try {
    const response = await axios.post(`${WHATSAPP_BOT_URL}/api/notify-task-revocation`, {
      phone,
      taskTitle,
      revokedBy,
      reason,
      userName
    });
    
    return response.data.success === true;
  } catch (error) {
    console.error('[WhatsApp Bot] Error sending revocation notification:', error);
    return false;
  }
}

export default {
  getBotPhoneNumber,
  generateBotMessageLink,
  sendBotMessage,
  checkBotStatus,
  formatTaskAssignmentMessage,
  formatTaskReminderMessage,
  formatAdminNotificationMessage,
  formatTaskStatusChangeMessage,
  formatTaskCompletionMessage,
  formatTaskRevocationMessage,
  sendTaskAssignmentNotification,
  sendTaskReminderNotification,
  sendAdminNotification,
  sendTaskStatusChangeNotification,
  sendTaskCompletionNotification,
  sendTaskRevocationNotification
}; 