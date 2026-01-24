import { v4 as uuid } from 'uuid';
import { getDatabase, SpaceData, UserData, UnbindRequestData } from '../db/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { createNotification } from './notificationService.js';

const COOLING_OFF_DAYS = 7;

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

function formatUser(data: UserData): User {
  return {
    id: data.id,
    phone: data.email || '',
    nickname: data.nickname,
    avatar: data.avatar,
  };
}

function formatSpace(space: SpaceData, partners: User[]): SpaceWithPartners {
  return {
    id: space.id,
    createdAt: space.created_at,
    anniversaryDate: space.anniversary_date,
    inviteCode: space.invite_code,
    partners,
  };
}

export async function createSpace(userId: string, anniversaryDate: string): Promise<SpaceWithPartners> {
  const db = getDatabase();

  // Check if user already has a space
  const existingMembership = await db.getSpaceMemberByUserId(userId);

  if (existingMembership) {
    throw new AppError(400, 'ALREADY_IN_SPACE', 'User is already in a space');
  }

  const spaceId = uuid();
  const inviteCode = generateInviteCode();

  // Create space
  const space = await db.createSpace({
    id: spaceId,
    anniversary_date: anniversaryDate,
    invite_code: inviteCode,
    created_at: new Date().toISOString(),
  });

  // Add user as member
  await db.addSpaceMember({
    space_id: spaceId,
    user_id: userId,
    pet_name: null,
    partner_pet_name: null,
    joined_at: new Date().toISOString(),
  });

  // Get user
  const userData = await db.getUserById(userId);
  if (!userData) throw new AppError(404, 'USER_NOT_FOUND', 'User not found');

  return formatSpace(space, [formatUser(userData)]);
}

export async function getSpaceById(spaceId: string): Promise<SpaceWithPartners | null> {
  const db = getDatabase();
  const space = await db.getSpaceById(spaceId);
  if (!space) return null;

  const members = await db.getSpaceMembersBySpaceId(spaceId);
  const userIds = members.map((m) => m.user_id);
  const users = await db.getUsersByIds(userIds);

  return formatSpace(space, users.map(formatUser));
}

export async function getUserSpace(userId: string): Promise<SpaceWithPartners | null> {
  const db = getDatabase();
  const membership = await db.getSpaceMemberByUserId(userId);

  if (!membership) return null;

  return getSpaceById(membership.space_id);
}

export async function lookupSpaceByInviteCode(inviteCode: string): Promise<SpaceWithPartners> {
  const db = getDatabase();

  // Find space by invite code
  const space = await db.getSpaceByInviteCode(inviteCode);

  if (!space) {
    throw new AppError(404, 'SPACE_NOT_FOUND', 'Invalid invite code');
  }

  // Check if space already has 2 members
  const memberCount = await db.countSpaceMembers(space.id);

  if (memberCount >= 2) {
    throw new AppError(400, 'SPACE_FULL', 'Space already has 2 members');
  }

  const members = await db.getSpaceMembersBySpaceId(space.id);
  const userIds = members.map((m) => m.user_id);
  const users = await db.getUsersByIds(userIds);

  return formatSpace(space, users.map(formatUser));
}

export async function joinSpaceByInviteCode(userId: string, inviteCode: string): Promise<SpaceWithPartners> {
  const db = getDatabase();

  // Check if user already has a space
  const existingMembership = await db.getSpaceMemberByUserId(userId);

  if (existingMembership) {
    throw new AppError(400, 'ALREADY_IN_SPACE', 'User is already in a space');
  }

  // Find space by invite code
  const space = await db.getSpaceByInviteCode(inviteCode);

  if (!space) {
    throw new AppError(404, 'SPACE_NOT_FOUND', 'Invalid invite code');
  }

  // Check if space already has 2 members
  const memberCount = await db.countSpaceMembers(space.id);

  if (memberCount >= 2) {
    throw new AppError(400, 'SPACE_FULL', 'Space already has 2 members');
  }

  // Get existing members before joining
  const existingMembers = await db.getSpaceMembersBySpaceId(space.id);

  // Add user as member
  await db.addSpaceMember({
    space_id: space.id,
    user_id: userId,
    pet_name: null,
    partner_pet_name: null,
    joined_at: new Date().toISOString(),
  });

  // Get joining user's info for notification
  const joiningUser = await db.getUserById(userId);

  // Notify existing members that a new partner has joined
  if (joiningUser) {
    for (const member of existingMembers) {
      await createNotification(
        member.user_id,
        'milestone',
        'Your Partner Has Joined! 💕',
        `${joiningUser.nickname} has joined your space. Start creating memories together!`
      );
    }
  }

  const result = await getSpaceById(space.id);
  if (!result) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to get space');
  return result;
}

