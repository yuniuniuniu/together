import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import { getDatabase } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

export interface AuthUser {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
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
    const user = await db.getUserById(payload.userId);

    if (!user) {
      next(new AppError(401, 'USER_NOT_FOUND', 'User not found'));
      return;
    }

    req.user = {
      id: user.id,
      phone: user.phone || '',
      nickname: user.nickname,
      avatar: user.avatar || undefined,
    };
    next();
  } catch {
    next(new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token'));
  }
}

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}
