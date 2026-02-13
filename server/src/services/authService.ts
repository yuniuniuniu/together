import { v4 as uuid } from 'uuid';
import { getDatabase, UserData } from '../db/database.js';
import { createSession, invalidateSession, invalidateAllUserSessions } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import { createNotification } from './notificationService.js';
import { sendVerificationEmail } from './emailService.js';
import { unregisterDeviceToken } from './pushService.js';

interface User {
  id: string;
  email: string;
  nickname: string;
  avatar: string | null;
  created_at: string;
}

function formatUser(data: UserData): User {
  return {
    id: data.id,
    email: data.email || '',
    nickname: data.nickname,
    avatar: data.avatar,
    created_at: data.created_at,
  };
}

export async function generateVerificationCode(email: string): Promise<string> {
  const db = getDatabase();
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const id = uuid();

  // Delete any existing codes for this email
  await db.deleteVerificationCodesByEmail(email);

  // Insert new code (expires in 5 minutes)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  await db.createVerificationCode({
    id,
    email,
    code,
    expires_at: expiresAt,
    used: 0,
  });

  // Send email with verification code
  try {
    await sendVerificationEmail(email, code);
  } catch (error) {
    console.error('[Auth] Failed to send verification email:', error);
    throw new AppError(500, 'EMAIL_SEND_FAILED', 'Failed to send verification email');
  }

  return code;
}

export async function verifyCode(email: string, code: string): Promise<{ user: User; token: string }> {
  const db = getDatabase();

  // Find valid code
  const storedCode = await db.getVerificationCode(email, code);

  if (!storedCode) {
    throw new AppError(401, 'INVALID_CODE', 'Invalid or expired verification code');
  }

  // Mark code as used
  await db.markVerificationCodeUsed(storedCode.id);

  // Find or create user
  let userData = await db.getUserByEmail(email);

  if (!userData) {
    const userId = uuid();
    userData = await db.createUser({
      id: userId,
      email,
      nickname: 'User',
      avatar: null,
      created_at: new Date().toISOString(),
    });
  }

  // Create session and generate token
  const token = await createSession(userData.id);

  return { user: formatUser(userData), token };
}

export async function getUserById(id: string): Promise<User | undefined> {
  const db = getDatabase();
  const userData = await db.getUserById(id);
  return userData ? formatUser(userData) : undefined;
}

export async function updateUserProfile(
  id: string,
  updates: { nickname?: string; avatar?: string }
): Promise<User> {
  const db = getDatabase();

  if (Object.keys(updates).length === 0) {
    const user = await getUserById(id);
    if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    return user;
  }

  // Get old user data for comparison
  const oldUserData = await db.getUserById(id);

  const userData = await db.updateUser(id, updates);
  if (!userData) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

  // Notify partner about profile changes
  const spaceMember = await db.getSpaceMemberByUserId(id);
  if (spaceMember) {
    const spaceMembers = await db.getSpaceMembersBySpaceId(spaceMember.space_id);
    for (const member of spaceMembers) {
      if (member.user_id !== id) {
        // Check what changed
        if (updates.nickname && oldUserData && updates.nickname !== oldUserData.nickname) {
          await createNotification(
            member.user_id,
            'profile',
            `${oldUserData.nickname} changed their name`,
            `Now goes by "${updates.nickname}"`,
            '/settings'
          );
        }
        if (updates.avatar && oldUserData && updates.avatar !== oldUserData.avatar) {
          await createNotification(
            member.user_id,
            'profile',
            `${userData.nickname} updated their photo`,
            'Check out their new look!',
            '/settings'
          );
        }
      }
    }
  }

  return formatUser(userData);
}

// Logout - invalidate current session
export async function logout(sessionId: string, deviceToken?: string): Promise<void> {
  // Unregister device token if provided
  if (deviceToken) {
    const db = getDatabase();
    const session = await db.getSessionByToken(sessionId);
    if (session) {
      await unregisterDeviceToken(session.user_id, deviceToken);
    }
  }
  await invalidateSession(sessionId);
}

// Logout from all devices
export async function logoutAllDevices(userId: string): Promise<void> {
  // Unregister all device tokens for this user
  await unregisterDeviceToken(userId);
  await invalidateAllUserSessions(userId);
}
