import { getDb } from '../../../lib/mongodb';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  // Server-side validation
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email address' });
  }

  console.log('Forgot Password: Attempting to process request for:', email);
  try {
    const db = await getDb();
    console.log('Forgot Password: Database connected successfully');

    const user = await db.collection('users').findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      // Don't reveal if the email exists to prevent enumeration attacks
      return res.status(200).json({ message: 'If an account exists, a reset email has been sent.' });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour expiry

    // Store the reset token in the database
    await db.collection('users').updateOne(
      { _id: user._id },
      {
        $set: {
          resetToken,
          resetTokenExpiry,
        },
      }
    );

    // Send the reset email
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request - DevExplained',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; color: #333; }
            .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); overflow: hidden; }
            .header { background: #4f46e5; padding: 20px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
            .content { padding: 30px; }
            .content p { line-height: 1.6; margin: 10px 0; font-size: 16px; }
            .button { display: inline-block; padding: 12px 24px; background: #4f46e5; color: #ffffff !important; text-decoration: none !important; border-radius: 6px; font-weight: 600; margin: 15px 0; }
            .button:hover { background: #4338ca; }
            .footer { background: #f4f4f4; padding: 20px; text-align: center; font-size: 14px; color: #666; }
            .footer a { color: #4f46e5; text-decoration: none; }
            @media (max-width: 600px) {
              .content { padding: 20px; }
              .header h1 { font-size: 20px; }
              .button { padding: 10px 20px; font-size: 14px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>DevExplained</h1>
            </div>
            <div class="content">
              <p>Hello,</p>
              <p>You requested a password reset for your DevExplained account. Click the button below to reset your password:</p>
              <span style="color: #ffffff; text-decoration: none;">
                <a href="${resetUrl}" class="button" style="color: #ffffff !important; text-decoration: none !important;" role="button">Reset Password</a>
              </span>
              <p>This link will expire in 1 hour for your security.</p>
              <p>If you did not request a password reset, please ignore this email or contact us at <a href="mailto:support@devexplained.com">support@devexplained.com</a>.</p>
            </div>
            <div class="footer">
              <p>© 2025 DevExplained. All rights reserved.</p>
              <p><a href="https://devexplained.vercel.app">Visit our website</a> | <a href="https://devexplained.vercel.app/contact">Contact Us</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Forgot Password: Reset email sent to:', email);

    return res.status(200).json({ message: 'If an account exists, a reset email has been sent.' });
  } catch (error) {
    console.error('Forgot Password: Error:', error.message, error.stack);
    return res.status(500).json({ message: `Failed to process request: ${error.message}` });
  }
}