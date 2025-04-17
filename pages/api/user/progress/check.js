import { getMongoClient } from '../../../../lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ message: 'Unauthorized', isPresent: false });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed', isPresent: false });
  }

  const { type, action, id } = req.body;

  // Validate request body
  if (!type || !action) {
    return res.status(400).json({ message: 'Missing required fields: type and action', isPresent: false });
  }

  if (action !== 'all' && !id) {
    return res.status(400).json({ message: 'Missing required field: id for specific actions', isPresent: false });
  }

  try {
    const client = await getMongoClient();
    const db = client.db('leetcodesolve');
    const userEmail = session.user.email;

    const validTypes = ['leetcode', 'systemdesign', 'all'];
    const validActions = ['viewed', 'solved', 'tagged', 'all'];
    if (!validTypes.includes(type) || !validActions.includes(action)) {
      return res.status(400).json({ message: 'Invalid type or action', isPresent: false });
    }

    if (type === 'all' && action === 'all') {
      const progressDoc = await db.collection('progress').findOne({ email: userEmail });
      const allProgress = {};

      if (progressDoc) {
        for (const [key, value] of Object.entries(progressDoc)) {
          if (key !== 'email' && typeof value === 'object') {
            allProgress[key] = {
              viewed: value.viewed || [],
              solved: value.solved || [],
              tagged: value.tagged || [],
            };
          }
        }
      }

      return res.status(200).json(allProgress);
    }

    if (action === 'all') {
      const progressDoc = await db.collection('progress').findOne({ email: userEmail });
      const progress = progressDoc?.[type] || { viewed: [], solved: [], tagged: [] };
      return res.status(200).json({
        viewed: progress.viewed || [],
        solved: progress.solved || [],
        tagged: progress.tagged || [],
      });
    }

    const field = `${type}.${action}`;
    const user = await db.collection('progress').findOne({
      email: userEmail,
      [field]: parseInt(id),
    });

    return res.status(200).json({ isPresent: !!user });
  } catch (error) {
    console.error('Progress check error:', error.message, error.stack);
    return res.status(500).json({ message: 'Internal server error', isPresent: false });
  }
}