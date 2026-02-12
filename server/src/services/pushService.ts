import admin from 'firebase-admin';
import { v4 as uuid } from 'uuid';
import { existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getDatabase } from '../db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Firebase initialization state
let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK
 * Returns true if initialization was successful
 */
function initializeFirebase(): boolean {
  if (firebaseInitialized) return true;

  // Try to load from local file first, then fall back to environment variable
  const serviceAccountPath = join(__dirname, '../../firebase-service-account.json');
  let credentials: admin.ServiceAccount | null = null;

  if (existsSync(serviceAccountPath)) {
    try {
      const fileContent = readFileSync(serviceAccountPath, 'utf-8');
      credentials = JSON.parse(fileContent);
      console.log('[Push] Loaded Firebase credentials from file');
    } catch (error) {
      console.error('[Push] Failed to read firebase-service-account.json:', error);
    }
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      credentials = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      console.log('[Push] Loaded Firebase credentials from environment variable');
    } catch (error) {
      console.error('[Push] Failed to parse FIREBASE_SERVICE_ACCOUNT:', error);
    }
  }

  if (!credentials) {
    console.warn('[Push] Firebase not configured, push notifications disabled');
    console.warn('[Push] Place firebase-service-account.json in server/ directory');
    return false;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });
    firebaseInitialized = true;
    console.log('[Push] Firebase Admin SDK initialized');
    return true;
  } catch (error) {
    console.error('[Push] Failed to initialize Firebase:', error);
    return false;
  }
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
 * Send push notification to a single user
 */
export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  if (!initializeFirebase()) return;

  const db = getDatabase();
  const tokens = await db.getDeviceTokensByUserId(userId);

  if (tokens.length === 0) {
    console.log(`[Push] No device tokens found for user ${userId}`);
    return;
  }

  const message: admin.messaging.MulticastMessage = {
    tokens: tokens.map((t) => t.token),
    notification: {
      title,
      body,
    },
    data: data || {},
    android: {
      notification: {
        icon: 'ic_notification',
        color: '#FF6B6B',
        channelId: 'default',
      },
    },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);

    console.log(
      `[Push] Sent to ${userId}: ${response.successCount} success, ${response.failureCount} failed`
    );

    // Handle invalid tokens
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errorCode = resp.error?.code;
          // Remove invalid/expired tokens
          if (
            errorCode === 'messaging/registration-token-not-registered' ||
            errorCode === 'messaging/invalid-registration-token'
          ) {
            failedTokens.push(tokens[idx].token);
          }
        }
      });

      // Clean up invalid tokens
      for (const failedToken of failedTokens) {
        await db.deleteDeviceToken(userId, failedToken);
      }

      if (failedTokens.length > 0) {
        console.log(`[Push] Removed ${failedTokens.length} invalid tokens for user ${userId}`);
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
