import { v4 as uuid } from 'uuid';
import { getDatabase, ReactionData } from '../db/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { getMemoryById } from './memoryService.js';
import { createNotification } from './notificationService.js';

interface Reaction {
  id: string;
  memoryId: string;
  userId: string;
  type: string;
  createdAt: string;
}

function formatReaction(row: ReactionData): Reaction {
  return {
    id: row.id,
    memoryId: row.memory_id,
    userId: row.user_id,
    type: row.type,
    createdAt: row.created_at,
  };
}

export async function toggleReaction(
  memoryId: string,
  userId: string,
  type: string = 'love'
): Promise<{ action: 'added' | 'removed' | 'blocked'; reaction?: Reaction }> {
  const db = getDatabase();

  // Check memory exists and user has access
  const memory = await getMemoryById(memoryId, userId);
  if (!memory) {
    throw new AppError(404, 'MEMORY_NOT_FOUND', 'Memory not found');
  }

  // Silently ignore self-reaction operations (add/remove) to avoid surfacing errors to clients.
  if (memory.createdBy === userId) {
    return { action: 'blocked' };
  }

  // Check if reaction already exists
  const existing = await db.getReactionByMemoryAndUser(memoryId, userId);

  if (existing) {
    // Remove reaction
    await db.deleteReaction(existing.id);
    return { action: 'removed' };
  } else {
    // Add reaction
    const id = uuid();
    const reaction = await db.createReaction({
      id,
      memory_id: memoryId,
      user_id: userId,
      type,
      created_at: new Date().toISOString(),
    });

    // Notify the memory creator about the reaction (if they're not the one reacting)
    if (memory.createdBy !== userId) {
      const reactor = await db.getUserById(userId);
      const previewText = memory.content.length > 40
        ? memory.content.substring(0, 40) + '...'
        : memory.content;
      await createNotification(
        memory.createdBy,
        'reaction',
        `${reactor?.nickname || 'Your partner'} loved your memory ❤️`,
        previewText,
        `/memory/${memoryId}`
      );
    }

    return { action: 'added', reaction: formatReaction(reaction) };
  }
}

export async function getReactionsByMemory(memoryId: string, userId: string): Promise<Reaction[]> {
  const db = getDatabase();

  // Check memory exists and user has access
  const memory = await getMemoryById(memoryId, userId);
  if (!memory) {
    throw new AppError(404, 'MEMORY_NOT_FOUND', 'Memory not found');
  }

  const reactions = await db.listReactionsByMemoryId(memoryId);
  return reactions.map(formatReaction);
}

export async function getUserReaction(memoryId: string, userId: string): Promise<Reaction | null> {
  const db = getDatabase();

  // Keep access checks consistent with list/toggle.
  const memory = await getMemoryById(memoryId, userId);
  if (!memory) {
    throw new AppError(404, 'MEMORY_NOT_FOUND', 'Memory not found');
  }

  const reaction = await db.getReactionByMemoryAndUser(memoryId, userId);
  if (!reaction) return null;
  return formatReaction(reaction);
}

export async function getReactionCount(memoryId: string): Promise<number> {
  const db = getDatabase();
  const reactions = await db.listReactionsByMemoryId(memoryId);
  return reactions.length;
}
