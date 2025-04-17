// pages/api/test-env.js
export default function handler(req, res) {
    return res.status(200).json({
      MONGODB_URI: process.env.MONGODB_URI ? process.env.MONGODB_URI.replace(/:[^@]+@/, ':****@') : 'Undefined',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'Undefined',
    });
  }