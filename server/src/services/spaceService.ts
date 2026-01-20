import { v4 as uuid } from 'uuid';
import { dbPrepare } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';

interface Space {
  id: string;
  created_at: string;
  anniversary_date: string;
  invite_code: string;
}

interface SpaceMember {
  space_id: string;
  user_id: string;
  pet_name: string | null;
  partner_pet_name: string | null;
  joined_at: string;
}

interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar: string | null;
}

interface SpaceWithPartners {
  id: string;
  createdAt: string;
  anniversaryDate: string;
  inviteCode: string;
  partners: User[];
}

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function formatSpace(space: Space, partners: User[]): SpaceWithPartners {
  return {
    id: space.id,
    createdAt: space.created_at,
    anniversaryDate: space.anniversary_date,
    inviteCode: space.invite_code,
    partners,
  };
}

export function createSpace(userId: string, anniversaryDate: string): SpaceWithPartners {
  // Check if user already has a space
  const existingMembership = dbPrepare(`
    SELECT space_id FROM space_members WHERE user_id = ?
  `).get(userId) as { space_id: string } | undefined;

  if (existingMembership) {
    throw new AppError(400, 'ALREADY_IN_SPACE', 'User is already in a space');
  }

  const spaceId = uuid();
  const inviteCode = generateInviteCode();

  // Create space
  dbPrepare(`
    INSERT INTO spaces (id, anniversary_date, invite_code) VALUES (?, ?, ?)
  `).run(spaceId, anniversaryDate, inviteCode);

  // Add user as member
  dbPrepare(`
    INSERT INTO space_members (space_id, user_id) VALUES (?, ?)
  `).run(spaceId, userId);

  // Get user
  const user = dbPrepare('SELECT id, phone, nickname, avatar FROM users WHERE id = ?')
    .get(userId) as User;

  const space = dbPrepare('SELECT * FROM spaces WHERE id = ?').get(spaceId) as Space;

  return formatSpace(space, [user]);
}

export function getSpaceById(spaceId: string): SpaceWithPartners | null {
  const space = dbPrepare('SELECT * FROM spaces WHERE id = ?').get(spaceId) as Space | undefined;
  if (!space) return null;

  const partners = dbPrepare(`
    SELECT u.id, u.phone, u.nickname, u.avatar
    FROM users u
    JOIN space_members sm ON u.id = sm.user_id
    WHERE sm.space_id = ?
  `).all(spaceId) as User[];

  return formatSpace(space, partners);
}

export function getUserSpace(userId: string): SpaceWithPartners | null {
  const membership = dbPrepare(`
    SELECT space_id FROM space_members WHERE user_id = ?
  `).get(userId) as { space_id: string } | undefined;

  if (!membership) return null;

  return getSpaceById(membership.space_id);
}

export function joinSpaceByInviteCode(userId: string, inviteCode: string): SpaceWithPartners {
  // Check if user already has a space
  const existingMembership = dbPrepare(`
    SELECT space_id FROM space_members WHERE user_id = ?
  `).get(userId) as { space_id: string } | undefined;

  if (existingMembership) {
    throw new AppError(400, 'ALREADY_IN_SPACE', 'User is already in a space');
  }

  // Find space by invite code
  const space = dbPrepare(`
    SELECT * FROM spaces WHERE invite_code = ?
  `).get(inviteCode) as Space | undefined;

  if (!space) {
    throw new AppError(404, 'SPACE_NOT_FOUND', 'Invalid invite code');
  }

  // Check if space already has 2 members
  const memberCount = dbPrepare(`
    SELECT COUNT(*) as count FROM space_members WHERE space_id = ?
  `).get(space.id) as { count: number };

  if (memberCount.count >= 2) {
    throw new AppError(400, 'SPACE_FULL', 'Space already has 2 members');
  }

  // Add user as member
  dbPrepare(`
    INSERT INTO space_members (space_id, user_id) VALUES (?, ?)
  `).run(space.id, userId);

  return getSpaceById(space.id)!;
}

export function deleteSpace(spaceId: string, userId: string): void {
  // Check if user is member of this space
  const membership = dbPrepare(`
    SELECT * FROM space_members WHERE space_id = ? AND user_id = ?
  `).get(spaceId, userId) as SpaceMember | undefined;

  if (!membership) {
    throw new AppError(403, 'NOT_MEMBER', 'User is not a member of this space');
  }

  // Delete related data first (since sql.js doesn't support ON DELETE CASCADE well)
  dbPrepare('DELETE FROM notifications WHERE user_id IN (SELECT user_id FROM space_members WHERE space_id = ?)').run(spaceId);
  dbPrepare('DELETE FROM milestones WHERE space_id = ?').run(spaceId);
  dbPrepare('DELETE FROM memories WHERE space_id = ?').run(spaceId);
  dbPrepare('DELETE FROM space_members WHERE space_id = ?').run(spaceId);
  dbPrepare('DELETE FROM spaces WHERE id = ?').run(spaceId);
}

export function isUserInSpace(userId: string, spaceId: string): boolean {
  const membership = dbPrepare(`
    SELECT 1 FROM space_members WHERE space_id = ? AND user_id = ?
  `).get(spaceId, userId);
  return !!membership;
}
