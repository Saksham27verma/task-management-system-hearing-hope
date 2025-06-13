/**
 * WhatsApp Integration Module
 * 
 * This module provides integration with WhatsApp for sending notifications
 * with fallback mechanisms when the service is not available.
 */

import mongoose from 'mongoose';
import axios from 'axios';
import { 
  generateWhatsAppQR, 
  formatPhoneNumber as formatPhone 
} from './whatsapp-url';
import botUtils from './whatsapp-bot';

// Configuration
const WHATSAPP_ENABLED = process.env.ENABLE_WHATSAPP_NOTIFICATIONS === 'true';
const WHATSAPP_SERVICE_URL = process.env.WHATSAPP_BOT_URL || 'http://localhost:3100/api/send';
const BOT_PHONE_NUMBER = process.env.WHATSAPP_BOT_NUMBER || '';
const DEFAULT_COUNTRY_CODE = '91'; // India

// Tracking QR codes generated for messages
interface WhatsAppQRRecord {
  phone: string;
  qrPath: string;
  message: string;
  timestamp: Date;
}

// Keep track of QR codes we've generated
const generatedQRCodes: WhatsAppQRRecord[] = [];

/**
 * Format phone number for WhatsApp
 * @param phone Phone number to format
 * @returns Properly formatted phone number
 */
function formatPhoneNumber(phone: string): string {
  return formatPhone(phone);
}

/**
 * Get the bot's phone number
 * @returns Formatted bot phone number
 */
export function getBotPhoneNumber(): string {
  return botUtils.getBotPhoneNumber();
}

/**
 * Generate a link to chat with the bot
 * @param message Pre-filled message
 * @returns WhatsApp URL to chat with bot
 */
export function generateBotLink(message: string): string {
  return botUtils.generateBotMessageLink(message);
}

/**
 * Send a WhatsApp message directly to the bot server
 * @param to Recipient phone number
 * @param message Message to send
 * @returns Promise with the result
 */
async function sendToBotServer(to: string, message: string): Promise<boolean> {
  try {
    const response = await axios.post(WHATSAPP_SERVICE_URL, { 
      to, 
      message 
    });
    
    return response.data.success === true;
  } catch (error) {
    console.error('[WhatsApp] Bot server error:', error.message);
    return false;
  }
}

/**
 * Send a task notification directly to the bot server
 * @param phone Recipient phone number
 * @param taskTitle Task title
 * @param taskDescription Task description
 * @param dueDate Due date
 * @param assigneeName Assignee name
 * @param assignerName Assigner name
 * @returns Promise with the result
 */
async function sendTaskNotification(
  phone: string,
  taskTitle: string,
  taskDescription: string,
  dueDate: Date,
  assigneeName: string,
  assignerName: string
): Promise<boolean> {
  try {
    const response = await axios.post(
      process.env.WHATSAPP_BOT_URL?.replace('/api/send', '/api/notify-task') || 
      'http://localhost:3100/api/notify-task', 
      { 
        phone, 
        taskTitle,
        taskDescription,
        dueDate,
        assigneeName,
        assignerName
      }
    );
    
    return response.data.success === true;
  } catch (error) {
    console.error('[WhatsApp] Bot task notification error:', error.message);
    return false;
  }
}

/**
 * Send a reminder notification directly to the bot server
 * @param phone Recipient phone number
 * @param taskTitle Task title
 * @param assigneeName Assignee name
 * @param timeRemaining Time remaining
 * @returns Promise with the result
 */
async function sendReminderNotification(
  phone: string,
  taskTitle: string,
  assigneeName: string,
  timeRemaining: string
): Promise<boolean> {
  try {
    const response = await axios.post(
      process.env.WHATSAPP_BOT_URL?.replace('/api/send', '/api/notify-reminder') || 
      'http://localhost:3100/api/notify-reminder',
      { 
        phone, 
        taskTitle,
        assigneeName,
        timeRemaining
      }
    );
    
    return response.data.success === true;
  } catch (error) {
    console.error('[WhatsApp] Bot reminder notification error:', error.message);
    return false;
  }
}

/**
 * Send an admin notification directly to the bot server
 * @param phone Admin phone number
 * @param message Message to send
 * @returns Promise with the result
 */
