import { getDb } from '../../lib/mongodb';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { name, email, message } = req.body;

  // Server-side validation
  const errors = {};
  if (!name || name.trim().length === 0) {
    errors.name = 'Name is required';
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Invalid email address';
  }
  if (!message || message.trim().length === 0) {
    errors.message = 'Message is required';
  }

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  console.log('Contact Form: Processing submission from:', email);

  try {
    // Sanitize inputs
    const sanitizedData = {
      name: name.trim().slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 100),
      message: message.trim().slice(0, 1000),
    };

    // // Store submission in MongoDB
    // const db = await getDb();
    // console.log('Contact Form: Database connected successfully');
    // await db.collection('contact_submissions').insertOne({
    //   ...sanitizedData,
    //   submittedAt: new Date(),
    // });

    // Set up Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // HTML email template
    const emailTemplate = `
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
          .content h2 { color: #4f46e5; font-size: 20px; margin-top: 0; }
          .content p { line-height: 1.6; margin: 10px 0; }
          .field { margin-bottom: 15px; }
          .field strong { color: #4f46e5; }
          .footer { background: #f4f4f4; padding: 20px; text-align: center; font-size: 14px; color: #666; }
          .footer a { color: #4f46e5; text-decoration: none; }
          @media (max-width: 600px) { .content { padding: 20px; } .header h1 { font-size: 20px; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>DevExplained Contact</h1>
          </div>
          <div class="content">
            <h2>{{title}}</h2>
            <div class="field">
              <strong>Name:</strong> {{name}}
            </div>
            <div class="field">
              <strong>Email:</strong> {{email}}
            </div>
            <div class="field">
              <strong>Message:</strong> {{message}}
            </div>
            {{additionalContent}}
          </div>
          <div class="footer">
            <p>&copy; 2025 DevExplained. All rights reserved.</p>
            <p><a href="https://devexplained.vercel.app">Visit our website</a></p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send confirmation email to user
    const userEmail = emailTemplate
      .replace('{{title}}', 'Thank You for Contacting Us!')
      .replace('{{name}}', sanitizedData.name)
      .replace('{{email}}', sanitizedData.email)
      .replace('{{message}}', sanitizedData.message)
      .replace('{{additionalContent}}', '<p>We have received your message and will respond within 1-2 business days.</p>');

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: sanitizedData.email,
      subject: 'Thank You for Your Message - DevExplained',
      html: userEmail,
    });

    // Send notification email to support team
    const supportEmail = emailTemplate
      .replace('{{title}}', 'New Contact Form Submission')
      .replace('{{name}}', sanitizedData.name)
      .replace('{{email}}', sanitizedData.email)
      .replace('{{message}}', sanitizedData.message)
      .replace('{{additionalContent}}', '<p>Please review and respond to this inquiry.</p>');

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New Contact Form Submission from ${sanitizedData.name}`,
      html: supportEmail,
    });

    console.log('Contact Form: Emails sent to:', sanitizedData.email, process.env.EMAIL_USER);

    return res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact Form: Error:', error.message, error.stack);
    return res.status(500).json({ message: 'Failed to process request' });
  }
}