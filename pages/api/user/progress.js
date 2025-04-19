import { getMongoClient } from '../../../lib/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user?.email) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { type, action, id, remove } = req.body;
  if (!type || !action || !id) {
    return res.status(400).json({ message: 'Missing required fields: type, action, id' });
  }

  try {
    const client = await getMongoClient();
    const db = client.db('leetcodesolve');
    const userEmail = session.user.email;

    const validTypes = ['leetcode', 'systemdesign'];
    const validActions = ['viewed', 'solved', 'tagged'];
    if (!validTypes.includes(type) || !validActions.includes(action)) {
      return res.status(400).json({ message: 'Invalid type or action' });
    }

    // Initialize user document if it doesn't exist
    await db.collection('progress').updateOne(
      { email: userEmail },
      {
        $setOnInsert: {
          email: userEmail,
          leetcode: { viewed: [], solved: [], tagged: [] },
          systemdesign: { viewed: [], solved: [], tagged: [] },
        },
      },
      { upsert: true }
    );

    if (action === "all") {
      // Check all progress types for the given ID
      const userProgress = await db.collection('progress').findOne({ email: userEmail });
      const progress = userProgress?.leetcode || { viewed: [], solved: [], tagged: [] };
      return res.status(200).json({
        viewed: progress.viewed.includes(parseInt(id)),
        solved: progress.solved.includes(parseInt(id)),
        tagged: progress.tagged.includes(parseInt(id)),
      });
    }

    // Define the field to update
    const updateField = `${type}.${action}`;

    // Check if ID exists
    if (!remove) {
      const userProgress = await db.collection('progress').findOne({ email: userEmail });
      const progress = userProgress?.[type]?.[action] || [];
      if (progress.includes(parseInt(id))) {
        return res.status(200).json({ message: 'ID already exists' });
      }
    }

    // Update the specific progress field
    const update = remove
      ? { $pull: { [updateField]: parseInt(id) } }
      : { $addToSet: { [updateField]: parseInt(id) } };
    const result = await db.collection('progress').updateOne(
      { email: userEmail },
      update
    );

    if (result.modifiedCount === 0 && result.upsertedCount === 0) {
      return res.status(200).json({
        message: remove ? 'ID not found in progress' : 'No changes made (ID already exists)',
      });
    }

    return res.status(200).json({
      message: remove ? 'Progress removed' : 'Progress updated',
    });
  } catch (error) {
    console.error('Progress update error:', error.message, error.stack);
    return res.status(500).json({ message: 'Internal server error' });
  }
}