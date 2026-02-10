import { v4 as uuid } from 'uuid';
import { getDatabase, MemoryData } from '../db/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { getUserSpace } from './spaceService.js';
import { createNotification } from './notificationService.js';
import { deleteMemoryFiles, deleteUploadedFiles } from './fileService.js';

interface Memory {
  id: string;
  spaceId: string;
  content: string;
  mood?: string;
  photos: string[];
  location?: {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  voiceNote?: string;
  stickers: string[];
  createdAt: string;
  createdBy: string;
  wordCount?: number;
}

interface CreateMemoryInput {
  content: string;
  mood?: string;
  photos?: string[];
  location?: {
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  voiceNote?: string;
  stickers?: string[];
  date?: string;
}

function formatMemory(row: MemoryData): Memory {
  return {
    id: row.id,
    spaceId: row.space_id,
    content: row.content,
    mood: row.mood || undefined,
    photos: row.photos ? JSON.parse(row.photos) : [],
    location: row.location ? JSON.parse(row.location) : undefined,
    voiceNote: row.voice_note || undefined,
    stickers: row.stickers ? JSON.parse(row.stickers) : [],
    createdAt: row.created_at,
    createdBy: row.created_by,
    wordCount: row.word_count || undefined,
  };
}

export async function createMemory(userId: string, input: CreateMemoryInput): Promise<Memory> {
  const db = getDatabase();

  // Get user's space
  const space = await getUserSpace(userId);
  if (!space) {
    throw new AppError(400, 'NO_SPACE', 'User is not in a space');
  }

  const id = uuid();
  const wordCount = input.content.split(/\s+/).filter(Boolean).length;

  const memory = await db.createMemory({
    id,
    space_id: space.id,
    content: input.content,
    mood: input.mood || null,
    photos: input.photos ? JSON.stringify(input.photos) : null,
    location: input.location ? JSON.stringify(input.location) : null,
    voice_note: input.voiceNote || null,
    stickers: input.stickers ? JSON.stringify(input.stickers) : null,
    created_at: input.date || new Date().toISOString(),
    created_by: userId,
    word_count: wordCount,
  });

  // Get creator's info for notification
  const creator = await db.getUserById(userId);

  // Notify partner about the new memory
  const spaceMembers = await db.getSpaceMembersBySpaceId(space.id);
  for (const member of spaceMembers) {
    if (member.user_id !== userId) {
      const previewText = input.content.length > 50
        ? input.content.substring(0, 50) + '...'
        : input.content;
      await createNotification(
        member.user_id,
        'memory',
        `${creator?.nickname || 'Your partner'} shared a memory`,
        previewText,
        `/memory/${id}`
      );
    }
  }

  return formatMemory(memory);
}

export async function getMemoryById(memoryId: string, userId: string): Promise<Memory | null> {
  const db = getDatabase();

  // Get user's space
  const space = await getUserSpace(userId);
  if (!space) return null;

  const memory = await db.getMemoryById(memoryId);
  if (!memory || memory.space_id !== space.id) return null;

  return formatMemory(memory);
}

export async function listMemories(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ data: Memory[]; total: number; page: number; pageSize: number; hasMore: boolean }> {
  const db = getDatabase();

  // Get user's space
  const space = await getUserSpace(userId);
  if (!space) {
    return { data: [], total: 0, page, pageSize, hasMore: false };
  }

  const offset = (page - 1) * pageSize;

  const memories = await db.listMemoriesBySpaceId(space.id, pageSize, offset);
  const total = await db.countMemoriesBySpaceId(space.id);
  const hasMore = offset + memories.length < total;

  return {
    data: memories.map(formatMemory),
    total,
    page,
    pageSize,
    hasMore,
  };
}

export async function updateMemory(
  memoryId: string,
  userId: string,
  updates: Partial<CreateMemoryInput>
): Promise<Memory> {
  const db = getDatabase();

  // Check memory exists and user has access
  const existing = await getMemoryById(memoryId, userId);
  if (!existing) {
    throw new AppError(404, 'MEMORY_NOT_FOUND', 'Memory not found');
  }

  const updateData: Partial<MemoryData> = {};
  const filesToDelete: string[] = [];

  if (updates.content !== undefined) {
    updateData.content = updates.content;
    updateData.word_count = updates.content.split(/\s+/).filter(Boolean).length;
  }
  if (updates.mood !== undefined) {
    updateData.mood = updates.mood;
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
    updateData.location = JSON.stringify(updates.location);
  }
  if (updates.voiceNote !== undefined) {
    // If voice note changed, delete the old one
    if (existing.voiceNote && existing.voiceNote !== updates.voiceNote) {
      filesToDelete.push(existing.voiceNote);
    }
    updateData.voice_note = updates.voiceNote;
  }
  if (updates.stickers !== undefined) {
    updateData.stickers = JSON.stringify(updates.stickers);
  }
  if (updates.date !== undefined) {
    updateData.created_at = updates.date;
  }

  // Delete removed files
  if (filesToDelete.length > 0) {
    await deleteUploadedFiles(filesToDelete);
  }

  const memory = await db.updateMemory(memoryId, updateData);
  if (!memory) {
    throw new AppError(404, 'MEMORY_NOT_FOUND', 'Memory not found');
  }

  // Notify partner about the edited memory
  const space = await getUserSpace(userId);
  if (space) {
    const editor = await db.getUserById(userId);
    const spaceMembers = await db.getSpaceMembersBySpaceId(space.id);
    for (const member of spaceMembers) {
      if (member.user_id !== userId) {
        const previewText = (updates.content || existing.content).substring(0, 40) + '...';
        await createNotification(
          member.user_id,
          'memory',
          `${editor?.nickname || 'Your partner'} edited a memory`,
          previewText,
          `/memory/${memoryId}`
        );
      }
    }
  }

  return formatMemory(memory);
}

export async function deleteMemory(memoryId: string, userId: string): Promise<void> {
  const db = getDatabase();

  // Check memory exists and user has access
  const existing = await getMemoryById(memoryId, userId);
  if (!existing) {
    throw new AppError(404, 'MEMORY_NOT_FOUND', 'Memory not found');
  }

  // Notify partner about the deleted memory before deleting
  const space = await getUserSpace(userId);
  if (space) {
    const deleter = await db.getUserById(userId);
    const spaceMembers = await db.getSpaceMembersBySpaceId(space.id);
    for (const member of spaceMembers) {
      if (member.user_id !== userId) {
        const previewText = existing.content.substring(0, 40) + '...';
        await createNotification(
          member.user_id,
          'memory',
          `${deleter?.nickname || 'Your partner'} deleted a memory`,
          previewText
        );
      }
    }
  }

  // Delete associated files (photos, voice note)
  await deleteMemoryFiles(existing.photos, existing.voiceNote || null);

  // Delete reactions first
  await db.deleteReactionsByMemoryId(memoryId);
  await db.deleteMemory(memoryId);
}