export async function requestUnbind(spaceId: string, userId: string): Promise<UnbindRequestData> {
  const db = getDatabase();

  // Check if user is member of this space
  const membership = await db.getSpaceMemberByUserId(userId);
  if (!membership || membership.space_id !== spaceId) {
    throw new AppError(403, 'NOT_MEMBER', 'User is not a member of this space');
  }

  // Check if there's already a pending unbind request
  const existingRequest = await db.getUnbindRequestBySpaceId(spaceId);
  if (existingRequest) {
    throw new AppError(400, 'UNBIND_ALREADY_REQUESTED', 'An unbind request is already pending');
  }

  // Create unbind request with 7-day cooling-off period
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + COOLING_OFF_DAYS);

  const request = await db.createUnbindRequest({
    id: uuid(),
    space_id: spaceId,
    requested_by: userId,
    requested_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
    status: 'pending',
  });

  // Notify partner about the unbind request
  const requester = await db.getUserById(userId);
  const members = await db.getSpaceMembersBySpaceId(spaceId);
  for (const member of members) {
    if (member.user_id !== userId) {
      await createNotification(
        member.user_id,
        'unbind',
        'Unbind Request',
        `${requester?.nickname || 'Your partner'} has requested to unbind. You have ${COOLING_OFF_DAYS} days to restore.`,
        '/settings/unbind'
      );
    }
  }

  return request;
}

export async function cancelUnbind(spaceId: string, userId: string): Promise<void> {
  const db = getDatabase();

  // Check if user is member of this space
  const membership = await db.getSpaceMemberByUserId(userId);
  if (!membership || membership.space_id !== spaceId) {
    throw new AppError(403, 'NOT_MEMBER', 'User is not a member of this space');
  }

  // Get pending unbind request
  const request = await db.getUnbindRequestBySpaceId(spaceId);
  if (!request) {
    throw new AppError(404, 'NO_UNBIND_REQUEST', 'No pending unbind request found');
  }

  // Cancel the request
  await db.updateUnbindRequestStatus(request.id, 'cancelled');

  // Notify partner about the cancellation
  const canceller = await db.getUserById(userId);
  const members = await db.getSpaceMembersBySpaceId(spaceId);
  for (const member of members) {
    if (member.user_id !== userId) {
      await createNotification(
        member.user_id,
        'unbind',
        'Unbind Cancelled',
        `${canceller?.nickname || 'Your partner'} has cancelled the unbind request. Your space is safe!`,
        '/dashboard'
      );
    }
  }
}

export async function getUnbindStatus(spaceId: string, userId: string): Promise<UnbindRequestData | null> {
  const db = getDatabase();

  // Check if user is member of this space
  const membership = await db.getSpaceMemberByUserId(userId);
  if (!membership || membership.space_id !== spaceId) {
    throw new AppError(403, 'NOT_MEMBER', 'User is not a member of this space');
  }

  return db.getUnbindRequestBySpaceId(spaceId);
}

export async function deleteSpace(spaceId: string, userId: string): Promise<void> {
  const db = getDatabase();

  // Check if user is member of this space
  const membership = await db.getSpaceMemberByUserId(userId);

  if (!membership || membership.space_id !== spaceId) {
    throw new AppError(403, 'NOT_MEMBER', 'User is not a member of this space');
  }

  // Get all member user IDs for notification cleanup
  const members = await db.getSpaceMembersBySpaceId(spaceId);
  const userIds = members.map((m) => m.user_id);

  // Delete related data
  await db.deleteUnbindRequestsBySpaceId(spaceId);
  await db.deleteNotificationsByUserIds(userIds);
  await db.deleteMilestonesBySpaceId(spaceId);
  await db.deleteMemoriesBySpaceId(spaceId);
  await db.deleteSpaceMembersBySpaceId(spaceId);
  await db.deleteSpace(spaceId);
}

