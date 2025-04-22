/**
 * Small script to test MongoDB Atlas connection
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
console.log('Using connection string:', uri);

const client = new MongoClient(uri);

async function run() {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('Connected successfully to MongoDB Atlas');
    const databases = await client.db().admin().listDatabases();
    console.log('Available databases:');
    databases.databases.forEach(db => console.log(` - ${db.name}`));
  } catch (err) {
    console.error('MongoDB connection error:', err);
  } finally {
    await client.close();
  }
}

run().catch(console.error); 