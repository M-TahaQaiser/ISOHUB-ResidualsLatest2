import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const PgSession = connectPgSimple(session);

// Get session secret from environment
const getSessionSecret = () => {
  const secret = process.env.JWT_SECRET; // Reuse JWT_SECRET for session signing
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required for session security');
  }
  return secret;
};

// Configure PostgreSQL session store
const sessionStore = new PgSession({
  // Use raw connection from Drizzle's client
  pool: (db as any)._.session.client,
  tableName: 'sessions',
  createTableIfMissing: false, // Table already exists in schema
});

// Production-grade session configuration
export const sessionMiddleware = session({
  store: sessionStore,
  secret: getSessionSecret(),
  resave: false,
  saveUninitialized: false,
  name: 'isohub.sid', // Custom cookie name
  cookie: {
    httpOnly: true, // Prevents JavaScript access - XSS protection
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict', // CSRF protection
  },
});

// Extend session interface for TypeScript
declare module 'express-session' {
  interface SessionData {
    businessOwnerId?: string;
    loginTime?: number;
  }
}
