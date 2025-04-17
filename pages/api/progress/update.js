import { getSession } from 'next-auth/react';
import { getDb } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getSession({ req });
  if (!session || !session.user.email) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const { type, id, status, title } = req.body;
  if (!type || !id || !status || !title) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const db = await getDb();
    const update = {
      $set: {
        [`${type}.$[item]`]: { id, title, status },
        updatedAt: new Date(),
      },
      $setOnInsert: {
        userEmail: session.user.email,
        leetcode: type === 'leetcode' ? [{ id, title, status }] : [],
        systemDesign: type === 'systemDesign' ? [{ id, title, status }] : [],
      },
    };

    const result = await db.collection('progress').updateOne(
      { userEmail: session.user.email, [`${type}.id`]: id },
      update,
      {
        arrayFilters: [{ 'item.id': id }],
        upsert: true,
      }
    );

    if (result.matchedCount === 0 && result.upsertedCount === 0) {
      await db.collection('progress').insertOne({
        userEmail: session.user.email,
        leetcode: type === 'leetcode' ? [{ id, title, status }] : [],
        systemDesign: type === 'systemDesign' ? [{ id, title, status }] : [],
        updatedAt: new Date(),
      });
    }

    return res.status(200).json({ message: 'Progress updated' });
  } catch (error) {
    console.error('Update progress error:', error.message);
    return res.status(500).json({ message: 'Internal server error' });
  }
}