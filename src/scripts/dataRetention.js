// Data Retention Script
// This script will:
// 1. Archive notifications older than 1 month
// 2. Archive completed tasks older than 2 months

require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Import models
require('../models/Task');
require('../models/Notification');

const Task = mongoose.model('Task');
const Notification = mongoose.model('Notification');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  bufferCommands: false,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => {
  console.error('Error connecting to MongoDB:', err);
  process.exit(1);
});

// Ensure archives directory exists
const archivesDir = path.join(__dirname, '../../archives');
if (!fs.existsSync(archivesDir)) {
  fs.mkdirSync(archivesDir, { recursive: true });
}

// Get date thresholds
const oneMonthAgo = new Date();
oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

const twoMonthsAgo = new Date();
twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

// Function to archive data to JSON files
async function archiveData(data, type, timestamp) {
  if (!data || data.length === 0) {
    console.log(`No ${type} to archive`);
    return;
  }
  
  // Format timestamp for filename
  const dateStr = timestamp.toISOString().split('T')[0];
  const filename = `${type}_archive_${dateStr}.json`;
  const filePath = path.join(archivesDir, filename);
  
  // Write to file
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`${data.length} ${type} archived to ${filename}`);
    return data.length;
  } catch (err) {
    console.error(`Error writing archive file: ${err.message}`);
    return 0;
  }
}

// Archive and delete old notifications
async function processNotifications() {
  try {
    // Find old notifications
    const oldNotifications = await Notification.find({
      createdAt: { $lt: oneMonthAgo }
    }).lean();
    
    // Archive notifications
    const archivedCount = await archiveData(
      oldNotifications, 
      'notifications', 
      new Date()
    );
    
    if (archivedCount > 0) {
      // Delete archived notifications
      const deleteResult = await Notification.deleteMany({
        createdAt: { $lt: oneMonthAgo }
      });
      
      console.log(`Deleted ${deleteResult.deletedCount} old notifications`);
    }
  } catch (err) {
    console.error('Error processing notifications:', err);
  }
}

// Archive and delete old completed tasks
async function processCompletedTasks() {
  try {
    // Find old completed tasks
    const oldTasks = await Task.find({
      status: 'COMPLETED',
      completedDate: { $lt: twoMonthsAgo }
    }).lean();
    
    // Archive tasks
    const archivedCount = await archiveData(
      oldTasks, 
      'completed_tasks', 
      new Date()
    );
    
    if (archivedCount > 0) {
      // Delete archived tasks
      const deleteResult = await Task.deleteMany({
        status: 'COMPLETED',
        completedDate: { $lt: twoMonthsAgo }
      });
      
      console.log(`Deleted ${deleteResult.deletedCount} old completed tasks`);
    }
  } catch (err) {
    console.error('Error processing completed tasks:', err);
  }
}

// Main function
async function runDataRetention() {
  console.log('Starting data retention process...');
  
  await processNotifications();
  await processCompletedTasks();
  
  console.log('Data retention process completed');
  mongoose.connection.close();
  process.exit(0);
}

// Run the main function
runDataRetention(); 