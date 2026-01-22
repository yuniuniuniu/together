import { v4 as uuid } from 'uuid';
import { getDatabase, MilestoneData } from '../db/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { getUserSpace } from './spaceService.js';
import { createNotification } from './notificationService.js';
import { deleteMilestoneFiles, deleteUploadedFiles } from './fileService.js';

interface Location {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

interface Milestone {
  id: string;
  spaceId: string;
  title: string;
  description?: string;
  date: string;
  type: string;
  icon?: string;
  photos: string[];
  location?: Location;
  createdAt: string;
  createdBy: string;
}

interface CreateMilestoneInput {
  title: string;
  description?: string;
  date: string;
  type: string;
  icon?: string;
  photos?: string[];
  location?: Location;
}

function formatMilestone(row: MilestoneData): Milestone {
  return {
    id: row.id,
    spaceId: row.space_id,
    title: row.title,
    description: row.description || undefined,
    date: row.date,
    type: row.type,
    icon: row.icon || undefined,
    photos: row.photos ? JSON.parse(row.photos) : [],
    location: row.location ? JSON.parse(row.location) : undefined,
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export async function createMilestone(userId: string, input: CreateMilestoneInput): Promise<Milestone> {
  const db = getDatabase();

  // Get user's space
  const space = await getUserSpace(userId);
  if (!space) {
    throw new AppError(400, 'NO_SPACE', 'User is not in a space');
  }

  const id = uuid();

  const milestone = await db.createMilestone({
    id,
    space_id: space.id,
    title: input.title,
    description: input.description || null,
    date: input.date,
    type: input.type,
    icon: input.icon || null,
    photos: input.photos ? JSON.stringify(input.photos) : null,
    location: input.location ? JSON.stringify(input.location) : null,
    created_at: new Date().toISOString(),
    created_by: userId,
  });

  // Get creator's info for notification
  const creator = await db.getUserById(userId);

  // Notify partner about the new milestone
  const spaceMembers = await db.getSpaceMembersBySpaceId(space.id);
  for (const member of spaceMembers) {
    if (member.user_id !== userId) {
      await createNotification(
        member.user_id,
        'milestone',
        `${creator?.nickname || 'Your partner'} added a milestone`,
        `"${input.title}" - ${input.type}`,
        `/milestone/${id}`
      );
    }
  }

  return formatMilestone(milestone);
}

export async function getMilestoneById(milestoneId: string, userId: string): Promise<Milestone | null> {
  const db = getDatabase();

  // Get user's space
  const space = await getUserSpace(userId);
  if (!space) return null;

  const milestone = await db.getMilestoneById(milestoneId);
  if (!milestone || milestone.space_id !== space.id) return null;

  return formatMilestone(milestone);
}

export async function listMilestones(userId: string): Promise<Milestone[]> {
  const db = getDatabase();

  // Get user's space
  const space = await getUserSpace(userId);
  if (!space) {
    return [];
  }

  const milestones = await db.listMilestonesBySpaceId(space.id);
  return milestones.map(formatMilestone);
}

export async function updateMilestone(
  milestoneId: string,
  userId: string,
  updates: Partial<CreateMilestoneInput>
): Promise<Milestone> {
  const db = getDatabase();

  // Check milestone exists and user has access
  const existing = await getMilestoneById(milestoneId, userId);
  if (!existing) {
    throw new AppError(404, 'MILESTONE_NOT_FOUND', 'Milestone not found');
  }

  const updateData: Partial<MilestoneData> = {};
  const filesToDelete: string[] = [];

  if (updates.title !== undefined) {
    updateData.title = updates.title;
  }
  if (updates.description !== undefined) {
    updateData.description = updates.description;
  }
  if (updates.date !== undefined) {
    updateData.date = updates.date;
  }
  if (updates.type !== undefined) {
    updateData.type = updates.type;
  }
  if (updates.icon !== undefined) {
    updateData.icon = updates.icon;
  }
  if (updates.photos !== undefined) {
    // Find photos that are being removed
    const newPhotos = new Set(updates.photos);
    for (const oldPhoto of existing.photos) {
      if (!newPhotos.has(oldPhoto)) {
        filesToDelete.push(oldPhoto);
      }
    }
    updateData.photos = JSON.stringify(updates.photos);
  }
  if (updates.location !== undefined) {
    updateData.location = updates.location ? JSON.stringify(updates.location) : null;
  }

  // Delete removed files
  if (filesToDelete.length > 0) {
    await deleteUploadedFiles(filesToDelete);
  }

  const milestone = await db.updateMilestone(milestoneId, updateData);
  if (!milestone) {
    throw new AppError(404, 'MILESTONE_NOT_FOUND', 'Milestone not found');
  }

  return formatMilestone(milestone);
}

export async function deleteMilestone(milestoneId: string, userId: string): Promise<void> {
  const db = getDatabase();

  // Check milestone exists and user has access
  const existing = await getMilestoneById(milestoneId, userId);
  if (!existing) {
    throw new AppError(404, 'MILESTONE_NOT_FOUND', 'Milestone not found');
  }

  // Delete associated files (photos)
  await deleteMilestoneFiles(existing.photos);

  await db.deleteMilestone(milestoneId);
}
