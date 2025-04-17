import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDb } from '../../../lib/mongodb';

async function withRetry(operation, maxRetries = 5, delayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error.message.includes('Client must be connected') && attempt < maxRetries) {
        console.log(`Sign-in: Retry attempt ${attempt} after MongoNotConnectedError`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw error;
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  console.log('Sign-in: Attempting to authenticate user:', email);
  try {
    let db;
    try {
      db = await getDb();
      console.log('Sign-in: Database connected successfully');
    } catch (error) {
      console.error('Sign-in: Initial database connection failed:', error.message);
      throw error;
    }

    // Check if 'users' collection exists with retry
    const collections = await withRetry(async () => {
      return await db.listCollections({ name: 'users' }).toArray();
    });
    if (collections.length === 0) {
      console.log('Sign-in: Users collection does not exist');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = await db.collection('users').findOne({ email });
    if (!user) {
      console.log('Sign-in: User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Sign-in: Password mismatch for user:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { email: user.email, name: user.name },
      process.env.JWT_SECRET || 'm9x8Zf3kQw7rT2pL5vYcN4jH6bK8dM0nX1qW2eR3tU=',
      { expiresIn: '7d' }
    );

    console.log('Sign-in: User authenticated successfully:', email);
    return res.status(200).json({ token, user: { email: user.email, name: user.name } });
  } catch (error) {
    console.error('Sign-in: Error:', error.message, error.stack);
    if (error.message.includes('authentication failed')) {
      return res.status(500).json({ message: 'Database connection failed. Please check MongoDB credentials.' });
    }
    if (error.message.includes('not authorized')) {
      return res.status(500).json({ message: 'Database permission error. Please check MongoDB user permissions.' });
    }
    if (error.message.includes('Client must be connected')) {
      return res.status(500).json({ message: 'Database connection lost. Please try again.' });
    }
    return res.status(500).json({ message: `Sign-in failed: ${error.message}` });
  }
}