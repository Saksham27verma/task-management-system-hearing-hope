const { MongoClient, ObjectId } = require('mongodb');
const { hash } = require('bcryptjs');
const { format, addDays, subDays } = require('date-fns');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: '.env.local' });

// Connection URL - use MongoDB URI from environment variables 
const url = process.env.MONGODB_URI;

if (!url) {
  console.error('MONGODB_URI environment variable is not defined');
  process.exit(1);
}

console.log('Using MongoDB connection string:', url.replace(/\/\/([^:]+):([^@]+)@/, '//****:****@')); // Log masked connection string

// Sample data
const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'password123',
    role: 'SUPER_ADMIN',
    phone: '123-456-7890',
    position: 'System Administrator',
    isActive: true,
    lastLogin: new Date(),
    customPermissions: [],
  },
  {
    name: 'Manager User',
    email: 'manager@example.com',
    password: 'password123',
    role: 'MANAGER',
    phone: '123-456-7891',
    position: 'Project Manager',
    isActive: true,
    lastLogin: new Date(),
    customPermissions: [],
  },
  {
    name: 'Employee One',
    email: 'employee1@example.com',
    password: 'password123',
    role: 'EMPLOYEE',
    phone: '123-456-7892',
    position: 'Developer',
    isActive: true,
    lastLogin: new Date(),
    customPermissions: [],
  },
  {
    name: 'Employee Two',
    email: 'employee2@example.com',
    password: 'password123',
    role: 'EMPLOYEE',
    phone: '123-456-7893',
    position: 'Designer',
    isActive: true,
    lastLogin: new Date(),
    customPermissions: [],
  },
  {
    name: 'Employee Three',
    email: 'employee3@example.com',
    password: 'password123',
    role: 'EMPLOYEE',
    phone: '123-456-7894',
    position: 'QA Engineer',
    isActive: true,
    lastLogin: new Date(),
    customPermissions: [],
  }
];

// Task priorities and types
const priorities = ['HIGH', 'MEDIUM', 'LOW'];
const taskTypes = [
  'DAILY', 'WEEKLY', 'MONTHLY', 
  'DAILY_RECURRING', 'WEEKLY_RECURRING', 'MONTHLY_RECURRING'
];
const statuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'];

// Generate a random task
const generateTask = (userIds, assignedById) => {
  const now = new Date();
  const startDate = subDays(now, Math.floor(Math.random() * 30));
  const dueDate = addDays(startDate, Math.floor(Math.random() * 14) + 1);
  
  // Randomly determine if task is completed
  const isCompleted = Math.random() > 0.5;
  const status = isCompleted ? 'COMPLETED' : statuses[Math.floor(Math.random() * (statuses.length - 1))];
  
  // If completed, set completion date
  const completedDate = isCompleted ? 
    addDays(startDate, Math.floor(Math.random() * (dueDate - startDate) / (1000 * 60 * 60 * 24))) : 
    null;
  
  // Assign to random users (1-3)
  const numAssignees = Math.floor(Math.random() * 3) + 1;
  const assignedTo = [];
  for (let i = 0; i < numAssignees; i++) {
    const randomIndex = Math.floor(Math.random() * userIds.length);
    // Avoid duplicates
    if (!assignedTo.includes(userIds[randomIndex])) {
      assignedTo.push(userIds[randomIndex]);
    }
  }
  
  // Generate progress updates if task is in progress or completed
  const progressUpdates = [];
  if (status === 'IN_PROGRESS' || status === 'COMPLETED') {
    const numUpdates = Math.floor(Math.random() * 3) + 1;
    for (let i = 0; i < numUpdates; i++) {
      progressUpdates.push({
        date: subDays(now, Math.floor(Math.random() * 10)),
        progress: `Progress update ${i + 1}`,
        updatedBy: assignedById
      });
    }
  }
  
  return {
    title: `Task ${Math.floor(Math.random() * 1000)}`,
    description: `This is a ${taskTypes[Math.floor(Math.random() * taskTypes.length)].toLowerCase()} task description.`,
    assignedTo,
    assignedBy: assignedById,
    taskType: taskTypes[Math.floor(Math.random() * taskTypes.length)],
    priority: priorities[Math.floor(Math.random() * priorities.length)],
    status,
    startDate,
    dueDate,
    dateRange: {
      days: ['Monday', 'Wednesday', 'Friday'],
      specificDates: []
    },
    remarks: status === 'COMPLETED' ? 'Task completed successfully' : '',
    progressUpdates,
    completedDate: status === 'COMPLETED' ? completedDate : null,
    createdAt: startDate,
    updatedAt: status === 'COMPLETED' ? completedDate : now
  };
};

// Seed database
async function seedDatabase() {
  let client;
  
  try {
    client = await MongoClient.connect(url);
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing data
    await db.collection('users').deleteMany({});
    await db.collection('tasks').deleteMany({});
    
    // Hash passwords and insert users
    const userPromises = users.map(async user => {
      const hashedPassword = await hash(user.password, 10);
      return {
        ...user,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });
    
    const insertedUsers = await db.collection('users').insertMany(await Promise.all(userPromises));
    console.log(`${insertedUsers.insertedCount} users inserted`);
    
    // Get user IDs
    const userIds = Object.values(insertedUsers.insertedIds);
    const managerUser = await db.collection('users').findOne({ role: 'MANAGER' });
    
    // Create tasks
    const tasks = [];
    for (let i = 0; i < 50; i++) {
      tasks.push(generateTask(userIds, managerUser._id));
    }
    
    const insertedTasks = await db.collection('tasks').insertMany(tasks);
    console.log(`${insertedTasks.insertedCount} tasks inserted`);
    
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    if (client) client.close();
  }
}

// Run the seed function
seedDatabase(); 