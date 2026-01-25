import {
  DatabaseAdapter,
  UserData,
  VerificationCodeData,
  SpaceData,
  SpaceMemberData,
  MemoryData,
  MilestoneData,
  NotificationData,
  ReactionData,
  UnbindRequestData,
  SessionData,
} from './adapter.js';
import { getFirestoreAdmin } from '../config/firebase-admin.js';
import { COLLECTIONS } from './firestore.js';
import type { Firestore, Timestamp } from 'firebase-admin/firestore';

// Helper to convert Firestore Timestamp to ISO string
function timestampToString(timestamp: Timestamp | string | undefined): string {
  if (!timestamp) return new Date().toISOString();
  if (typeof timestamp === 'string') return timestamp;
  return timestamp.toDate().toISOString();
}

// Helper to get Firestore instance with error handling
function getDb(): Firestore {
  const db = getFirestoreAdmin();
  if (!db) {
    throw new Error('Firestore not initialized. Make sure NODE_ENV=production');
  }
  return db;
}

export class FirestoreAdapter implements DatabaseAdapter {
  // Users
  async createUser(user: UserData): Promise<UserData> {
    const db = getDb();
    const userData = {
      ...user,
      created_at: user.created_at || new Date().toISOString(),
      is_deleted: 0,
    };
    await db.collection(COLLECTIONS.USERS).doc(user.id).set(userData);
    return userData;
  }

  async getUserById(id: string): Promise<UserData | null> {
    const db = getDb();
    const doc = await db.collection(COLLECTIONS.USERS).doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    if (data.is_deleted === 1) return null;
    return {
      id: doc.id,
      email: data.email,
      nickname: data.nickname,
      avatar: data.avatar,
      created_at: timestampToString(data.created_at),
      is_deleted: data.is_deleted || 0,
    };
  }

