import { v4 as uuid } from 'uuid';
import { dbPrepare, saveDatabase } from '../db/index.js';
import { generateToken } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';

interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar: string | null;
  created_at: string;
}

interface VerificationCode {
  id: string;
  phone: string;
  code: string;
  expires_at: string;
  used: number;
}

export function generateVerificationCode(phone: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const id = uuid();

  // Delete any existing codes for this phone
  dbPrepare('DELETE FROM verification_codes WHERE phone = ?').run(phone);

  // Insert new code (expires in 5 minutes)
  dbPrepare(`
    INSERT INTO verification_codes (id, phone, code, expires_at)
    VALUES (?, ?, ?, datetime('now', '+5 minutes'))
  `).run(id, phone, code);

  return code;
}

export function verifyCode(phone: string, code: string): { user: User; token: string } {
  // Find valid code
  const storedCode = dbPrepare(`
    SELECT * FROM verification_codes
    WHERE phone = ? AND code = ? AND used = 0 AND expires_at > datetime('now')
  `).get(phone, code) as VerificationCode | undefined;

  if (!storedCode) {
    throw new AppError(401, 'INVALID_CODE', 'Invalid or expired verification code');
  }

  // Mark code as used
  dbPrepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(storedCode.id);

  // Find or create user
  let user = dbPrepare('SELECT * FROM users WHERE phone = ?').get(phone) as User | undefined;

  if (!user) {
    const userId = uuid();
    dbPrepare(`
      INSERT INTO users (id, phone, nickname) VALUES (?, ?, ?)
    `).run(userId, phone, 'User');

    user = dbPrepare('SELECT * FROM users WHERE id = ?').get(userId) as User;
  }

  // Generate token
  const token = generateToken(user.id);

  return { user, token };
}

export function getUserById(id: string): User | undefined {
  return dbPrepare('SELECT * FROM users WHERE id = ?').get(id) as User | undefined;
}

export function updateUserProfile(
  id: string,
  updates: { nickname?: string; avatar?: string }
): User {
  const fields: string[] = [];
  const values: (string | undefined)[] = [];

  if (updates.nickname !== undefined) {
    fields.push('nickname = ?');
    values.push(updates.nickname);
  }
  if (updates.avatar !== undefined) {
    fields.push('avatar = ?');
    values.push(updates.avatar);
  }

  if (fields.length === 0) {
    const user = getUserById(id);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    return user;
  }

  values.push(id);
  dbPrepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);

  const user = getUserById(id);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  return user;
}
