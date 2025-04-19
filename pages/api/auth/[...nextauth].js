import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { getMongoClient, getDb } from '../../../lib/mongodb';
import bcrypt from 'bcrypt';

export const authOptions = {
  adapter: async () => {
    try {
      const client = await getMongoClient();
      return MongoDBAdapter(client, { databaseName: 'leetcodesolve' });
    } catch (error) {
      console.error('NextAuth: Failed to initialize MongoDBAdapter:', error.message);
      // Fallback to no adapter (JWT-only sessions)
      return null;
    }
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('CredentialsProvider: Attempting to authorize user');
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          const db = await getDb();
          const user = await db.collection('users').findOne({ email: credentials.email });

          if (!user || !user.password) {
            throw new Error('Invalid email or password');
          }

          const isMatch = await bcrypt.compare(credentials.password, user.password);
          if (!isMatch) {
            throw new Error('Invalid email or password');
          }

          console.log('CredentialsProvider: User authorized successfully:', user.email);
          return { id: user._id.toString(), email: user.email, name: user.name };
        } catch (error) {
          console.error('CredentialsProvider: Authorization error:', error.message, error.stack);
          throw new Error(`Authentication failed: ${error.message}`);
        }
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.email = user.email;
        token.name = user.name;
      }
      if (account?.provider === 'google') {
        token.googleId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.email) {
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.googleId = token.googleId;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
};

export default async function handler(req, res) {
  console.log(`NextAuth: ${req.method} ${req.url}`, req.query);
  try {
    const options = { ...authOptions };
    options.adapter = await authOptions.adapter();
    return await NextAuth(req, res, options);
  } catch (error) {
    console.error('NextAuth: Handler error:', error.message, error.stack);
    res.status(503).json({
      error: 'Service temporarily unavailable. Please try again later.',
      retryAfter: 30, // Suggest retrying after 30 seconds
    });
  }
}