async function sendAdminNotification(
  phone: string,
  message: string
): Promise<boolean> {
  try {
    const response = await axios.post(
      process.env.WHATSAPP_BOT_URL?.replace('/api/send', '/api/notify-admin') || 
      'http://localhost:3100/api/notify-admin',
      { 
        phone, 
        message
      }
    );
    
    return response.data.success === true;
  } catch (error) {
    console.error('[WhatsApp] Bot admin notification error:', error.message);
    return false;
  }
}

/**
 * Send a task status change notification directly to the bot server
 * @param phone Recipient phone number
 * @param taskTitle Task title
 * @param previousStatus Previous task status
 * @param newStatus New task status
 * @param userName User's name
 * @returns Promise with the result
 */
async function sendTaskStatusNotification(
  phone: string,
  taskTitle: string,
  previousStatus: string,
  newStatus: string,
  userName: string
): Promise<boolean> {
  try {
    const response = await axios.post(
      process.env.WHATSAPP_BOT_URL?.replace('/api/send', '/api/notify-task-status') || 
      'http://localhost:3100/api/notify-task-status',
      { 
        phone,
        taskTitle,
        previousStatus,
        newStatus,
        userName
      }
    );
    
    return response.data.success === true;
  } catch (error) {
    console.error('[WhatsApp] Bot task status notification error:', error.message);
    return false;
  }
}

/**
 * Send a task completion notification directly to the bot server
 * @param phone Recipient phone number
 * @param taskTitle Task title
 * @param completedBy User who completed the task
 * @param completedDate Date when task was completed
 * @param userName User's name
 * @returns Promise with the result
 */
async function sendTaskCompletionNotification(
  phone: string,
  taskTitle: string,
  completedBy: string,
  completedDate: Date,
  userName: string
): Promise<boolean> {
  try {
    const response = await axios.post(
      process.env.WHATSAPP_BOT_URL?.replace('/api/send', '/api/notify-task-completion') || 
      'http://localhost:3100/api/notify-task-completion',
      { 
        phone,
        taskTitle,
        completedBy,
        completedDate,
        userName
      }
    );
    
    return response.data.success === true;
  } catch (error) {
    console.error('[WhatsApp] Bot task completion notification error:', error.message);
    return false;
  }
}

/**
 * Send a task completion revocation notification directly to the bot server
 * @param phone Recipient phone number
 * @param taskTitle Task title
 * @param revokedBy User who revoked the completion
 * @param reason Reason for revocation
 * @param userName User's name
 * @returns Promise with the result
 */
async function sendTaskRevocationNotification(
  phone: string,
  taskTitle: string,
  revokedBy: string,
  reason: string,
  userName: string
): Promise<boolean> {
  try {
    const response = await axios.post(
      process.env.WHATSAPP_BOT_URL?.replace('/api/send', '/api/notify-task-revocation') || 
      'http://localhost:3100/api/notify-task-revocation',
      { 
        phone,
        taskTitle,
        revokedBy,
        reason,
        userName
      }
    );
    
    return response.data.success === true;
  } catch (error) {
    console.error('[WhatsApp] Bot task revocation notification error:', error.message);
    return false;
  }
}

/**
 * Send a notice notification directly to the bot server
 * @param phone Recipient phone number
 * @param title Notice title
 * @param content Notice content
 * @param posterName Name of the person who posted the notice
 * @param isImportant Whether the notice is marked as important
 * @param userName Recipient's name
 * @returns Promise with the result
 */
async function sendNoticeNotification(
  phone: string,
  title: string,
  content: string,
  posterName: string,
  isImportant: boolean,
  userName: string
): Promise<boolean> {
  try {
    const response = await axios.post(
      process.env.WHATSAPP_BOT_URL?.replace('/api/send', '/api/notify-notice') || 
      'http://localhost:3100/api/notify-notice',
      { 
        phone,
        title,
        content,
        posterName,
        isImportant,
        userName
      }
    );
    
    return response.data.success === true;
  } catch (error) {
    console.error('[WhatsApp] Bot notice notification error:', error.message);
    return false;
  }
}

/**
 * Send a WhatsApp message to one or more recipients
 * First tries the bot server, falls back to QR code generation
 * @param to Recipient phone number(s)
 * @param message Message content
 * @param fromBot Whether to send as the dedicated bot
 * @returns Promise resolving to success status and QR codes if needed
 */
