import { v4 as uuid } from 'uuid';
import { getDatabase } from '../db/database.js';

// JPush API response types
interface JPushSuccessResponse {
  sendno: string;
  msg_id: string;
}

interface JPushErrorResponse {
  error: {
    code: number;
    message: string;
  };
}

type JPushResponse = JPushSuccessResponse | JPushErrorResponse;

// JPush configuration
const JPUSH_APP_KEY = process.env.JPUSH_APP_KEY || '';
const JPUSH_MASTER_SECRET = process.env.JPUSH_MASTER_SECRET || '';
const JPUSH_API_URL = 'https://api.jpush.cn/v3/push';

// JPush initialization state
let jpushInitialized = false;

/**
 * Initialize JPush
 * Returns true if initialization was successful
 */
function initializeJPush(): boolean {
  if (jpushInitialized) return true;

  if (!JPUSH_APP_KEY || !JPUSH_MASTER_SECRET) {
    console.warn('[Push] JPush not configured, push notifications disabled');
    console.warn('[Push] Set JPUSH_APP_KEY and JPUSH_MASTER_SECRET in environment');
    return false;
  }

  jpushInitialized = true;
  console.log('[Push] JPush initialized');
  return true;
}

/**
 * Get JPush authorization header (Basic Auth)
 */
function getJPushAuth(): string {
  const auth = Buffer.from(`${JPUSH_APP_KEY}:${JPUSH_MASTER_SECRET}`).toString('base64');
  return `Basic ${auth}`;
}

/**
 * Register a device token for push notifications
 */
export async function registerDeviceToken(
  userId: string,
  token: string,
  platform: 'android' | 'ios' | 'web' = 'android'
): Promise<void> {
  const db = getDatabase();
  const id = uuid();
  const now = new Date().toISOString();

  await db.createDeviceToken({
    id,
    user_id: userId,
    token,
    platform,
    created_at: now,
    updated_at: now,
  });

  console.log(`[Push] Device token registered for user ${userId}`);
}

/**
 * Unregister device token(s)
 * If token is provided, only that token is removed
 * If token is not provided, all tokens for the user are removed
 */
export async function unregisterDeviceToken(userId: string, token?: string): Promise<void> {
  const db = getDatabase();

  if (token) {
    await db.deleteDeviceToken(userId, token);
    console.log(`[Push] Device token unregistered for user ${userId}`);
  } else {
    await db.deleteDeviceTokensByUserId(userId);
    console.log(`[Push] All device tokens unregistered for user ${userId}`);
  }
}

/**
 * Send push notification to a single user via JPush
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (!initializeJPush()) return;

  const db = getDatabase();
  const tokens = await db.getDeviceTokensByUserId(userId);

  if (tokens.length === 0) {
    console.log(`[Push] No device tokens found for user ${userId}`);
    return;
  }

  // JPush uses registration_id for targeting specific devices
  const registrationIds = tokens.map((t) => t.token);

  const payload = {
    platform: 'all',
    audience: {
      registration_id: registrationIds,
    },
    notification: {
      android: {
        alert: body,
        title: title,
        extras: data || {},
      },
      ios: {
        alert: {
          title: title,
          body: body,
        },
        extras: data || {},
      },
    },
    options: {
      time_to_live: 86400, // 24 hours
      apns_production: process.env.NODE_ENV === 'production',
    },
  };

  try {
    const response = await fetch(JPUSH_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: getJPushAuth(),
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as JPushResponse;

    if (response.ok) {
      const successResult = result as JPushSuccessResponse;
      console.log(`[Push] Sent to ${userId}: msg_id=${successResult.msg_id}`);
    } else {
      console.error(`[Push] Failed to send to ${userId}:`, result);

      // Handle invalid registration IDs (error code 1011)
      const errorResult = result as JPushErrorResponse;
      if (errorResult.error?.code === 1011) {
        // Remove all tokens for this user as they may be invalid
        for (const token of tokens) {
          await db.deleteDeviceToken(userId, token.token);
        }
        console.log(`[Push] Removed invalid tokens for user ${userId}`);
      }
    }
  } catch (error) {
    console.error(`[Push] Failed to send notification to user ${userId}:`, error);
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushNotificationToUsers(
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  for (const userId of userIds) {
    await sendPushNotification(userId, title, body, data);
  }
}
