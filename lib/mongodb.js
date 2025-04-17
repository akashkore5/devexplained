import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
console.log('MONGODB_URI:', uri ? uri.replace(/:[^@]+@/, ':****@') : 'Undefined');

if (!uri) {
  throw new Error('Missing MONGODB_URI environment variable');
}

const client = new MongoClient(uri, {
  minPoolSize: 2,
  maxPoolSize: 10,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
});

let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    console.log('Initializing MongoDB client promise (development)');
    global._mongoClientPromise = client.connect().catch((error) => {
      console.error('MongoDB connection error:', error.message, error.stack);
      throw new Error(`Database connection failed: ${error.message}`);
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  console.log('Initializing MongoDB client promise (production)');
  clientPromise = client.connect().catch((error) => {
    console.error('MongoDB connection error:', error.message, error.stack);
    throw new Error(`Database connection failed: ${error.message}`);
  });
}

export async function getMongoClient() {
  console.log('Fetching MongoDB client');
  const connectedClient = await clientPromise;
  console.log('MongoDB client obtained successfully');
  return connectedClient;
}

export async function getDb() {
  console.log('Fetching MongoDB database');
  const client = await getMongoClient();
  const db = client.db('leetcodesolve');
  await db.command({ ping: 1 });
  console.log('MongoDB database ping successful');
  return db;
}