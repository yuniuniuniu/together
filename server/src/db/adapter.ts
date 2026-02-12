// Database adapter interface
export interface DatabaseAdapter {
  // Users
  createUser(user: UserData): Promise<UserData>;
  getUserById(id: string): Promise<UserData | null>;
  getUserByEmail(email: string): Promise<UserData | null>;
  updateUser(id: string, updates: Partial<UserData>): Promise<UserData | null>;

  // Verification Codes
  createVerificationCode(code: VerificationCodeData): Promise<void>;
  getVerificationCode(email: string, code: string): Promise<VerificationCodeData | null>;
  markVerificationCodeUsed(id: string): Promise<void>;
  deleteVerificationCodesByEmail(email: string): Promise<void>;

  // Spaces
  createSpace(space: SpaceData): Promise<SpaceData>;
  getSpaceById(id: string): Promise<SpaceData | null>;
  getSpaceByInviteCode(inviteCode: string): Promise<SpaceData | null>;
  deleteSpace(id: string): Promise<void>;

  // Space Members
  addSpaceMember(member: SpaceMemberData): Promise<void>;
  getSpaceMembersBySpaceId(spaceId: string): Promise<SpaceMemberData[]>;
  getSpaceMemberByUserId(userId: string): Promise<SpaceMemberData | null>;
  countSpaceMembers(spaceId: string): Promise<number>;
  deleteSpaceMembersBySpaceId(spaceId: string): Promise<void>;
  updateSpaceMember(spaceId: string, userId: string, updates: Partial<SpaceMemberData>): Promise<SpaceMemberData | null>;

  // Sessions
  createSession(session: SessionData): Promise<SessionData>;
  getSessionByToken(token: string): Promise<SessionData | null>;
  updateSessionToken(id: string, newToken: string, newExpiresAt: string): Promise<void>;
  deleteSession(id: string): Promise<void>;
  deleteSessionsByUserId(userId: string): Promise<void>;
  deleteExpiredSessions(): Promise<void>;

  // Memories
  createMemory(memory: MemoryData): Promise<MemoryData>;
  getMemoryById(id: string): Promise<MemoryData | null>;
  listMemoriesBySpaceId(spaceId: string, limit: number, offset: number): Promise<MemoryData[]>;
  countMemoriesBySpaceId(spaceId: string): Promise<number>;
  updateMemory(id: string, updates: Partial<MemoryData>): Promise<MemoryData | null>;
  deleteMemory(id: string): Promise<void>;
  deleteMemoriesBySpaceId(spaceId: string): Promise<void>;

  // Milestones
  createMilestone(milestone: MilestoneData): Promise<MilestoneData>;
  getMilestoneById(id: string): Promise<MilestoneData | null>;
  listMilestonesBySpaceId(spaceId: string): Promise<MilestoneData[]>;
  updateMilestone(id: string, updates: Partial<MilestoneData>): Promise<MilestoneData | null>;
  deleteMilestone(id: string): Promise<void>;
  deleteMilestonesBySpaceId(spaceId: string): Promise<void>;

  // Notifications
  createNotification(notification: NotificationData): Promise<NotificationData>;
  getNotificationById(id: string): Promise<NotificationData | null>;
  listNotificationsByUserId(userId: string): Promise<NotificationData[]>;
  markNotificationRead(id: string): Promise<NotificationData | null>;
  markAllNotificationsRead(userId: string): Promise<number>;
  deleteNotificationsByUserIds(userIds: string[]): Promise<void>;

  // Reactions
  createReaction(reaction: ReactionData): Promise<ReactionData>;
  getReactionByMemoryAndUser(memoryId: string, userId: string): Promise<ReactionData | null>;
  listReactionsByMemoryId(memoryId: string): Promise<ReactionData[]>;
  deleteReaction(id: string): Promise<void>;
  deleteReactionsByMemoryId(memoryId: string): Promise<void>;

  // Comments
  createComment(comment: CommentData): Promise<CommentData>;
  getCommentById(id: string): Promise<CommentData | null>;
  listCommentsByMemoryId(memoryId: string): Promise<CommentData[]>;
  countCommentsByMemoryId(memoryId: string): Promise<number>;
  deleteComment(id: string): Promise<void>;
  deleteCommentsByMemoryId(memoryId: string): Promise<void>;

  // Unbind Requests
  createUnbindRequest(request: UnbindRequestData): Promise<UnbindRequestData>;
  getUnbindRequestBySpaceId(spaceId: string): Promise<UnbindRequestData | null>;
  updateUnbindRequestStatus(id: string, status: 'pending' | 'cancelled' | 'completed'): Promise<UnbindRequestData | null>;
  deleteUnbindRequestsBySpaceId(spaceId: string): Promise<void>;
  getExpiredUnbindRequests(): Promise<UnbindRequestData[]>;

  // Space updates
  updateSpace(id: string, updates: Partial<SpaceData>): Promise<SpaceData | null>;

  // Utilities
  getUsersByIds(ids: string[]): Promise<UserData[]>;

  // Get all spaces (for reminders)
  getAllSpaces(): Promise<SpaceData[]>;
}

// Data types
export interface UserData {
  id: string;
  email: string | null;
  nickname: string;
  avatar: string | null;
  created_at: string;
  is_deleted?: number;
}

export interface VerificationCodeData {
  id: string;
  email: string;
  code: string;
  expires_at: string;
  used: number;
  is_deleted?: number;
}

export interface SpaceData {
  id: string;
  created_at: string;
  anniversary_date: string;
  invite_code: string;
  is_deleted?: number;
}

export interface SpaceMemberData {
  space_id: string;
  user_id: string;
  joined_at: string;
  is_deleted?: number;
}

export interface MemoryData {
  id: string;
  space_id: string;
  content: string;
  mood: string | null;
  photos: string | null;
  location: string | null;
  voice_note: string | null;
  stickers: string | null;
  created_at: string;
  created_by: string;
  word_count: number | null;
  is_deleted?: number;
}

export interface MilestoneData {
  id: string;
  space_id: string;
  title: string;
  description: string | null;
  date: string;
  type: string;
  icon: string | null;
  photos: string | null;
  location: string | null;
  created_at: string;
  created_by: string;
  is_deleted?: number;
}

export interface NotificationData {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: number;
  action_url: string | null;
  is_deleted?: number;
}

export interface ReactionData {
  id: string;
  memory_id: string;
  user_id: string;
  type: string;
  created_at: string;
  is_deleted?: number;
}

export interface CommentData {
  id: string;
  memory_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  is_deleted?: number;
}

export interface UnbindRequestData {
  id: string;
  space_id: string;
  requested_by: string;
  requested_at: string;
  expires_at: string;
  status: 'pending' | 'cancelled' | 'completed';
  is_deleted?: number;
}

export interface SessionData {
  id: string;
  user_id: string;
  token: string;
  created_at: string;
  expires_at: string;
  is_deleted?: number;
}

