import { v4 as uuid } from 'uuid';
import { dbPrepare } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';

interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: number;
  action_url: string | null;
}

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

function formatNotification(row: NotificationRow): Notification {
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

export function listNotifications(userId: string): Notification[] {
  const rows = dbPrepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY created_at DESC
  `).all(userId) as NotificationRow[];

  return rows.map(formatNotification);
}

export function getNotificationById(notificationId: string, userId: string): Notification | null {
  const row = dbPrepare(`
    SELECT * FROM notifications
    WHERE id = ? AND user_id = ?
  `).get(notificationId, userId) as NotificationRow | undefined;

  if (!row) return null;

  return formatNotification(row);
}

export function markNotificationAsRead(notificationId: string, userId: string): Notification {
  const existing = getNotificationById(notificationId, userId);
  if (!existing) {
    throw new AppError(404, 'NOTIFICATION_NOT_FOUND', 'Notification not found');
  }

  dbPrepare(`
    UPDATE notifications SET read = 1 WHERE id = ?
  `).run(notificationId);

  return getNotificationById(notificationId, userId)!;
}

export function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  actionUrl?: string
): Notification {
  const id = uuid();

  dbPrepare(`
    INSERT INTO notifications (id, user_id, type, title, message, action_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, type, title, message, actionUrl || null);

  return getNotificationById(id, userId)!;
}
