import nodemailer from 'nodemailer';
import User from '@/models/User';
import Notification from '@/models/Notification';

// Email configuration
const EMAIL_HOST = process.env.EMAIL_HOST!;
const EMAIL_PORT = Number(process.env.EMAIL_PORT!);
const EMAIL_USER = process.env.EMAIL_USER!;
const EMAIL_PASS = process.env.EMAIL_PASS!;

// Create transporter
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  secure: EMAIL_PORT === 465,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

// Email templates
export const emailTemplates = {
  taskAssigned: (
    recipientName: string,
    taskTitle: string,
    taskDescription: string,
    dueDate: Date,
    assignerName: string
  ) => ({
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background-color: #EE6417; padding: 20px; text-align: center; color: white;">
          <h1>New Task Assigned</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>Hello ${recipientName},</p>
          <p>A new task has been assigned to you:</p>
          <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #3aa986;">
            <h2 style="margin-top: 0; color: #EE6417;">${taskTitle}</h2>
            <p><strong>Description:</strong> ${taskDescription}</p>
            <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}</p>
            <p><strong>Assigned By:</strong> ${assignerName}</p>
          </div>
          <p>Please log in to the Hearing Hope Task Management System to view the task details and update your progress.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #3aa986; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Task</a>
          </div>
          <p style="margin-top: 30px;">Thank you,<br>Hearing Hope Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777;">
          <p>This is an automated message from the Hearing Hope Task Management System.</p>
        </div>
      </div>
    `,
  }),
  
  taskReminder: (
    recipientName: string,
    taskTitle: string,
    dueDate: Date,
    hoursRemaining: number
  ) => ({
    subject: `Task Reminder: ${taskTitle} due in ${hoursRemaining} ${hoursRemaining === 1 ? 'hour' : hoursRemaining > 24 ? 'days' : 'hours'}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background-color: #EE6417; padding: 20px; text-align: center; color: white;">
          <h1>Task Reminder</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>Hello ${recipientName},</p>
          <p>This is a reminder that the following task is due in ${hoursRemaining > 24 ? `${Math.floor(hoursRemaining / 24)} day${Math.floor(hoursRemaining / 24) > 1 ? 's' : ''}` : `${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}`}:</p>
          <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #3aa986;">
            <h2 style="margin-top: 0; color: #EE6417;">${taskTitle}</h2>
            <p><strong>Due Date:</strong> ${dueDate.toLocaleDateString()} at ${dueDate.toLocaleTimeString()}</p>
          </div>
          <p>Please log in to the Hearing Hope Task Management System to update your progress and complete the task on time.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #3aa986; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Task</a>
          </div>
          <p style="margin-top: 30px;">Thank you,<br>Hearing Hope Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777;">
          <p>This is an automated message from the Hearing Hope Task Management System.</p>
        </div>
      </div>
    `,
  }),
  
  newNotice: (
    recipientName: string,
    noticeTitle: string,
    noticeContent: string,
    postedBy: string
  ) => ({
    subject: `New Notice: ${noticeTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background-color: #EE6417; padding: 20px; text-align: center; color: white;">
          <h1>New Notice Posted</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>Hello ${recipientName},</p>
          <p>A new notice has been posted:</p>
          <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #3aa986;">
            <h2 style="margin-top: 0; color: #EE6417;">${noticeTitle}</h2>
            <p>${noticeContent}</p>
            <p><strong>Posted By:</strong> ${postedBy}</p>
          </div>
          <p>Please log in to the Hearing Hope Task Management System to view the full notice.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #3aa986; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Notice</a>
          </div>
          <p style="margin-top: 30px;">Thank you,<br>Hearing Hope Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777;">
          <p>This is an automated message from the Hearing Hope Task Management System.</p>
        </div>
      </div>
    `,
  }),
  
  newMessage: (
    recipientName: string,
    senderName: string,
    messageSubject: string,
    messagePreview: string
  ) => ({
    subject: `New Message: ${messageSubject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background-color: #EE6417; padding: 20px; text-align: center; color: white;">
          <h1>New Message</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>Hello ${recipientName},</p>
          <p>You have received a new message from ${senderName}:</p>
          <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #3aa986;">
            <h2 style="margin-top: 0; color: #EE6417;">${messageSubject}</h2>
            <p>${messagePreview}...</p>
          </div>
          <p>Please log in to the Hearing Hope Task Management System to read the full message and reply.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}/dashboard" style="background-color: #3aa986; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View Message</a>
          </div>
          <p style="margin-top: 30px;">Thank you,<br>Hearing Hope Team</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777;">
          <p>This is an automated message from the Hearing Hope Task Management System.</p>
        </div>
      </div>
    `,
  }),
  
  adminNotification: (
    action: string,
    details: string,
    userInvolved: string,
    linkText: string,
    linkUrl: string
  ) => ({
    subject: `Admin Alert: ${action}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
        <div style="background-color: #19ac8b; padding: 20px; text-align: center; color: white;">
          <h1>Admin Notification</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #ddd; border-top: none;">
          <p>Hello Admin,</p>
          <p>This is an automated notification about a recent system activity:</p>
          <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0; border-left: 4px solid #F26722;">
            <h2 style="margin-top: 0; color: #19ac8b;">${action}</h2>
            <p><strong>Details:</strong> ${details}</p>
            <p><strong>User Involved:</strong> ${userInvolved}</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>Please log in to the Hearing Hope Task Management System for more details.</p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.NEXTAUTH_URL}${linkUrl}" style="background-color: #F26722; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">${linkText}</a>
          </div>
          <p style="margin-top: 30px;">Thank you,<br>Hearing Hope System</p>
        </div>
        <div style="background-color: #f5f5f5; padding: 15px; text-align: center; font-size: 12px; color: #777;">
          <p>This is an automated message from the Hearing Hope Task Management System.</p>
        </div>
      </div>
    `,
  }),
};

// Send email function
export async function sendEmail(
  to: string | string[],
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const mailOptions = {
      from: `"Hearing Hope" <${EMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(',') : to,
      subject,
      html,
    };
    
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

// Function to notify all super admins about system events
export async function notifyAdmins(
  action: string,
  details: string,
  userInvolved: string,
  linkText: string = 'View Details',
  linkUrl: string = '/dashboard'
): Promise<boolean> {
  try {
    // Connect to database (ensure this doesn't cause issues with existing connections)
    // This assumes your database connection is established elsewhere when needed
    
    // Find all super admin users
    const superAdmins = await User.find({ role: 'SUPER_ADMIN', isActive: true }, 'email name');
    
    if (superAdmins.length === 0) {
      console.log('No active super admins found to notify');
      return false;
    }
    
    // Create and send notification email to all admins
    const adminEmails = superAdmins.map(admin => admin.email);
    
    // Create and send notification email
    const notification = emailTemplates.adminNotification(
      action,
      details,
      userInvolved,
      linkText,
      linkUrl
    );
    
    const emailResult = await sendEmail(adminEmails, notification.subject, notification.html);
    
    // For each admin, also create an in-app notification
    // But first check if a similar notification exists in the last 5 minutes to avoid duplicates
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    for (const admin of superAdmins) {
      try {
        // Check for similar recent notifications to avoid duplicates
        const existingNotification = await Notification.findOne({
          userId: admin._id,
          type: 'status', // Admin notifications are status type
          title: action,
          message: { $regex: userInvolved, $options: 'i' }, // Look for similar content
          createdAt: { $gt: fiveMinutesAgo }
        });
        
        // Only create a new notification if no similar one exists
        if (!existingNotification) {
          const adminNotification = new Notification({
            userId: admin._id,
            type: 'status',
            title: action,
            message: `${details} - By: ${userInvolved}`,
            link: linkUrl,
            read: false,
            createdAt: new Date()
          });
          
          await adminNotification.save();
        } else {
          console.log(`Skipping duplicate notification for admin ${admin._id}: ${action}`);
        }
      } catch (notifyError) {
        console.error(`Error creating in-app notification for admin ${admin._id}:`, notifyError);
      }
    }
    
    return emailResult;
  } catch (error) {
    console.error('Error notifying admins:', error);
    return false;
  }
} 