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
  CommentData,
  UnbindRequestData,
  SessionData,
  DeviceTokenData,
} from './adapter.js';
import { dbPrepare, saveDatabase } from './index.js';

// Helper to safely cast query results
function asType<T>(result: unknown): T | null {
  return result as T | null;
}

function asTypeArray<T>(result: unknown[]): T[] {
  return result as T[];
}

export class SQLiteAdapter implements DatabaseAdapter {
  // Users
  async createUser(user: UserData): Promise<UserData> {
    dbPrepare(`
      INSERT INTO users (id, email, nickname, avatar, created_at, is_deleted)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(user.id, user.email, user.nickname, user.avatar, user.created_at || new Date().toISOString());
    saveDatabase();
    return (await this.getUserById(user.id))!;
  }

  async getUserById(id: string): Promise<UserData | null> {
    const row = dbPrepare('SELECT * FROM users WHERE id = ? AND is_deleted = 0').get(id);
    return asType<UserData>(row);
  }

  async getUserByEmail(email: string): Promise<UserData | null> {
    const row = dbPrepare('SELECT * FROM users WHERE email = ? AND is_deleted = 0').get(email);
    return asType<UserData>(row);
  }

  async updateUser(id: string, updates: Partial<UserData>): Promise<UserData | null> {
    const fields: string[] = [];
    const values: (string | null | undefined)[] = [];

    if (updates.nickname !== undefined) {
      fields.push('nickname = ?');
      values.push(updates.nickname);
    }
    if (updates.avatar !== undefined) {
      fields.push('avatar = ?');
      values.push(updates.avatar);
    }
    if (updates.email !== undefined) {
      fields.push('email = ?');
      values.push(updates.email);
    }

    if (fields.length > 0) {
      values.push(id);
      dbPrepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
      saveDatabase();
    }

    return this.getUserById(id);
  }

  // Verification Codes
  async createVerificationCode(code: VerificationCodeData): Promise<void> {
    dbPrepare(`
      INSERT INTO verification_codes (id, email, code, expires_at, used, is_deleted)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(code.id, code.email, code.code, code.expires_at, code.used || 0);
    saveDatabase();
  }

  async getVerificationCode(email: string, code: string): Promise<VerificationCodeData | null> {
    const row = dbPrepare(`
      SELECT * FROM verification_codes
      WHERE email = ? AND code = ? AND used = 0 AND expires_at > datetime('now') AND is_deleted = 0
    `).get(email, code);
    return asType<VerificationCodeData>(row);
  }

  async markVerificationCodeUsed(id: string): Promise<void> {
    dbPrepare('UPDATE verification_codes SET used = 1 WHERE id = ? AND is_deleted = 0').run(id);
    saveDatabase();
  }

  async deleteVerificationCodesByEmail(email: string): Promise<void> {
    dbPrepare('UPDATE verification_codes SET is_deleted = 1 WHERE email = ? AND is_deleted = 0').run(email);
    saveDatabase();
  }

  // Spaces
  async createSpace(space: SpaceData): Promise<SpaceData> {
    dbPrepare(`
      INSERT INTO spaces (id, anniversary_date, invite_code, created_at, is_deleted)
      VALUES (?, ?, ?, ?, 0)
    `).run(space.id, space.anniversary_date, space.invite_code, space.created_at || new Date().toISOString());
    saveDatabase();
    return (await this.getSpaceById(space.id))!;
  }

  async getSpaceById(id: string): Promise<SpaceData | null> {
    const row = dbPrepare('SELECT * FROM spaces WHERE id = ? AND is_deleted = 0').get(id);
    return asType<SpaceData>(row);
  }

  async getSpaceByInviteCode(inviteCode: string): Promise<SpaceData | null> {
    const row = dbPrepare('SELECT * FROM spaces WHERE invite_code = ? AND is_deleted = 0').get(inviteCode);
    return asType<SpaceData>(row);
  }

  async deleteSpace(id: string): Promise<void> {
    dbPrepare('UPDATE spaces SET is_deleted = 1 WHERE id = ? AND is_deleted = 0').run(id);
    saveDatabase();
  }

  async getAllSpaces(): Promise<SpaceData[]> {
    const rows = dbPrepare('SELECT * FROM spaces WHERE is_deleted = 0').all();
    return asTypeArray<SpaceData>(rows);
  }

  // Space Members
  async addSpaceMember(member: SpaceMemberData): Promise<void> {
    dbPrepare(`
      INSERT INTO space_members (space_id, user_id, joined_at, is_deleted)
      VALUES (?, ?, ?, 0)
    `).run(member.space_id, member.user_id, member.joined_at || new Date().toISOString());
    saveDatabase();
  }

  async getSpaceMembersBySpaceId(spaceId: string): Promise<SpaceMemberData[]> {
    const rows = dbPrepare('SELECT * FROM space_members WHERE space_id = ? AND is_deleted = 0').all(spaceId);
    return asTypeArray<SpaceMemberData>(rows);
  }

  async getSpaceMemberByUserId(userId: string): Promise<SpaceMemberData | null> {
    const row = dbPrepare('SELECT * FROM space_members WHERE user_id = ? AND is_deleted = 0').get(userId);
    return asType<SpaceMemberData>(row);
  }

  async countSpaceMembers(spaceId: string): Promise<number> {
    const result = dbPrepare('SELECT COUNT(*) as count FROM space_members WHERE space_id = ? AND is_deleted = 0').get(spaceId) as { count: number };
    return result.count;
  }

  async deleteSpaceMembersBySpaceId(spaceId: string): Promise<void> {
    dbPrepare('UPDATE space_members SET is_deleted = 1 WHERE space_id = ? AND is_deleted = 0').run(spaceId);
    saveDatabase();
  }

  async updateSpaceMember(spaceId: string, userId: string, updates: Partial<SpaceMemberData>): Promise<SpaceMemberData | null> {
    const fields: string[] = [];
    const values: (string | null | undefined)[] = [];

    if (updates.joined_at !== undefined) {
      fields.push('joined_at = ?');
      values.push(updates.joined_at);
    }

    if (fields.length > 0) {
      values.push(spaceId, userId);
      dbPrepare(`UPDATE space_members SET ${fields.join(', ')} WHERE space_id = ? AND user_id = ? AND is_deleted = 0`).run(...values);
      saveDatabase();
    }

    const row = dbPrepare('SELECT * FROM space_members WHERE space_id = ? AND user_id = ? AND is_deleted = 0').get(spaceId, userId);
    return asType<SpaceMemberData>(row);
  }

  // Sessions
  async createSession(session: SessionData): Promise<SessionData> {
    dbPrepare(`
      INSERT INTO sessions (id, user_id, token, created_at, expires_at, is_deleted)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(session.id, session.user_id, session.token, session.created_at || new Date().toISOString(), session.expires_at);
    saveDatabase();
    return session;
  }

  async getSessionByToken(token: string): Promise<SessionData | null> {
    const row = dbPrepare(`
      SELECT * FROM sessions
      WHERE token = ? AND expires_at > datetime('now') AND is_deleted = 0
    `).get(token);
    return asType<SessionData>(row);
  }

  async updateSessionToken(id: string, newToken: string, newExpiresAt: string): Promise<void> {
    dbPrepare('UPDATE sessions SET token = ?, expires_at = ? WHERE id = ? AND is_deleted = 0').run(newToken, newExpiresAt, id);
    saveDatabase();
  }

  async deleteSession(id: string): Promise<void> {
    dbPrepare('UPDATE sessions SET is_deleted = 1 WHERE id = ? AND is_deleted = 0').run(id);
    saveDatabase();
  }

  async deleteSessionsByUserId(userId: string): Promise<void> {
    dbPrepare('UPDATE sessions SET is_deleted = 1 WHERE user_id = ? AND is_deleted = 0').run(userId);
    saveDatabase();
  }

  async deleteExpiredSessions(): Promise<void> {
    dbPrepare("UPDATE sessions SET is_deleted = 1 WHERE expires_at <= datetime('now') AND is_deleted = 0").run();
    saveDatabase();
  }

  // Memories
  async createMemory(memory: MemoryData): Promise<MemoryData> {
    dbPrepare(`
      INSERT INTO memories (id, space_id, content, mood, photos, location, voice_note, stickers, created_at, created_by, word_count, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      memory.id,
      memory.space_id,
      memory.content,
      memory.mood,
      memory.photos,
      memory.location,
      memory.voice_note,
      memory.stickers,
      memory.created_at || new Date().toISOString(),
      memory.created_by,
      memory.word_count
    );
    saveDatabase();
    return (await this.getMemoryById(memory.id))!;
  }

  async getMemoryById(id: string): Promise<MemoryData | null> {
    const row = dbPrepare('SELECT * FROM memories WHERE id = ? AND is_deleted = 0').get(id);
    return asType<MemoryData>(row);
  }

  async listMemoriesBySpaceId(spaceId: string, limit: number, offset: number): Promise<MemoryData[]> {
    const rows = dbPrepare(`
      SELECT * FROM memories
      WHERE space_id = ? AND is_deleted = 0
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(spaceId, limit, offset);
    return asTypeArray<MemoryData>(rows);
  }

  async countMemoriesBySpaceId(spaceId: string): Promise<number> {
    const result = dbPrepare('SELECT COUNT(*) as count FROM memories WHERE space_id = ? AND is_deleted = 0').get(spaceId) as { count: number };
    return result.count;
  }

  async updateMemory(id: string, updates: Partial<MemoryData>): Promise<MemoryData | null> {
    const fields: string[] = [];
    const values: (string | number | null | undefined)[] = [];

    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
    }
    if (updates.mood !== undefined) {
      fields.push('mood = ?');
      values.push(updates.mood);
    }
    if (updates.photos !== undefined) {
      fields.push('photos = ?');
      values.push(updates.photos);
    }
    if (updates.location !== undefined) {
      fields.push('location = ?');
      values.push(updates.location);
    }
    if (updates.voice_note !== undefined) {
      fields.push('voice_note = ?');
      values.push(updates.voice_note);
    }
    if (updates.stickers !== undefined) {
      fields.push('stickers = ?');
      values.push(updates.stickers);
    }
    if (updates.word_count !== undefined) {
      fields.push('word_count = ?');
      values.push(updates.word_count);
    }

    if (fields.length > 0) {
      values.push(id);
      dbPrepare(`UPDATE memories SET ${fields.join(', ')} WHERE id = ? AND is_deleted = 0`).run(...values);
      saveDatabase();
    }

    return this.getMemoryById(id);
  }

  async deleteMemory(id: string): Promise<void> {
    dbPrepare('UPDATE memories SET is_deleted = 1 WHERE id = ? AND is_deleted = 0').run(id);
    saveDatabase();
  }

  async deleteMemoriesBySpaceId(spaceId: string): Promise<void> {
    dbPrepare('UPDATE memories SET is_deleted = 1 WHERE space_id = ? AND is_deleted = 0').run(spaceId);
    saveDatabase();
  }

  // Milestones
  async createMilestone(milestone: MilestoneData): Promise<MilestoneData> {
    dbPrepare(`
      INSERT INTO milestones (id, space_id, title, description, date, type, icon, photos, location, created_at, created_by, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      milestone.id,
      milestone.space_id,
      milestone.title,
      milestone.description,
      milestone.date,
      milestone.type,
      milestone.icon,
      milestone.photos,
      milestone.location,
      milestone.created_at || new Date().toISOString(),
      milestone.created_by
    );
    saveDatabase();
    return (await this.getMilestoneById(milestone.id))!;
  }

  async getMilestoneById(id: string): Promise<MilestoneData | null> {
    const row = dbPrepare('SELECT * FROM milestones WHERE id = ? AND is_deleted = 0').get(id);
    return asType<MilestoneData>(row);
  }

  async listMilestonesBySpaceId(spaceId: string): Promise<MilestoneData[]> {
    const rows = dbPrepare('SELECT * FROM milestones WHERE space_id = ? AND is_deleted = 0 ORDER BY date DESC').all(spaceId);
    return asTypeArray<MilestoneData>(rows);
  }

  async updateMilestone(id: string, updates: Partial<MilestoneData>): Promise<MilestoneData | null> {
    const fields: string[] = [];
    const values: (string | null | undefined)[] = [];

    if (updates.title !== undefined) {
      fields.push('title = ?');
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push('description = ?');
      values.push(updates.description);
    }
    if (updates.date !== undefined) {
      fields.push('date = ?');
      values.push(updates.date);
    }
    if (updates.type !== undefined) {
      fields.push('type = ?');
      values.push(updates.type);
    }
    if (updates.icon !== undefined) {
      fields.push('icon = ?');
      values.push(updates.icon);
    }
    if (updates.photos !== undefined) {
      fields.push('photos = ?');
      values.push(updates.photos);
    }
    if (updates.location !== undefined) {
      fields.push('location = ?');
      values.push(updates.location);
    }

    if (fields.length > 0) {
      values.push(id);
      dbPrepare(`UPDATE milestones SET ${fields.join(', ')} WHERE id = ? AND is_deleted = 0`).run(...values);
      saveDatabase();
    }

    return this.getMilestoneById(id);
  }

  async deleteMilestone(id: string): Promise<void> {
    dbPrepare('UPDATE milestones SET is_deleted = 1 WHERE id = ? AND is_deleted = 0').run(id);
    saveDatabase();
  }

  async deleteMilestonesBySpaceId(spaceId: string): Promise<void> {
    dbPrepare('UPDATE milestones SET is_deleted = 1 WHERE space_id = ? AND is_deleted = 0').run(spaceId);
    saveDatabase();
  }

  // Notifications
  async createNotification(notification: NotificationData): Promise<NotificationData> {
    dbPrepare(`
      INSERT INTO notifications (id, user_id, type, title, message, created_at, read, action_url, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      notification.id,
      notification.user_id,
      notification.type,
      notification.title,
      notification.message,
      notification.created_at || new Date().toISOString(),
      notification.read || 0,
      notification.action_url
    );
    saveDatabase();
    return (await this.getNotificationById(notification.id))!;
  }

  async getNotificationById(id: string): Promise<NotificationData | null> {
    const row = dbPrepare('SELECT * FROM notifications WHERE id = ? AND is_deleted = 0').get(id);
    return asType<NotificationData>(row);
  }

  async listNotificationsByUserId(userId: string): Promise<NotificationData[]> {
    const rows = dbPrepare('SELECT * FROM notifications WHERE user_id = ? AND is_deleted = 0 ORDER BY created_at DESC').all(userId);
    return asTypeArray<NotificationData>(rows);
  }

  async markNotificationRead(id: string): Promise<NotificationData | null> {
    dbPrepare('UPDATE notifications SET read = 1 WHERE id = ? AND is_deleted = 0').run(id);
    saveDatabase();
    return this.getNotificationById(id);
  }

  async markAllNotificationsRead(userId: string): Promise<number> {
    // First count unread notifications
    const countResult = dbPrepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0 AND is_deleted = 0').get(userId) as { count: number } | undefined;
    const count = countResult?.count || 0;
    // Then update them
    dbPrepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0 AND is_deleted = 0').run(userId);
    saveDatabase();
    return count;
  }

  async deleteNotificationsByUserIds(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;
    const placeholders = userIds.map(() => '?').join(', ');
    dbPrepare(`UPDATE notifications SET is_deleted = 1 WHERE user_id IN (${placeholders}) AND is_deleted = 0`).run(...userIds);
    saveDatabase();
  }

  // Reactions
  async createReaction(reaction: ReactionData): Promise<ReactionData> {
    dbPrepare(`
      INSERT INTO reactions (id, memory_id, user_id, type, created_at, is_deleted)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(
      reaction.id,
      reaction.memory_id,
      reaction.user_id,
      reaction.type,
      reaction.created_at || new Date().toISOString()
    );
    saveDatabase();
    return reaction;
  }

  async getReactionByMemoryAndUser(memoryId: string, userId: string): Promise<ReactionData | null> {
    const row = dbPrepare('SELECT * FROM reactions WHERE memory_id = ? AND user_id = ? AND is_deleted = 0').get(memoryId, userId);
    return asType<ReactionData>(row);
  }

  async listReactionsByMemoryId(memoryId: string): Promise<ReactionData[]> {
    const rows = dbPrepare('SELECT * FROM reactions WHERE memory_id = ? AND is_deleted = 0 ORDER BY created_at DESC').all(memoryId);
    return asTypeArray<ReactionData>(rows);
  }

  async deleteReaction(id: string): Promise<void> {
    // Use hard delete for reactions to avoid UNIQUE constraint conflicts on re-toggle
    dbPrepare('DELETE FROM reactions WHERE id = ?').run(id);
    saveDatabase();
  }

  async deleteReactionsByMemoryId(memoryId: string): Promise<void> {
    // Use hard delete for reactions to avoid UNIQUE constraint conflicts
    dbPrepare('DELETE FROM reactions WHERE memory_id = ?').run(memoryId);
    saveDatabase();
  }

  // Comments
  async createComment(comment: CommentData): Promise<CommentData> {
    dbPrepare(`
      INSERT INTO comments (id, memory_id, user_id, parent_id, content, created_at, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(
      comment.id,
      comment.memory_id,
      comment.user_id,
      comment.parent_id,
      comment.content,
      comment.created_at || new Date().toISOString()
    );
    saveDatabase();
    return (await this.getCommentById(comment.id))!;
  }

  async getCommentById(id: string): Promise<CommentData | null> {
    const row = dbPrepare('SELECT * FROM comments WHERE id = ? AND is_deleted = 0').get(id);
    return asType<CommentData>(row);
  }

  async listCommentsByMemoryId(memoryId: string): Promise<CommentData[]> {
    const rows = dbPrepare('SELECT * FROM comments WHERE memory_id = ? AND is_deleted = 0 ORDER BY created_at ASC').all(memoryId);
    return asTypeArray<CommentData>(rows);
  }

  async countCommentsByMemoryId(memoryId: string): Promise<number> {
    const result = dbPrepare('SELECT COUNT(*) as count FROM comments WHERE memory_id = ? AND is_deleted = 0').get(memoryId) as { count: number };
    return result.count;
  }

  async deleteComment(id: string): Promise<void> {
    // Soft-delete the comment and all its replies
    dbPrepare('UPDATE comments SET is_deleted = 1 WHERE (id = ? OR parent_id = ?) AND is_deleted = 0').run(id, id);
    saveDatabase();
  }

  async deleteCommentsByMemoryId(memoryId: string): Promise<void> {
    dbPrepare('UPDATE comments SET is_deleted = 1 WHERE memory_id = ? AND is_deleted = 0').run(memoryId);
    saveDatabase();
  }

  // Unbind Requests
  async createUnbindRequest(request: UnbindRequestData): Promise<UnbindRequestData> {
    dbPrepare(`
      INSERT INTO unbind_requests (id, space_id, requested_by, requested_at, expires_at, status, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `).run(
      request.id,
      request.space_id,
      request.requested_by,
      request.requested_at || new Date().toISOString(),
      request.expires_at,
      request.status || 'pending'
    );
    saveDatabase();
    return request;
  }

  async getUnbindRequestBySpaceId(spaceId: string): Promise<UnbindRequestData | null> {
    const row = dbPrepare(`
      SELECT * FROM unbind_requests
      WHERE space_id = ? AND status = 'pending' AND is_deleted = 0
      ORDER BY requested_at DESC
      LIMIT 1
    `).get(spaceId);
    return asType<UnbindRequestData>(row);
  }

  async updateUnbindRequestStatus(id: string, status: 'pending' | 'cancelled' | 'completed'): Promise<UnbindRequestData | null> {
    dbPrepare('UPDATE unbind_requests SET status = ? WHERE id = ? AND is_deleted = 0').run(status, id);
    saveDatabase();
    const row = dbPrepare('SELECT * FROM unbind_requests WHERE id = ? AND is_deleted = 0').get(id);
    return asType<UnbindRequestData>(row);
  }

  async deleteUnbindRequestsBySpaceId(spaceId: string): Promise<void> {
    dbPrepare('UPDATE unbind_requests SET is_deleted = 1 WHERE space_id = ? AND is_deleted = 0').run(spaceId);
    saveDatabase();
  }

  async getExpiredUnbindRequests(): Promise<UnbindRequestData[]> {
    const rows = dbPrepare(`
      SELECT * FROM unbind_requests
      WHERE status = 'pending' AND expires_at <= datetime('now') AND is_deleted = 0
    `).all();
    return asTypeArray<UnbindRequestData>(rows);
  }

  // Space updates
  async updateSpace(id: string, updates: Partial<SpaceData>): Promise<SpaceData | null> {
    const fields: string[] = [];
    const values: (string | null | undefined)[] = [];

    if (updates.anniversary_date !== undefined) {
      fields.push('anniversary_date = ?');
      values.push(updates.anniversary_date);
    }
    if (updates.invite_code !== undefined) {
      fields.push('invite_code = ?');
      values.push(updates.invite_code);
    }

    if (fields.length > 0) {
      values.push(id);
      dbPrepare(`UPDATE spaces SET ${fields.join(', ')} WHERE id = ? AND is_deleted = 0`).run(...values);
      saveDatabase();
    }

    return this.getSpaceById(id);
  }

  // Utilities
  async getUsersByIds(ids: string[]): Promise<UserData[]> {
    if (ids.length === 0) return [];
    const placeholders = ids.map(() => '?').join(', ');
    const rows = dbPrepare(`SELECT * FROM users WHERE id IN (${placeholders}) AND is_deleted = 0`).all(...ids);
    return asTypeArray<UserData>(rows);
  }

  // Device Tokens
  async createDeviceToken(data: DeviceTokenData): Promise<DeviceTokenData> {
    // Use INSERT OR REPLACE to handle token updates (same user, same token)
    dbPrepare(`
      INSERT INTO device_tokens (id, user_id, token, platform, created_at, updated_at, is_deleted)
      VALUES (?, ?, ?, ?, ?, ?, 0)
      ON CONFLICT(user_id, token) DO UPDATE SET updated_at = ?, is_deleted = 0
    `).run(
      data.id,
      data.user_id,
      data.token,
      data.platform,
      data.created_at,
      data.updated_at,
      data.updated_at
    );
    saveDatabase();
    return data;
  }

  async getDeviceTokensByUserId(userId: string): Promise<DeviceTokenData[]> {
    const rows = dbPrepare('SELECT * FROM device_tokens WHERE user_id = ? AND is_deleted = 0').all(userId);
    return asTypeArray<DeviceTokenData>(rows);
  }

  async deleteDeviceToken(userId: string, token: string): Promise<void> {
    dbPrepare('UPDATE device_tokens SET is_deleted = 1 WHERE user_id = ? AND token = ? AND is_deleted = 0').run(userId, token);
    saveDatabase();
  }

  async deleteDeviceTokensByUserId(userId: string): Promise<void> {
    dbPrepare('UPDATE device_tokens SET is_deleted = 1 WHERE user_id = ? AND is_deleted = 0').run(userId);
    saveDatabase();
  }
}

export const sqliteAdapter = new SQLiteAdapter();