export async function updateAnniversaryDate(spaceId: string, userId: string, anniversaryDate: string): Promise<SpaceWithPartners> {
  const db = getDatabase();

  // Check if user is member of this space
  const membership = await db.getSpaceMemberByUserId(userId);
  if (!membership || membership.space_id !== spaceId) {
    throw new AppError(403, 'NOT_MEMBER', 'User is not a member of this space');
  }

  await db.updateSpace(spaceId, { anniversary_date: anniversaryDate });

  const result = await getSpaceById(spaceId);
  if (!result) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to get space');
  return result;
}

export async function isUserInSpace(userId: string, spaceId: string): Promise<boolean> {
  const db = getDatabase();
  const membership = await db.getSpaceMemberByUserId(userId);
  return !!membership && membership.space_id === spaceId;
}

// Pet Names
export interface PetNamesResult {
  myPetName: string | null;
  partnerPetName: string | null;
}

export async function getPetNames(userId: string): Promise<PetNamesResult> {
  const db = getDatabase();
  const membership = await db.getSpaceMemberByUserId(userId);

  if (!membership) {
    throw new AppError(404, 'NOT_IN_SPACE', 'User is not in a space');
  }

  return {
    myPetName: membership.pet_name,
    partnerPetName: membership.partner_pet_name,
  };
}

export async function updatePetNames(
  userId: string,
  updates: { myPetName?: string | null; partnerPetName?: string | null }
): Promise<PetNamesResult> {
  const db = getDatabase();
  const membership = await db.getSpaceMemberByUserId(userId);

  if (!membership) {
    throw new AppError(404, 'NOT_IN_SPACE', 'User is not in a space');
  }

  const dbUpdates: { pet_name?: string | null; partner_pet_name?: string | null } = {};

  if (updates.myPetName !== undefined) {
    dbUpdates.pet_name = updates.myPetName;
  }
  if (updates.partnerPetName !== undefined) {
    dbUpdates.partner_pet_name = updates.partnerPetName;
  }

  const updated = await db.updateSpaceMember(membership.space_id, userId, dbUpdates);

  if (!updated) {
    throw new AppError(500, 'UPDATE_FAILED', 'Failed to update pet names');
  }

  // Notify partner if their pet name was changed
  if (updates.partnerPetName !== undefined && updates.partnerPetName !== membership.partner_pet_name) {
    const members = await db.getSpaceMembersBySpaceId(membership.space_id);
    const user = await db.getUserById(userId);

    for (const member of members) {
      if (member.user_id !== userId) {
        await createNotification(
          member.user_id,
          'profile',
          `${user?.nickname || 'Your partner'} gave you a pet name!`,
          updates.partnerPetName ? `You're now "${updates.partnerPetName}" 💕` : 'Your pet name was removed',
          '/settings'
        );
      }
    }
  }

  return {
    myPetName: updated.pet_name,
    partnerPetName: updated.partner_pet_name,
  };
}

export async function finalizeExpiredUnbindRequests(): Promise<void> {
  const db = getDatabase();
  const expiredRequests = await db.getExpiredUnbindRequests();

  for (const request of expiredRequests) {
    const spaceId = request.space_id;
    const members = await db.getSpaceMembersBySpaceId(spaceId);
    const userIds = members.map((m) => m.user_id);

    await db.deleteNotificationsByUserIds(userIds);
    await db.deleteMilestonesBySpaceId(spaceId);
    await db.deleteMemoriesBySpaceId(spaceId);
    await db.deleteSpaceMembersBySpaceId(spaceId);
    await db.deleteSpace(spaceId);
    await db.updateUnbindRequestStatus(request.id, 'completed');
  }
}
