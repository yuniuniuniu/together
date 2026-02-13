import { v4 as uuid } from 'uuid';
import { getDatabase, NotificationData } from '../db/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { sendPushNotification } from './pushService.js';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

function formatNotification(row: NotificationData): Notification {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    createdAt: row.created_at,
    read: row.read === 1,
    actionUrl: row.action_url || undefined,
  };
}

export async function listNotifications(userId: string): Promise<Notification[]> {
  const db = getDatabase();
  const notifications = await db.listNotificationsByUserId(userId);
  return notifications.map(formatNotification);
}

export async function getNotificationById(notificationId: string, userId: string): Promise<Notification | null> {
  const db = getDatabase();
  const notification = await db.getNotificationById(notificationId);

  if (!notification || notification.user_id !== userId) return null;

  return formatNotification(notification);
}

export async function markNotificationAsRead(notificationId: string, userId: string): Promise<Notification> {
  const existing = await getNotificationById(notificationId, userId);
  if (!existing) {
    throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
  }

  const db = getDatabase();
  const notification = await db.markNotificationRead(notificationId);
  if (!notification) {
    throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
  }

  return formatNotification(notification);
}

export async function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  actionUrl?: string
): Promise<Notification> {
  const db = getDatabase();
  const id = uuid();

  const notification = await db.createNotification({
    id,
    user_id: userId,
    type,
    title,
    message,
    created_at: new Date().toISOString(),
    read: 0,
    action_url: actionUrl || null,
  });

  // Send push notification asynchronously (don't block the main flow)
  // Only vibrate for heartbeat notifications
  const shouldVibrate = type === 'heartbeat';
  sendPushNotification(userId, title, message, {
    type,
    notificationId: id,
    actionUrl: actionUrl || '',
  }, { vibrate: shouldVibrate }).catch((err) => {
    console.error('[Notification] Push notification failed:', err);
  });

  return formatNotification(notification);
}

export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const db = getDatabase();
  return await db.markAllNotificationsRead(userId);
}

export async function sendHeartbeat(userId: string): Promise<void> {
  const db = getDatabase();

  // Get user's space membership
  const membership = await db.getSpaceMemberByUserId(userId);
  if (!membership) {
    throw new AppError(400, 'NOT_IN_SPACE', 'User is not in a space');
  }

  // Get all members in the space
  const members = await db.getSpaceMembersBySpaceId(membership.space_id);
  if (members.length < 2) {
    throw new AppError(400, 'NO_PARTNER', 'No partner in space yet');
  }

  // Get sender's info
  const sender = await db.getUserById(userId);
  if (!sender) {
    throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
  }

  // Send notification to partner(s)
  // TODO: Remove self-notification after testing
  const testMode = true; // Set to false for production
  for (const member of members) {
    if (member.user_id !== userId || testMode) {
      await createNotification(
        testMode ? userId : member.user_id,
        'heartbeat',
        `💕 ${sender.nickname}想你了`,
        '',
        '/dashboard'
      );
      if (testMode) break; // Only send one notification in test mode
    }
  }
}
