import { getSession } from 'next-auth/react';
import { getDb } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getSession({ req });
  if (!session || !session.user.email) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const db = await getDb();
    const progress = await db.collection('progress').findOne({ userEmail: session.user.email });

    return res.status(200).json({
      progress: progress || { leetcode: [], systemDesign: [] },
    });
  } catch (error) {
    console.error('Fetch progress error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}