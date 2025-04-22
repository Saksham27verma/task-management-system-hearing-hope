/**
 * Clean Tasks script - Deletes all tasks from the database for production readiness
 * 
 * Usage: 
 * - Make sure your .env.local file is set up
 * - Run with: node scripts/clean-tasks.js
 */

console.log('Starting clean tasks script...');
require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Found' : 'Not found');

// Connect to MongoDB
const connectToDatabase = async () => {
  console.log('Attempting to connect to MongoDB...');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return false;
  }
};

// Define Task schema
const taskSchema = new mongoose.Schema({
  title: String,
  description: String,
  assignedTo: [mongoose.Schema.Types.ObjectId],
  assignedBy: mongoose.Schema.Types.ObjectId,
  taskType: String,
  status: String,
  startDate: Date,
  dueDate: Date,
  dateRange: Object,
  remarks: String,
  progressUpdates: Array,
  completedDate: Date,
  googleCalendarEventId: String,
}, { timestamps: true });

// Clean all tasks
const cleanTasks = async () => {
  console.log('Attempting to delete all tasks...');
  try {
    // Check if Task model exists in mongoose models
    const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
    
    // Count existing tasks
    const taskCount = await Task.countDocuments();
    console.log(`Found ${taskCount} tasks in the database`);
    
    if (taskCount === 0) {
      console.log('⚠️ No tasks found, nothing to delete');
      return;
    }
    
    // Delete all tasks
    const result = await Task.deleteMany({});
    console.log(`✅ Successfully deleted ${result.deletedCount} tasks`);
    
    // Also clean up task-related messages if any
    try {
      const messageSchema = new mongoose.Schema({
        sender: mongoose.Schema.Types.ObjectId,
        recipient: mongoose.Schema.Types.ObjectId,
        subject: String,
        content: String,
        isRead: Boolean,
        readAt: Date,
        isTaskRelated: Boolean,
        relatedTask: mongoose.Schema.Types.ObjectId,
      }, { timestamps: true });
      
      const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);
      
      // Delete task-related messages
      const messageResult = await Message.deleteMany({ isTaskRelated: true });
      console.log(`✅ Successfully deleted ${messageResult.deletedCount} task-related messages`);
    } catch (messageError) {
      console.error('❌ Error cleaning task-related messages:', messageError);
    }
    
    console.log('✅ Task cleanup completed successfully');
  } catch (error) {
    console.error('❌ Error cleaning tasks:', error);
  }
};

// Run the clean process
const cleanDatabase = async () => {
  console.log('Beginning database cleanup process...');
  const connected = await connectToDatabase();
  
  if (connected) {
    await cleanTasks();
    console.log('✅ Cleanup process completed');
  } else {
    console.error('❌ Could not connect to database, cleanup process failed');
  }
  
  // Close database connection
  console.log('Closing database connection...');
  mongoose.connection.close();
};

// Execute the clean function
console.log('Executing cleanDatabase function...');
cleanDatabase().catch(err => {
  console.error('Unhandled error in cleanup script:', err);
  process.exit(1);
}); 