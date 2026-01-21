import { v4 as uuid } from 'uuid';
import { getDatabase, NotificationData } from '../db/database.js';
import { AppError } from '../middleware/errorHandler.js';

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

  return formatNotification(notification);
}

export async function markAllNotificationsAsRead(userId: string): Promise<number> {
  const db = getDatabase();
  return await db.markAllNotificationsRead(userId);
}
