/**
 * Simple MongoDB Connection Test
 * Run with: node scripts/simple-mongo-test.js
 */

console.log('Starting MongoDB connection test...');

// Replace these with your updated credentials from MongoDB Atlas
const username = 'saksham27verma'; // Keep the same unless you changed it
const password = 'chinku270305'; // Updated password
const cluster = 'hearing-hope.gw9iezs.mongodb.net';
const database = 'hearing-hope';

const uri = `mongodb+srv://${username}:${password}@${cluster}/${database}?retryWrites=true&w=majority`;
console.log('Connection string without sensitive info:', 
  uri.replace(password, '******'));

const { MongoClient } = require('mongodb');
const client = new MongoClient(uri);

async function run() {
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('✅ Connected successfully to MongoDB Atlas!');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    
    // Provide helpful guidance
    if (err.message && err.message.includes('bad auth')) {
      console.log('\n🔑 Authentication Error Guidance:');
      console.log('1. Login to MongoDB Atlas at https://cloud.mongodb.com');
      console.log('2. Go to Database Access and edit your user');
      console.log('3. Reset the password to something simple (no special characters)');
      console.log('4. Make sure Network Access allows your current IP address');
      console.log('5. Update this script with the new password and try again');
    }
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

run().catch(console.error); 