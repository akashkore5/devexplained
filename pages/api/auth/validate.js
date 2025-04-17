import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getSession({ req });
  if (!session || !session.user.email) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  return res.status(200).json({ email: session.user.email });
}