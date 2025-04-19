import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
console.log('MONGODB_URI:', uri ? uri.replace(/:[^@]+@/, ':****@') : 'Undefined');

if (!uri) {
  throw new Error('Missing MONGODB_URI environment variable');
}

const client = new MongoClient(uri, {
  minPoolSize: 2,
  maxPoolSize: 10,
  connectTimeoutMS: 30000, // 30s for Vercel cold starts
  serverSelectionTimeoutMS: 30000, // 30s for server selection
  socketTimeoutMS: 45000, // 45s for socket operations
  retryWrites: true,
  retryReads: true,
});

let clientPromise;

// Exponential backoff retry logic
async function connectWithRetry(client, maxRetries = 5, baseDelay = 2000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`MongoDB: Attempting connection (attempt ${attempt}/${maxRetries})`);
      await client.connect();
      console.log('MongoDB: Connection established');
      return client;
    } catch (error) {
      lastError = error;
      console.error(`MongoDB: Connection attempt ${attempt} failed:`, error.message);
      if (attempt === maxRetries) {
        console.error('MongoDB: All connection attempts failed');
        throw new Error(`Database connection failed after ${maxRetries} attempts: ${error.message}`);
      }
      // Exponential backoff: delay = baseDelay * 2^(attempt-1)
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`MongoDB: Retrying after ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError; // Should never reach here
}

// Handle connection in development vs production
if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    console.log('MongoDB: Initializing client promise (development)');
    global._mongoClientPromise = connectWithRetry(client);
  }
  clientPromise = global._mongoClientPromise;
} else {
  console.log('MongoDB: Initializing client promise (production)');
  clientPromise = connectWithRetry(client);
}

// Graceful client retrieval with fallback
export async function getMongoClient() {
  try {
    console.log('MongoDB: Fetching client');
    const connectedClient = await clientPromise;
    console.log('MongoDB: Client obtained successfully');
    return connectedClient;
  } catch (error) {
    console.error('MongoDB: Failed to fetch client:', error.message, error.stack);
    throw new Error('Unable to connect to database');
  }
}

// Database access with health check
export async function getDb() {
  try {
    console.log('MongoDB: Fetching database');
    const client = await getMongoClient();
    const db = client.db('leetcodesolve');
    await db.command({ ping: 1 }).catch((error) => {
      console.error('MongoDB: Ping failed:', error.message);
      throw new Error('Database ping failed');
    });
    console.log('MongoDB: Database ping successful');
    return db;
  } catch (error) {
    console.error('MongoDB: Failed to fetch database:', error.message, error.stack);
    throw new Error('Unable to access database');
  }
}

// Cleanup on process termination
process.on('SIGINT', async () => {
  console.log('MongoDB: Closing client on process termination');
  await client.close();
  process.exit(0);
});