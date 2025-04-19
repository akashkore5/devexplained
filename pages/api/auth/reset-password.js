import { getDb } from '../../../lib/mongodb';
import bcrypt from 'bcrypt';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token, email, password } = req.body;

  // Server-side validation
  if (!token || !email || !password) {
    return res.status(400).json({ message: 'Token, email, and password are required' });
  }
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password)) {
    return res.status(400).json({ message: 'Password must be 8+ characters with uppercase, lowercase, number, and special character' });
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

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: { password: hashedPassword },
        $unset: { resetToken: "", resetTokenExpiry: "" },
      }
    );

    console.log('Reset Password: Password reset successfully for:', email);
    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset Password: Error:', error.message, error.stack);
    return res.status(500).json({ message: `Failed to reset password: ${error.message}` });
  }
}