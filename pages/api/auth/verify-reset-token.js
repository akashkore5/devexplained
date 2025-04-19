import { getDb } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token, email } = req.body;

  if (!token || !email) {
    return res.status(400).json({ message: 'Token and email are required' });
  }

  try {
    const db = await getDb();
    const user = await db.collection('users').findOne({
      email: email.trim().toLowerCase(),
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    return res.status(200).json({ message: 'Token is valid' });
  } catch (error) {
    console.error('Verify Reset Token: Error:', error.message, error.stack);
    return res.status(500).json({ message: `Failed to verify token: ${error.message}` });
  }
}