export async function sendWhatsAppMessage(
  to: string | string[],
  message: string,
  fromBot: boolean = !!BOT_PHONE_NUMBER
): Promise<{ success: boolean, qrCodes?: { phone: string, qrPath: string }[] }> {
  // Skip if WhatsApp is disabled
  if (!WHATSAPP_ENABLED) {
    console.log('[WhatsApp] Notifications disabled. Would have sent:');
    console.log(`[WhatsApp] To: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.log(`[WhatsApp] Message: ${message}`);
    return { success: false };
  }
  
  // Convert single recipient to array
  const recipients = Array.isArray(to) ? to : [to];
  if (recipients.length === 0 || !message) return { success: false };
  
  let successCount = 0;
  const qrCodes: { phone: string, qrPath: string }[] = [];
  
  try {
    // Check if bot server is running
    const serverCheck = await axios.get(
      process.env.WHATSAPP_BOT_URL?.replace('/api/send', '/health') || 
      'http://localhost:3100/health'
    ).catch(() => null);
    
    const isBotServerRunning = serverCheck?.data?.connected === true;
    
    // If bot server is running, try to send messages through it
    if (isBotServerRunning) {
      for (const recipient of recipients) {
        if (!recipient) continue;
        
        const formattedNumber = formatPhoneNumber(recipient);
        if (!formattedNumber) continue;
        
        try {
          const success = await sendToBotServer(formattedNumber, message);
          
          if (success) {
            successCount++;
          }
        } catch (error) {
          console.error(`[WhatsApp] Error sending to ${formattedNumber}:`, error.message);
        }
      }
      
      if (successCount > 0) {
        return { success: true };
      }
    }
    
    // Second attempt: Generate QR codes as fallback
    console.log('[WhatsApp] Bot server not available or failed, using QR code fallback');
    
    for (const recipient of recipients) {
      if (!recipient) continue;
      
      try {
        const formattedNumber = formatPhoneNumber(recipient);
        if (!formattedNumber) continue;
        
        // Generate QR code
        const qrPath = await generateWhatsAppQR(formattedNumber, message);
        qrCodes.push({ phone: formattedNumber, qrPath });
        
        // Store in our record
        generatedQRCodes.push({
          phone: formattedNumber,
          qrPath,
          message,
          timestamp: new Date()
        });
        
        console.log(`[WhatsApp] Generated QR code for ${formattedNumber}`);
      } catch (error) {
        console.error(`[WhatsApp] Error generating QR for ${recipient}:`, error);
      }
    }
    
    return {
      success: qrCodes.length > 0,
      qrCodes
    };
  } catch (error) {
    // Log error and return empty result
    console.error('[WhatsApp] Service error:', error.message);
    console.log('[WhatsApp] Fallback activated. Would have sent:');
    console.log(`[WhatsApp] To: ${recipients.join(', ')}`);
    console.log(`[WhatsApp] Message: ${message}`);
    return { success: false };
  }
}

// Get recently generated QR codes
export function getRecentQRCodes(limit: number = 10): WhatsAppQRRecord[] {
  return generatedQRCodes
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit);
}

// WhatsApp message templates for different notification types
export const whatsappTemplates = {
  taskAssigned: (userName: string, taskTitle: string, taskDesc: string, dueDate: Date, assignerName: string) => 
    botUtils.formatTaskAssignmentMessage(taskTitle, taskDesc, dueDate, userName, assignerName),

  taskReminder: (userName: string, taskTitle: string, timeRemaining: string) => 
    botUtils.formatTaskReminderMessage(taskTitle, userName, timeRemaining),

  adminNotification: (message: string) => 
    botUtils.formatAdminNotificationMessage(message),
    
  taskStatusChange: (userName: string, taskTitle: string, previousStatus: string, newStatus: string) => 
    botUtils.formatTaskStatusChangeMessage(taskTitle, previousStatus, newStatus, userName),

  taskCompletion: (userName: string, taskTitle: string, completedBy: string, dateStr: string) => 
    botUtils.formatTaskCompletionMessage(taskTitle, completedBy, dateStr, userName),

  taskRevocation: (userName: string, taskTitle: string, revokedBy: string, reason: string) => 
    botUtils.formatTaskRevocationMessage(taskTitle, revokedBy, reason, userName)
};

// Notify task assignees via WhatsApp
export async function notifyTaskAssignees(
  title: string,
  description: string,
  dueDate: Date,
  assignerName: string,
  assignedTo: string[]
): Promise<{ success: boolean, qrCodes?: { phone: string, qrPath: string }[] }> {
  if (!WHATSAPP_ENABLED) {
    console.log('[WhatsApp] Notifications disabled. Would have notified task assignees about:', title);
    return { success: false };
  }
  
  try {
    // Import directly rather than requiring
    const User = mongoose.models.User;
    if (!User) {
      console.error('[WhatsApp] User model not available');
      return { success: false };
    }
    
    // Get user details including phone numbers
    const allQRCodes: { phone: string, qrPath: string }[] = [];
    let overallSuccess = false;
    
    // Check if bot server is running for direct task notifications
    const serverCheck = await axios.get(
      process.env.WHATSAPP_BOT_URL?.replace('/api/send', '/health') || 
      'http://localhost:3100/health'
    ).catch(() => null);
    
    const isBotServerRunning = serverCheck?.data?.connected === true;
    
    for (const userId of assignedTo) {
      try {
        const user = await User.findById(userId);
        
        if (user && user.phone) {
          if (isBotServerRunning) {
            // Use the specialized task notification endpoint
            const success = await sendTaskNotification(
              user.phone,
              title,
              description,
              dueDate,
              user.name || 'User',
              assignerName
            );
            
            if (success) {
              overallSuccess = true;
              console.log(`[WhatsApp] Task notification sent to ${user.name} (${user.phone}) about task: ${title}`);
              continue;
            }
          }
          
          // Fallback to standard message
          const messageText = whatsappTemplates.taskAssigned(
            user.name || 'User',
            title,
            description,
            dueDate,
            assignerName
          );
          
          // Send the message (using the bot if configured)
          const result = await sendWhatsAppMessage(user.phone, messageText, !!BOT_PHONE_NUMBER);
          
          if (result.success) {
            overallSuccess = true;
          }
          
          // Collect QR codes if any were generated
          if (result.qrCodes && result.qrCodes.length > 0) {
            allQRCodes.push(...result.qrCodes);
          }
          
          console.log(`[WhatsApp] Notification sent to ${user.name} (${user.phone}) about task: ${title}`);
        } else {
          console.log(`[WhatsApp] User ${userId} has no phone number, skipping notification`);
        }
      } catch (userError) {
        console.error(`[WhatsApp] Error getting user ${userId} details:`, userError);
      }
    }
    
    return { 
      success: overallSuccess,
      qrCodes: allQRCodes.length > 0 ? allQRCodes : undefined
    };
  } catch (error) {
    console.error('[WhatsApp] Error notifying task assignees:', error);
    return { success: false };
  }
}

// Notify about task status changes
export async function notifyTaskStatusChange(
  title: string,
  previousStatus: string,
  newStatus: string,
  taskId: string,
  notifyUserIds: string[]
): Promise<{ success: boolean, qrCodes?: { phone: string, qrPath: string }[] }> {
  if (!WHATSAPP_ENABLED) {
    console.log(`[WhatsApp] Notifications disabled. Would have notified about status change for task: ${title}`);
    return { success: false };
  }
  
  try {
    // Import directly rather than requiring
    const User = mongoose.models.User;
    if (!User) {
      console.error('[WhatsApp] User model not available');
      return { success: false };
    }
    
    // Get user details including phone numbers
    const allQRCodes: { phone: string, qrPath: string }[] = [];
    let overallSuccess = false;
    
    // Check if bot server is running
    const serverCheck = await axios.get(
      process.env.WHATSAPP_BOT_URL?.replace('/api/send', '/health') || 
      'http://localhost:3100/health'
    ).catch(() => null);
    
    const isBotServerRunning = serverCheck?.data?.connected === true;
    
    for (const userId of notifyUserIds) {
      try {
        const user = await User.findById(userId);
        
        if (user && user.phone) {
          if (isBotServerRunning) {
            // Use the specialized task status notification endpoint
            const success = await sendTaskStatusNotification(
              user.phone,
              title,
              previousStatus,
              newStatus,
              user.name || 'User'
            );
            
            if (success) {
              overallSuccess = true;
              console.log(`[WhatsApp] Status change notification sent to ${user.name} (${user.phone}) about task: ${title}`);
              continue;
            }
          }
          
          // Fallback to standard message
          const messageText = whatsappTemplates.taskStatusChange(
            user.name || 'User',
            title,
            previousStatus,
            newStatus
          );
          
          // Send the message (using the bot if configured)
          const result = await sendWhatsAppMessage(user.phone, messageText, !!BOT_PHONE_NUMBER);
          
          if (result.success) {
            overallSuccess = true;
          }
          
          // Collect QR codes if any were generated
          if (result.qrCodes && result.qrCodes.length > 0) {
            allQRCodes.push(...result.qrCodes);
          }
          
          console.log(`[WhatsApp] Status change notification sent to ${user.name} (${user.phone}) about task: ${title}`);
        } else {
          console.log(`[WhatsApp] User ${userId} has no phone number, skipping notification`);
        }
      } catch (userError) {
        console.error(`[WhatsApp] Error getting user ${userId} details:`, userError);
      }
    }
    
    return { 
      success: overallSuccess,
      qrCodes: allQRCodes.length > 0 ? allQRCodes : undefined
    };
  } catch (error) {
    console.error('[WhatsApp] Error notifying about task status change:', error);
    return { success: false };
  }
}

// Notify about task completion
export async function notifyTaskCompletion(
  title: string,
  taskId: string,
  completedBy: string,
  completedDate: Date | null,
  notifyUserIds: string[]
): Promise<{ success: boolean, qrCodes?: { phone: string, qrPath: string }[] }> {
  if (!WHATSAPP_ENABLED) {
    console.log(`[WhatsApp] Notifications disabled. Would have notified about completion for task: ${title}`);
    return { success: false };
  }
  
  try {
    // Import directly rather than requiring
    const User = mongoose.models.User;
    if (!User) {
      console.error('[WhatsApp] User model not available');
      return { success: false };
    }
    
    // Get completed by user's name
    let completedByUser;
    try {
      completedByUser = await User.findById(completedBy);
    } catch (error) {
      console.error(`[WhatsApp] Error getting user who completed task:`, error);
    }
    
    const completedByName = completedByUser?.name || 'A user';
    
    // Get user details including phone numbers
    const allQRCodes: { phone: string, qrPath: string }[] = [];
    let overallSuccess = false;
    
    // Check if bot server is running
    const serverCheck = await axios.get(
      process.env.WHATSAPP_BOT_URL?.replace('/api/send', '/health') || 
      'http://localhost:3100/health'
    ).catch(() => null);
    
    const isBotServerRunning = serverCheck?.data?.connected === true;
    
    for (const userId of notifyUserIds) {
      try {
        const user = await User.findById(userId);
        
        if (user && user.phone) {
          if (isBotServerRunning && completedDate) {
            // Use the specialized task completion notification endpoint
            const success = await sendTaskCompletionNotification(
              user.phone,
              title,
              completedByName,
              completedDate,
              user.name || 'User'
            );
            
            if (success) {
              overallSuccess = true;
              console.log(`[WhatsApp] Completion notification sent to ${user.name} (${user.phone}) about task: ${title}`);
              continue;
            }
          }
          
          // Fallback to standard message
          const dateStr = completedDate ? new Date(completedDate).toLocaleDateString() : 'today';
          const messageText = whatsappTemplates.taskCompletion(
            user.name || 'User',
            title,
            completedByName,
            dateStr
          );
          
          // Send the message (using the bot if configured)
          const result = await sendWhatsAppMessage(user.phone, messageText, !!BOT_PHONE_NUMBER);
          
          if (result.success) {
            overallSuccess = true;
          }
          
          // Collect QR codes if any were generated
          if (result.qrCodes && result.qrCodes.length > 0) {
            allQRCodes.push(...result.qrCodes);
          }
          
          console.log(`[WhatsApp] Completion notification sent to ${user.name} (${user.phone}) about task: ${title}`);
        } else {
          console.log(`[WhatsApp] User ${userId} has no phone number, skipping notification`);
        }
      } catch (userError) {
        console.error(`[WhatsApp] Error getting user ${userId} details:`, userError);
      }
    }
    
    return { 
      success: overallSuccess,
      qrCodes: allQRCodes.length > 0 ? allQRCodes : undefined
    };
  } catch (error) {
    console.error('[WhatsApp] Error notifying about task completion:', error);
    return { success: false };
  }
}

// Notify about task completion revocation
export async function notifyTaskRevocation(
  title: string,
  taskId: string,
  revokedBy: string,
  reason: string,
  notifyUserIds: string[]
): Promise<{ success: boolean, qrCodes?: { phone: string, qrPath: string }[] }> {
  if (!WHATSAPP_ENABLED) {
    console.log(`[WhatsApp] Notifications disabled. Would have notified about revocation for task: ${title}`);
    return { success: false };
  }
  
  try {
    // Import directly rather than requiring
    const User = mongoose.models.User;
    if (!User) {
      console.error('[WhatsApp] User model not available');
      return { success: false };
    }
    
    // Get revoked by user's name
    let revokedByUser;
    try {
      revokedByUser = await User.findById(revokedBy);
    } catch (error) {
      console.error(`[WhatsApp] Error getting user who revoked task:`, error);
    }
    
    const revokedByName = revokedByUser?.name || 'An admin';
    
    // Get user details including phone numbers
    const allQRCodes: { phone: string, qrPath: string }[] = [];
    let overallSuccess = false;
    
    // Check if bot server is running
    const serverCheck = await axios.get(
      process.env.WHATSAPP_BOT_URL?.replace('/api/send', '/health') || 
      'http://localhost:3100/health'
    ).catch(() => null);
    
    const isBotServerRunning = serverCheck?.data?.connected === true;
    
    for (const userId of notifyUserIds) {
      try {
        const user = await User.findById(userId);
        
        if (user && user.phone) {
          if (isBotServerRunning) {
            // Use the specialized task revocation notification endpoint
            const success = await sendTaskRevocationNotification(
              user.phone,
              title,
              revokedByName,
              reason,
              user.name || 'User'
            );
            
            if (success) {
              overallSuccess = true;
              console.log(`[WhatsApp] Revocation notification sent to ${user.name} (${user.phone}) about task: ${title}`);
              continue;
            }
          }
          
          // Fallback to standard message
          const messageText = whatsappTemplates.taskRevocation(
            user.name || 'User',
            title,
            revokedByName,
            reason
          );
          
          // Send the message (using the bot if configured)
          const result = await sendWhatsAppMessage(user.phone, messageText, !!BOT_PHONE_NUMBER);
          
          if (result.success) {
            overallSuccess = true;
          }
          
          // Collect QR codes if any were generated
          if (result.qrCodes && result.qrCodes.length > 0) {
            allQRCodes.push(...result.qrCodes);
          }
          
          console.log(`[WhatsApp] Revocation notification sent to ${user.name} (${user.phone}) about task: ${title}`);
        } else {
          console.log(`[WhatsApp] User ${userId} has no phone number, skipping notification`);
        }
      } catch (userError) {
        console.error(`[WhatsApp] Error getting user ${userId} details:`, userError);
      }
    }
    
    return { 
      success: overallSuccess,
      qrCodes: allQRCodes.length > 0 ? allQRCodes : undefined
    };
  } catch (error) {
    console.error('[WhatsApp] Error notifying about task revocation:', error);
    return { success: false };
  }
}

// Function to notify super admins via WhatsApp
export async function notifyAdminsViaWhatsApp(message: string): Promise<{ success: boolean, qrCodes?: { phone: string, qrPath: string }[] }> {
  if (!WHATSAPP_ENABLED) {
    console.log('[WhatsApp] Notifications disabled. Would have notified admins:', message);
    return { success: false };
  }
  
  try {
    // Import directly rather than requiring
    const User = mongoose.models.User;
    if (!User) {
      console.error('[WhatsApp] User model not available');
      return { success: false };
    }
    
    // Find all super admin users
    const adminUsers = await User.find({ role: 'SUPER_ADMIN' });
    const allQRCodes: { phone: string, qrPath: string }[] = [];
    let overallSuccess = false;
    
    // Check if bot server is running for direct task notifications
    const serverCheck = await axios.get(
      process.env.WHATSAPP_BOT_URL?.replace('/api/send', '/health') || 
      'http://localhost:3100/health'
    ).catch(() => null);
    
    const isBotServerRunning = serverCheck?.data?.connected === true;
    
    for (const admin of adminUsers) {
      if (admin.phone) {
        if (isBotServerRunning) {
          // Use the specialized admin notification endpoint
          const success = await sendAdminNotification(
            admin.phone,
            message
          );
          
          if (success) {
            overallSuccess = true;
            console.log(`[WhatsApp] Admin notification sent to ${admin.name} (${admin.phone})`);
            continue;
          }
        }
        
        // Fallback to standard message
        const messageText = whatsappTemplates.adminNotification(message);
        const result = await sendWhatsAppMessage(admin.phone, messageText, !!BOT_PHONE_NUMBER);
        
        if (result.success) {
          overallSuccess = true;
        }
        
        // Collect QR codes if any were generated
        if (result.qrCodes && result.qrCodes.length > 0) {
          allQRCodes.push(...result.qrCodes);
        }
        
        console.log(`[WhatsApp] Admin notification sent to ${admin.name} (${admin.phone})`);
      }
    }
    
    return { 
      success: overallSuccess,
      qrCodes: allQRCodes.length > 0 ? allQRCodes : undefined
    };
  } catch (error) {
    console.error('[WhatsApp] Error notifying admins:', error);
    return { success: false };
  }
}

// Initialize WhatsApp - check connection to the service
export async function initializeWhatsApp(): Promise<void> {
  if (!WHATSAPP_ENABLED) {
    console.log('[WhatsApp] Notifications are disabled - skipping initialization');
    return;
  }
  
  console.log('[WhatsApp] Initializing...');
  
  // Check if we have a dedicated bot number configured
  if (BOT_PHONE_NUMBER) {
    console.log(`[WhatsApp] Bot mode enabled with number: ${botUtils.getBotPhoneNumber()}`);
  }
  
  // Check if bot server is available
  const botServerAvailable = await axios.get(
    process.env.WHATSAPP_BOT_URL?.replace('/api/send', '/health') || 
    'http://localhost:3100/health'
  )
    .then(response => response.data.connected === true)
    .catch(() => false);
  
  if (botServerAvailable) {
    console.log('[WhatsApp] Bot server is available and connected');
  } else {
    console.log('[WhatsApp] Bot server is not available. Using QR code fallback method.');
    console.log('[WhatsApp] Messages will be sent via QR codes that users can scan.');
  }
}

// Dummy function for backward compatibility
export async function getWhatsAppSocket() {
  console.log('[WhatsApp] getWhatsAppSocket is deprecated, using service-based approach');
  return null;
}

// Initialize WhatsApp client (alias for backward compatibility)
export async function initWhatsAppClient(): Promise<void> {
  return initializeWhatsApp();
}

// Notify about new messages
export async function notifyNewMessage(
  senderName: string,
  recipientId: string,
  subject: string,
  messagePreview: string,
  isTaskRelated: boolean = false,
  taskTitle?: string
): Promise<{ success: boolean, qrCodes?: { phone: string, qrPath: string }[] }> {
  if (!WHATSAPP_ENABLED) {
    console.log(`[WhatsApp] Notifications disabled. Would have notified about new message: ${subject}`);
    return { success: false };
  }
  
  try {
    // Import directly rather than requiring
    const User = mongoose.models.User;
    if (!User) {
      console.error('[WhatsApp] User model not available');
      return { success: false };
    }
    
    // Get recipient details
    const recipient = await User.findById(recipientId);
    if (!recipient || !recipient.phone) {
      console.log(`[WhatsApp] Recipient ${recipientId} has no phone number, skipping notification`);
      return { success: false };
    }
    
    // Check if bot server is running
    const serverCheck = await axios.get(
      process.env.WHATSAPP_BOT_URL?.replace('/api/send', '/health') || 
      'http://localhost:3100/health'
    ).catch(() => null);
    
    const isBotServerRunning = serverCheck?.data?.connected === true;
    
    // Create message content
    let messageText = `
*New Message - Hearing Hope*

Hello ${recipient.name || 'User'},

You have received a new message from ${senderName}:

*Subject:* ${subject}

*Message:* ${messagePreview}${messagePreview.length >= 100 ? '...' : ''}`;

    if (isTaskRelated && taskTitle) {
      messageText += `

*Related Task:* ${taskTitle}`;
    }

    messageText += `

Please check the Task Management System to read the full message.`;
    
    if (isBotServerRunning) {
      // Try to use the bot server first
      const success = await sendToBotServer(recipient.phone, messageText);
      if (success) {
        console.log(`[WhatsApp] Message notification sent to ${recipient.name} (${recipient.phone})`);
        return { success: true };
      }
    }
    
    // Fallback to QR code
    const result = await sendWhatsAppMessage(recipient.phone, messageText, !!BOT_PHONE_NUMBER);
    
    if (result.success || (result.qrCodes && result.qrCodes.length > 0)) {
      console.log(`[WhatsApp] Message notification sent/queued for ${recipient.name} (${recipient.phone})`);
      return result;
    }
    
    return { success: false };
  } catch (error) {
    console.error('[WhatsApp] Error notifying about new message:', error);
    return { success: false };
  }
}

// Notify about new notices/announcements
export async function notifyNewNotice(
  title: string,
  content: string,
  posterName: string,
  isImportant: boolean = false,
  targetUserIds?: string[]
): Promise<{ success: boolean, qrCodes?: { phone: string, qrPath: string }[] }> {
  if (!WHATSAPP_ENABLED) {
    console.log(`[WhatsApp] Notifications disabled. Would have notified about new notice: ${title}`);
    return { success: false };
  }
  
  try {
    // Import directly rather than requiring
    const User = mongoose.models.User;
    if (!User) {
      console.error('[WhatsApp] User model not available');
      return { success: false };
    }
    
    // Get users to notify
    let usersToNotify;
    if (targetUserIds && targetUserIds.length > 0) {
      // Users are already pre-filtered to have phone numbers by the caller
      usersToNotify = await User.find({ 
        _id: { $in: targetUserIds },
        isActive: true
      });
    } else {
      // Fallback: Notify all active users with phone numbers
      usersToNotify = await User.find({ 
        isActive: true,
        phone: { $exists: true, $ne: '' }
      });
    }
    
    if (usersToNotify.length === 0) {
      console.log('[WhatsApp] No active users found for notice notification');
      return { success: false };
    }
    
    console.log(`[WhatsApp] Found ${usersToNotify.length} users to notify for notice: ${title}`);
    
    // Check if bot server is running
    const serverCheck = await axios.get(
      process.env.WHATSAPP_BOT_URL?.replace('/api/send', '/health') || 
      'http://localhost:3100/health'
    ).catch(() => null);
    
    const isBotServerRunning = serverCheck?.data?.connected === true;
    
    // Create message content
    const contentPreview = content.length > 150 ? content.substring(0, 150) + '...' : content;
    const urgencyText = isImportant ? '*IMPORTANT*' : '';
    
    const messageText = `
${urgencyText ? `${urgencyText}\n` : ''}*New Notice - Hearing Hope*

Hello,

A new notice has been posted by ${posterName}:

*${title}*

${contentPreview}

Please check the Task Management System for the complete notice.`;
    
    const allQRCodes: { phone: string, qrPath: string }[] = [];
    let overallSuccess = false;
    
    for (const user of usersToNotify) {
      try {
        if (isBotServerRunning) {
          // Try to use the dedicated notice notification endpoint first
          const success = await sendNoticeNotification(
            user.phone, 
            title, 
            content, 
            posterName, 
            isImportant, 
            user.name || 'Team Member'
          );
          
          if (success) {
            overallSuccess = true;
            console.log(`[WhatsApp] Notice notification sent to ${user.name} (${user.phone})`);
            continue;
          }
        }
        
        // Fallback to generic message sending
        const result = await sendWhatsAppMessage(user.phone, messageText, !!BOT_PHONE_NUMBER);
        
        if (result.success) {
          overallSuccess = true;
        }
        
        // Collect QR codes if any were generated
        if (result.qrCodes && result.qrCodes.length > 0) {
          allQRCodes.push(...result.qrCodes);
        }
        
        console.log(`[WhatsApp] Notice notification sent/queued for ${user.name} (${user.phone})`);
      } catch (userError) {
        console.error(`[WhatsApp] Error sending notice notification to user ${user._id}:`, userError);
      }
    }
    
    return { 
      success: overallSuccess,
      qrCodes: allQRCodes.length > 0 ? allQRCodes : undefined
    };
  } catch (error) {
    console.error('[WhatsApp] Error notifying about new notice:', error);
    return { success: false };
  }
}

// Export additional helper functions
export default {
  getWhatsAppSocket,
  sendWhatsAppMessage,
  notifyTaskAssignees,
  notifyTaskStatusChange,
  notifyTaskCompletion,
  notifyTaskRevocation,
  notifyAdminsViaWhatsApp,
  initializeWhatsApp,
  initWhatsAppClient,
  whatsappTemplates,
  getRecentQRCodes,
  formatPhoneNumber,
  getBotPhoneNumber,
  generateBotLink,
  notifyNewMessage,
  notifyNewNotice
}; 