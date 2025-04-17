// test-mongo.js
require('dotenv').config({ path: '.env.local' });
const { MongoClient } = require('mongodb');

async function testConnection() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_CONNECTION_STRING is not defined in .env.local');
        return;
    }

    const client = new MongoClient(uri);
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        const db = client.db('leetcodesolve');
        const collections = await db.listCollections().toArray();
        console.log('Collections:', collections);
    } catch (error) {
        console.error('Connection error:', error.message, error.stack);
    } finally {
        await client.close();
    }
}

testConnection();