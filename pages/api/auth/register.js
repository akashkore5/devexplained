import bcrypt from 'bcrypt';
import { getDb } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, mobile, password } = req.body;

  // Server-side validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }
  if (!password || !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
    return res.status(400).json({ message: 'Password must be 8+ characters with uppercase, lowercase, number, and special character' });
  }
  if (!name || !/^[a-zA-Z\s]{2,50}$/.test(name)) {
    return res.status(400).json({ message: 'Name must be 2–50 alphabetic characters' });
  }
  if (mobile && !/^\+?[\d-]{7,15}$/.test(mobile)) {
    return res.status(400).json({ message: 'Invalid mobile number' });
  }

  console.log('Register: Attempting to register user:', email);
  try {
    const db = await getDb();
    console.log('Register: Database connected successfully');

    // Check if 'users' collection exists
    const collections = await db.listCollections({ name: 'users' }).toArray();
    if (collections.length === 0) {
      console.log('Register: Creating users collection');
      await db.createCollection('users');
    }

    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      console.log('Register: User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      _id: new ObjectId(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      mobile: mobile ? mobile.trim() : null,
      password: hashedPassword,
      createdAt: new Date(),
    };

    await db.collection('users').insertOne(user);

    console.log('Register: User registered successfully:', email);
    return res.status(201).json({ message: 'User registered successfully', userId: user._id.toString() });
  } catch (error) {
    console.error('Register: Error:', error.message, error.stack);
    if (error.message.includes('authentication failed')) {
      return res.status(500).json({ message: 'Database connection failed. Please check MongoDB credentials.' });
    }
    if (error.message.includes('not authorized')) {
      return res.status(500).json({ message: 'Database permission error. Please check MongoDB user permissions.' });
    }
    if (error.message.includes('Client must be connected')) {
      return res.status(500).json({ message: 'Database connection lost. Please try again.' });
    }
    return res.status(500).json({ message: `Registration failed: ${error.message}` });
  }
}