import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('Missing MONGODB_URI environment variable');
}

const client = new MongoClient(uri, {
  minPoolSize: 2,
  maxPoolSize: 10,
  connectTimeoutMS: 10000,
  serverSelectionTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
});

let clientPromise;

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    console.log('Initializing MongoDB client promise for NextAuth (development)');
    global._mongoClientPromise = client.connect().catch((error) => {
      console.error('MongoDB connection error:', error.message, error.stack);
      throw new Error(`Database connection failed: ${error.message}`);
    });
  }
  clientPromise = global._mongoClientPromise;
} else {
  console.log('Initializing MongoDB client promise for NextAuth (production)');
  clientPromise = client.connect().catch((error) => {
    console.error('MongoDB connection error:', error.message, error.stack);
    throw new Error(`Database connection failed: ${error.message}`);
  });
}

export const authOptions = {
  adapter: MongoDBAdapter(clientPromise, { databaseName: 'leetcodesolve' }),
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
          const client = await clientPromise;
          const db = client.db('leetcodesolve');
          const user = await db.collection('users').findOne({ email: credentials.email });

          if (!user || !user.password) {
            throw new Error('Invalid email or password');
          }

          const bcrypt = await import('bcrypt');
          const isMatch = await bcrypt.compare(credentials.password, user.password);
          if (!isMatch) {
            throw new Error('Invalid email or password');
          }

          console.log('CredentialsProvider: User authorized successfully:', user.email);
          return { id: user._id.toString(), email: user.email, name: user.name };
        } catch (error) {
          console.error('CredentialsProvider: Authorization error:', error.message, error.stack);
          throw new Error(`bad auth: ${error.message}`);
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
  return await NextAuth(req, res, authOptions);
}