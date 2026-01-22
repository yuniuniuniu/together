import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { AppError } from './errorHandler.js';
import { getDatabase } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const TOKEN_EXPIRY_DAYS = 7;

export interface AuthUser {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  sessionId?: string;
}

export async function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new AppError(401, 'UNAUTHORIZED', 'Missing or invalid authorization header'));
    return;
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };

    const db = getDatabase();

    // Check if session exists and is valid
    const session = await db.getSessionByToken(token);
    if (!session) {
      next(new AppError(401, 'SESSION_EXPIRED', 'Session has expired or been invalidated'));
      return;
    }

    const user = await db.getUserById(payload.userId);

    if (!user) {
      next(new AppError(401, 'USER_NOT_FOUND', 'User not found'));
      return;
    }

    req.user = {
      id: user.id,
      phone: user.email || '',
      nickname: user.nickname,
      avatar: user.avatar || undefined,
    };
    req.sessionId = session.id;
    next();
  } catch {
    next(new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token'));
  }
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: `${TOKEN_EXPIRY_DAYS}d` });
}

// Create a session and return the token
export async function createSession(userId: string): Promise<string> {
  const db = getDatabase();
  const token = generateToken(userId);
  const sessionId = uuid();

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXPIRY_DAYS);

  await db.createSession({
    id: sessionId,
    user_id: userId,
    token,
    created_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  return token;
}

// Invalidate a session (logout)
export async function invalidateSession(sessionId: string): Promise<void> {
  const db = getDatabase();
  await db.deleteSession(sessionId);
}

// Invalidate all sessions for a user
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  const db = getDatabase();
  await db.deleteSessionsByUserId(userId);
}

// Clean up expired sessions (call periodically)
export async function cleanupExpiredSessions(): Promise<void> {
  const db = getDatabase();
  await db.deleteExpiredSessions();
}