  async getUserByEmail(email: string): Promise<UserData | null> {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.USERS).where('email', '==', email).where('is_deleted', '==', 0).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      email: data.email,
      nickname: data.nickname,
      avatar: data.avatar,
      created_at: timestampToString(data.created_at),
      is_deleted: data.is_deleted || 0,
    };
  }

  async updateUser(id: string, updates: Partial<UserData>): Promise<UserData | null> {
    const db = getDb();
    const updateData: Record<string, unknown> = {};
    if (updates.nickname !== undefined) updateData.nickname = updates.nickname;
    if (updates.avatar !== undefined) updateData.avatar = updates.avatar;
    if (updates.email !== undefined) updateData.email = updates.email;

    if (Object.keys(updateData).length > 0) {
      await db.collection(COLLECTIONS.USERS).doc(id).update(updateData);
    }
    return this.getUserById(id);
  }

  // Verification Codes
  async createVerificationCode(code: VerificationCodeData): Promise<void> {
    const db = getDb();
    await db.collection(COLLECTIONS.VERIFICATION_CODES).doc(code.id).set({ ...code, is_deleted: 0 });
  }

  async getVerificationCode(email: string, code: string): Promise<VerificationCodeData | null> {
    const db = getDb();
    const now = new Date().toISOString();
    const snapshot = await db
      .collection(COLLECTIONS.VERIFICATION_CODES)
      .where('email', '==', email)
      .where('code', '==', code)
      .where('used', '==', 0)
      .where('is_deleted', '==', 0)
      .where('expires_at', '>', now)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as VerificationCodeData;
  }

  async markVerificationCodeUsed(id: string): Promise<void> {
    const db = getDb();
    await db.collection(COLLECTIONS.VERIFICATION_CODES).doc(id).update({ used: 1 });
  }

  async deleteVerificationCodesByEmail(email: string): Promise<void> {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.VERIFICATION_CODES).where('email', '==', email).where('is_deleted', '==', 0).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.update(doc.ref, { is_deleted: 1 }));
    await batch.commit();
  }

  // Spaces
  async createSpace(space: SpaceData): Promise<SpaceData> {
    const db = getDb();
    const spaceData = {
      ...space,
      created_at: space.created_at || new Date().toISOString(),
      is_deleted: 0,
    };
    await db.collection(COLLECTIONS.SPACES).doc(space.id).set(spaceData);
    return spaceData;
  }

  async getSpaceById(id: string): Promise<SpaceData | null> {
    const db = getDb();
    const doc = await db.collection(COLLECTIONS.SPACES).doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    if (data.is_deleted === 1) return null;
    return {
      id: doc.id,
      created_at: timestampToString(data.created_at),
      anniversary_date: data.anniversary_date,
      invite_code: data.invite_code,
      is_deleted: data.is_deleted || 0,
    };
  }

  async getSpaceByInviteCode(inviteCode: string): Promise<SpaceData | null> {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.SPACES).where('invite_code', '==', inviteCode).where('is_deleted', '==', 0).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      created_at: timestampToString(data.created_at),
      anniversary_date: data.anniversary_date,
      invite_code: data.invite_code,
      is_deleted: data.is_deleted || 0,
    };
  }

  async deleteSpace(id: string): Promise<void> {
    const db = getDb();
    await db.collection(COLLECTIONS.SPACES).doc(id).update({ is_deleted: 1 });
  }

  async getAllSpaces(): Promise<SpaceData[]> {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.SPACES).where('is_deleted', '==', 0).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        created_at: timestampToString(data.created_at),
        anniversary_date: data.anniversary_date,
        invite_code: data.invite_code,
        is_deleted: data.is_deleted || 0,
      };
    });
  }

  // Space Members
  async addSpaceMember(member: SpaceMemberData): Promise<void> {
    const db = getDb();
    const docId = `${member.space_id}_${member.user_id}`;
    await db.collection(COLLECTIONS.SPACE_MEMBERS).doc(docId).set({
      ...member,
      joined_at: member.joined_at || new Date().toISOString(),
      is_deleted: 0,
    });
  }

  async getSpaceMembersBySpaceId(spaceId: string): Promise<SpaceMemberData[]> {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.SPACE_MEMBERS).where('space_id', '==', spaceId).where('is_deleted', '==', 0).get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        space_id: data.space_id,
        user_id: data.user_id,
        joined_at: timestampToString(data.joined_at),
        is_deleted: data.is_deleted || 0,
      };
    });
  }

  async getSpaceMemberByUserId(userId: string): Promise<SpaceMemberData | null> {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.SPACE_MEMBERS).where('user_id', '==', userId).where('is_deleted', '==', 0).limit(1).get();
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      space_id: data.space_id,
      user_id: data.user_id,
      joined_at: timestampToString(data.joined_at),
      is_deleted: data.is_deleted || 0,
    };
  }

  async countSpaceMembers(spaceId: string): Promise<number> {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.SPACE_MEMBERS).where('space_id', '==', spaceId).where('is_deleted', '==', 0).count().get();
    return snapshot.data().count;
  }

  async deleteSpaceMembersBySpaceId(spaceId: string): Promise<void> {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.SPACE_MEMBERS).where('space_id', '==', spaceId).where('is_deleted', '==', 0).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.update(doc.ref, { is_deleted: 1 }));
    await batch.commit();
  }

  async updateSpaceMember(spaceId: string, userId: string, updates: Partial<SpaceMemberData>): Promise<SpaceMemberData | null> {
    const db = getDb();
    const docId = `${spaceId}_${userId}`;
    const updateData: Record<string, unknown> = {};

    if (updates.joined_at !== undefined) updateData.joined_at = updates.joined_at;

    if (Object.keys(updateData).length > 0) {
      await db.collection(COLLECTIONS.SPACE_MEMBERS).doc(docId).update(updateData);
    }

    const doc = await db.collection(COLLECTIONS.SPACE_MEMBERS).doc(docId).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    if (data.is_deleted === 1) return null;
    return {
      space_id: data.space_id,
      user_id: data.user_id,
      joined_at: timestampToString(data.joined_at),
      is_deleted: data.is_deleted || 0,
    };
  }

  // Sessions
  async createSession(session: SessionData): Promise<SessionData> {
    const db = getDb();
    const sessionData = {
      ...session,
      created_at: session.created_at || new Date().toISOString(),
      is_deleted: 0,
    };
    await db.collection(COLLECTIONS.SESSIONS).doc(session.id).set(sessionData);
    return sessionData;
  }

  async getSessionByToken(token: string): Promise<SessionData | null> {
    const db = getDb();
    const now = new Date().toISOString();
    const snapshot = await db
      .collection(COLLECTIONS.SESSIONS)
      .where('token', '==', token)
      .where('is_deleted', '==', 0)
      .where('expires_at', '>', now)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      user_id: data.user_id,
      token: data.token,
      created_at: timestampToString(data.created_at),
      expires_at: data.expires_at,
      is_deleted: data.is_deleted || 0,
    };
  }

  async updateSessionToken(id: string, newToken: string, newExpiresAt: string): Promise<void> {
    const db = getDb();
    await db.collection(COLLECTIONS.SESSIONS).doc(id).update({
      token: newToken,
      expires_at: newExpiresAt,
    });
  }

  async deleteSession(id: string): Promise<void> {
    const db = getDb();
    await db.collection(COLLECTIONS.SESSIONS).doc(id).update({ is_deleted: 1 });
  }

  async deleteSessionsByUserId(userId: string): Promise<void> {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.SESSIONS).where('user_id', '==', userId).where('is_deleted', '==', 0).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.update(doc.ref, { is_deleted: 1 }));
    await batch.commit();
  }

  async deleteExpiredSessions(): Promise<void> {
    const db = getDb();
    const now = new Date().toISOString();
    const snapshot = await db.collection(COLLECTIONS.SESSIONS).where('expires_at', '<=', now).where('is_deleted', '==', 0).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.update(doc.ref, { is_deleted: 1 }));
    await batch.commit();
  }

  // Memories
  async createMemory(memory: MemoryData): Promise<MemoryData> {
    const db = getDb();
    const memoryData = {
      ...memory,
      created_at: memory.created_at || new Date().toISOString(),
      is_deleted: 0,
    };
    await db.collection(COLLECTIONS.MEMORIES).doc(memory.id).set(memoryData);
    return memoryData;
  }

  async getMemoryById(id: string): Promise<MemoryData | null> {
    const db = getDb();
    const doc = await db.collection(COLLECTIONS.MEMORIES).doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    if (data.is_deleted === 1) return null;
    return {
      id: doc.id,
      space_id: data.space_id,
      content: data.content,
      mood: data.mood,
      photos: data.photos,
      location: data.location,
      voice_note: data.voice_note,
      stickers: data.stickers,
      created_at: timestampToString(data.created_at),
      created_by: data.created_by,
      word_count: data.word_count,
      is_deleted: data.is_deleted || 0,
    };
  }

  async listMemoriesBySpaceId(spaceId: string, limit: number, offset: number): Promise<MemoryData[]> {
    const db = getDb();
    // Note: Firestore doesn't support offset directly, we use cursor-based pagination
    // For simplicity, we'll fetch limit + offset and skip the first offset items
    const snapshot = await db
      .collection(COLLECTIONS.MEMORIES)
      .where('space_id', '==', spaceId)
      .where('is_deleted', '==', 0)
      .orderBy('created_at', 'desc')
      .limit(limit + offset)
      .get();

    return snapshot.docs.slice(offset).map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        space_id: data.space_id,
        content: data.content,
        mood: data.mood,
        photos: data.photos,
        location: data.location,
        voice_note: data.voice_note,
        stickers: data.stickers,
        created_at: timestampToString(data.created_at),
        created_by: data.created_by,
        word_count: data.word_count,
        is_deleted: data.is_deleted || 0,
      };
    });
  }

  async countMemoriesBySpaceId(spaceId: string): Promise<number> {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.MEMORIES).where('space_id', '==', spaceId).where('is_deleted', '==', 0).count().get();
    return snapshot.data().count;
  }

  async updateMemory(id: string, updates: Partial<MemoryData>): Promise<MemoryData | null> {
    const db = getDb();
    const updateData: Record<string, unknown> = {};
    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.mood !== undefined) updateData.mood = updates.mood;
    if (updates.photos !== undefined) updateData.photos = updates.photos;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.voice_note !== undefined) updateData.voice_note = updates.voice_note;
    if (updates.stickers !== undefined) updateData.stickers = updates.stickers;
    if (updates.word_count !== undefined) updateData.word_count = updates.word_count;

    if (Object.keys(updateData).length > 0) {
      await db.collection(COLLECTIONS.MEMORIES).doc(id).update(updateData);
    }
    return this.getMemoryById(id);
  }

  async deleteMemory(id: string): Promise<void> {
    const db = getDb();
    await db.collection(COLLECTIONS.MEMORIES).doc(id).update({ is_deleted: 1 });
  }

  async deleteMemoriesBySpaceId(spaceId: string): Promise<void> {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.MEMORIES).where('space_id', '==', spaceId).where('is_deleted', '==', 0).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.update(doc.ref, { is_deleted: 1 }));
    await batch.commit();
  }

  // Milestones
  async createMilestone(milestone: MilestoneData): Promise<MilestoneData> {
    const db = getDb();
    const milestoneData = {
      ...milestone,
      created_at: milestone.created_at || new Date().toISOString(),
      is_deleted: 0,
    };
    await db.collection(COLLECTIONS.MILESTONES).doc(milestone.id).set(milestoneData);
    return milestoneData;
  }

  async getMilestoneById(id: string): Promise<MilestoneData | null> {
    const db = getDb();
    const doc = await db.collection(COLLECTIONS.MILESTONES).doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    if (data.is_deleted === 1) return null;
    return {
      id: doc.id,
      space_id: data.space_id,
      title: data.title,
      description: data.description,
      date: data.date,
      type: data.type,
      icon: data.icon,
      photos: data.photos,
      location: data.location || null,
      created_at: timestampToString(data.created_at),
      created_by: data.created_by,
      is_deleted: data.is_deleted || 0,
    };
  }

  async listMilestonesBySpaceId(spaceId: string): Promise<MilestoneData[]> {
    const db = getDb();
    const snapshot = await db
      .collection(COLLECTIONS.MILESTONES)
      .where('space_id', '==', spaceId)
      .where('is_deleted', '==', 0)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        space_id: data.space_id,
        title: data.title,
        description: data.description,
        date: data.date,
        type: data.type,
        icon: data.icon,
        photos: data.photos,
        location: data.location || null,
        created_at: timestampToString(data.created_at),
        created_by: data.created_by,
        is_deleted: data.is_deleted || 0,
      };
    });
  }

  async updateMilestone(id: string, updates: Partial<MilestoneData>): Promise<MilestoneData | null> {
    const db = getDb();
    const updateData: Record<string, unknown> = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.date !== undefined) updateData.date = updates.date;
    if (updates.type !== undefined) updateData.type = updates.type;
    if (updates.icon !== undefined) updateData.icon = updates.icon;
    if (updates.photos !== undefined) updateData.photos = updates.photos;
    if (updates.location !== undefined) updateData.location = updates.location;

    if (Object.keys(updateData).length > 0) {
      await db.collection(COLLECTIONS.MILESTONES).doc(id).update(updateData);
    }
    return this.getMilestoneById(id);
  }

  async deleteMilestone(id: string): Promise<void> {
    const db = getDb();
    await db.collection(COLLECTIONS.MILESTONES).doc(id).update({ is_deleted: 1 });
  }

  async deleteMilestonesBySpaceId(spaceId: string): Promise<void> {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.MILESTONES).where('space_id', '==', spaceId).where('is_deleted', '==', 0).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.update(doc.ref, { is_deleted: 1 }));
    await batch.commit();
  }

  // Notifications
  async createNotification(notification: NotificationData): Promise<NotificationData> {
    const db = getDb();
    const notificationData = {
      ...notification,
      created_at: notification.created_at || new Date().toISOString(),
      is_deleted: 0,
    };
    await db.collection(COLLECTIONS.NOTIFICATIONS).doc(notification.id).set(notificationData);
    return notificationData;
  }

  async getNotificationById(id: string): Promise<NotificationData | null> {
    const db = getDb();
    const doc = await db.collection(COLLECTIONS.NOTIFICATIONS).doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    if (data.is_deleted === 1) return null;
    return {
      id: doc.id,
      user_id: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      created_at: timestampToString(data.created_at),
      read: data.read,
      action_url: data.action_url,
      is_deleted: data.is_deleted || 0,
    };
  }

  async listNotificationsByUserId(userId: string): Promise<NotificationData[]> {
    const db = getDb();
    const snapshot = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .where('user_id', '==', userId)
      .where('is_deleted', '==', 0)
      .orderBy('created_at', 'desc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        user_id: data.user_id,
        type: data.type,
        title: data.title,
        message: data.message,
        created_at: timestampToString(data.created_at),
        read: data.read,
        action_url: data.action_url,
        is_deleted: data.is_deleted || 0,
      };
    });
  }

  async markNotificationRead(id: string): Promise<NotificationData | null> {
    const db = getDb();
    await db.collection(COLLECTIONS.NOTIFICATIONS).doc(id).update({ read: 1 });
    return this.getNotificationById(id);
  }

  async markAllNotificationsRead(userId: string): Promise<number> {
    const db = getDb();
    const snapshot = await db
      .collection(COLLECTIONS.NOTIFICATIONS)
      .where('user_id', '==', userId)
      .where('read', '==', 0)
      .where('is_deleted', '==', 0)
      .get();

    if (snapshot.empty) return 0;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.update(doc.ref, { read: 1 }));
    await batch.commit();
    return snapshot.size;
  }

  async deleteNotificationsByUserIds(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;
    const db = getDb();
    // Firestore 'in' queries are limited to 10 items
    for (let i = 0; i < userIds.length; i += 10) {
      const chunk = userIds.slice(i, i + 10);
      const snapshot = await db.collection(COLLECTIONS.NOTIFICATIONS).where('user_id', 'in', chunk).where('is_deleted', '==', 0).get();
      const batch = db.batch();
      snapshot.docs.forEach((doc) => batch.update(doc.ref, { is_deleted: 1 }));
      await batch.commit();
    }
  }

  // Reactions - use hard delete, so no is_deleted field needed
  async createReaction(reaction: ReactionData): Promise<ReactionData> {
    const db = getDb();
    const reactionData = {
      id: reaction.id,
      memory_id: reaction.memory_id,
      user_id: reaction.user_id,
      type: reaction.type,
      created_at: reaction.created_at || new Date().toISOString(),
    };
    await db.collection(COLLECTIONS.REACTIONS).doc(reaction.id).set(reactionData);
    return { ...reactionData, is_deleted: 0 };
  }

  async getReactionByMemoryAndUser(memoryId: string, userId: string): Promise<ReactionData | null> {
    const db = getDb();
    // No is_deleted filter needed since we use hard delete for reactions
    const snapshot = await db
      .collection(COLLECTIONS.REACTIONS)
      .where('memory_id', '==', memoryId)
      .where('user_id', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      memory_id: data.memory_id,
      user_id: data.user_id,
      type: data.type,
      created_at: timestampToString(data.created_at),
      is_deleted: 0,
    };
  }

  async listReactionsByMemoryId(memoryId: string): Promise<ReactionData[]> {
    const db = getDb();
    // No is_deleted filter needed since we use hard delete for reactions
    const snapshot = await db
      .collection(COLLECTIONS.REACTIONS)
      .where('memory_id', '==', memoryId)
      .orderBy('created_at', 'desc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        memory_id: data.memory_id,
        user_id: data.user_id,
        type: data.type,
        created_at: timestampToString(data.created_at),
        is_deleted: 0,
      };
    });
  }

  async deleteReaction(id: string): Promise<void> {
    const db = getDb();
    // Use hard delete for reactions to avoid issues on re-toggle
    await db.collection(COLLECTIONS.REACTIONS).doc(id).delete();
  }

  async deleteReactionsByMemoryId(memoryId: string): Promise<void> {
    const db = getDb();
    // Use hard delete for reactions
    const snapshot = await db.collection(COLLECTIONS.REACTIONS).where('memory_id', '==', memoryId).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  }

  // Unbind Requests
  async createUnbindRequest(request: UnbindRequestData): Promise<UnbindRequestData> {
    const db = getDb();
    const requestData = {
      ...request,
      requested_at: request.requested_at || new Date().toISOString(),
      is_deleted: 0,
    };
    await db.collection(COLLECTIONS.UNBIND_REQUESTS).doc(request.id).set(requestData);
    return requestData;
  }

  async getUnbindRequestBySpaceId(spaceId: string): Promise<UnbindRequestData | null> {
    const db = getDb();
    const snapshot = await db
      .collection(COLLECTIONS.UNBIND_REQUESTS)
      .where('space_id', '==', spaceId)
      .where('status', '==', 'pending')
      .where('is_deleted', '==', 0)
      .orderBy('requested_at', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    const data = doc.data();
    return {
      id: doc.id,
      space_id: data.space_id,
      requested_by: data.requested_by,
      requested_at: timestampToString(data.requested_at),
      expires_at: data.expires_at,
      status: data.status,
      is_deleted: data.is_deleted || 0,
    };
  }

  async updateUnbindRequestStatus(id: string, status: 'pending' | 'cancelled' | 'completed'): Promise<UnbindRequestData | null> {
    const db = getDb();
    await db.collection(COLLECTIONS.UNBIND_REQUESTS).doc(id).update({ status });
    const doc = await db.collection(COLLECTIONS.UNBIND_REQUESTS).doc(id).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    if (data.is_deleted === 1) return null;
    return {
      id: doc.id,
      space_id: data.space_id,
      requested_by: data.requested_by,
      requested_at: timestampToString(data.requested_at),
      expires_at: data.expires_at,
      status: data.status,
      is_deleted: data.is_deleted || 0,
    };
  }

  async deleteUnbindRequestsBySpaceId(spaceId: string): Promise<void> {
    const db = getDb();
    const snapshot = await db.collection(COLLECTIONS.UNBIND_REQUESTS).where('space_id', '==', spaceId).where('is_deleted', '==', 0).get();
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.update(doc.ref, { is_deleted: 1 }));
    await batch.commit();
  }

  async getExpiredUnbindRequests(): Promise<UnbindRequestData[]> {
    const db = getDb();
    const now = new Date().toISOString();
    const snapshot = await db
      .collection(COLLECTIONS.UNBIND_REQUESTS)
      .where('status', '==', 'pending')
      .where('is_deleted', '==', 0)
      .where('expires_at', '<=', now)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        space_id: data.space_id,
        requested_by: data.requested_by,
        requested_at: timestampToString(data.requested_at),
        expires_at: data.expires_at,
        status: data.status,
        is_deleted: data.is_deleted || 0,
      };
    });
  }

  // Space updates
  async updateSpace(id: string, updates: Partial<SpaceData>): Promise<SpaceData | null> {
    const db = getDb();
    const updateData: Record<string, unknown> = {};
    if (updates.anniversary_date !== undefined) updateData.anniversary_date = updates.anniversary_date;
    if (updates.invite_code !== undefined) updateData.invite_code = updates.invite_code;

    if (Object.keys(updateData).length > 0) {
      await db.collection(COLLECTIONS.SPACES).doc(id).update(updateData);
    }
    return this.getSpaceById(id);
  }

  // Utilities
  async getUsersByIds(ids: string[]): Promise<UserData[]> {
    if (ids.length === 0) return [];
    const db = getDb();
    const users: UserData[] = [];

    // Firestore 'in' queries are limited to 10 items
    for (let i = 0; i < ids.length; i += 10) {
      const chunk = ids.slice(i, i + 10);
      const snapshot = await db.collection(COLLECTIONS.USERS).where('__name__', 'in', chunk).get();
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.is_deleted !== 1) {
          users.push({
            id: doc.id,
            email: data.email,
            nickname: data.nickname,
            avatar: data.avatar,
            created_at: timestampToString(data.created_at),
            is_deleted: data.is_deleted || 0,
          });
        }
      });
    }

    return users;
  }
}

export const firestoreAdapter = new FirestoreAdapter();
