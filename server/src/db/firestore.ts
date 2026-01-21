import { getFirestoreAdmin, isProduction } from '../config/firebase-admin.js';
import type { Firestore, DocumentData, QueryDocumentSnapshot } from 'firebase-admin/firestore';

// Collection names
export const COLLECTIONS = {
  USERS: 'users',
  VERIFICATION_CODES: 'verification_codes',
  SESSIONS: 'sessions',
  SPACES: 'spaces',
  SPACE_MEMBERS: 'space_members',
  MEMORIES: 'memories',
  MILESTONES: 'milestones',
  NOTIFICATIONS: 'notifications',
  REACTIONS: 'reactions',
  UNBIND_REQUESTS: 'unbind_requests',
} as const;

export function getFirestore(): Firestore | null {
  return getFirestoreAdmin();
}

// Helper to convert Firestore document to plain object
export function docToObject<T>(doc: QueryDocumentSnapshot<DocumentData>): T {
  return { id: doc.id, ...doc.data() } as T;
}

// Helper to convert snake_case to camelCase for Firestore
export function toCamelCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = obj[key];
  }
  return result;
}

// Helper to convert camelCase to snake_case for SQLite
export function toSnakeCase(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key in obj) {
    const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    result[snakeKey] = obj[key];
  }
  return result;
}

export { isProduction };
