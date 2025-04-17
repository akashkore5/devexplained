import { getMongoClient } from '../../../../lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: 'Unauthorized', isViewed: false });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed', isViewed: false });
  }

  const { type, action, id } = req.body;
  if (!type || !action || !id) {
    return res.status(400).json({ message: 'Missing required fields', isViewed: false });
  }

  try {
    const client = await getMongoClient();
    const db = client.db('leetcodesolve');
    const userEmail = session.user.email;

    const validTypes = ['leetcode', 'systemdesign'];
    const validActions = ['viewed', 'solved', 'tagged'];
    if (!validTypes.includes(type) || !validActions.includes(action)) {
      return res.status(400).json({ message: 'Invalid type or action', isViewed: false });
    }

    const field = action === 'tagged' ? `${type}tagged` : `${type}.${action}`;
    const user = await db.collection('users').findOne({
      email: userEmail,
      [field]: parseInt(id),
    });

    return res.status(200).json({ isViewed: !!user });
  } catch (error) {
    console.error('Progress check error:', error.message, error.stack);
    return res.status(500).json({ message: 'Internal server error', isViewed: false });
  }
}