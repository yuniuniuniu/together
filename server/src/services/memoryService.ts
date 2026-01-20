import { v4 as uuid } from 'uuid';
import { dbPrepare } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { getUserSpace } from './spaceService.js';

interface MemoryRow {
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
}

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
}

function formatMemory(row: MemoryRow): Memory {
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

export function createMemory(userId: string, input: CreateMemoryInput): Memory {
  // Get user's space
  const space = getUserSpace(userId);
  if (!space) {
    throw new AppError(400, 'NO_SPACE', 'User is not in a space');
  }

  const id = uuid();
  const wordCount = input.content.split(/\s+/).filter(Boolean).length;

  dbPrepare(`
    INSERT INTO memories (id, space_id, content, mood, photos, location, voice_note, stickers, created_by, word_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    space.id,
    input.content,
    input.mood || null,
    input.photos ? JSON.stringify(input.photos) : null,
    input.location ? JSON.stringify(input.location) : null,
    input.voiceNote || null,
    input.stickers ? JSON.stringify(input.stickers) : null,
    userId,
    wordCount
  );

  return getMemoryById(id, userId)!;
}

export function getMemoryById(memoryId: string, userId: string): Memory | null {
  const row = dbPrepare(`
    SELECT m.* FROM memories m
    JOIN space_members sm ON m.space_id = sm.space_id
    WHERE m.id = ? AND sm.user_id = ?
  `).get(memoryId, userId) as MemoryRow | undefined;

  if (!row) return null;

  return formatMemory(row);
}

export function listMemories(
  userId: string,
  page: number = 1,
  pageSize: number = 20
): { data: Memory[]; total: number; page: number; pageSize: number; hasMore: boolean } {
  // Get user's space
  const space = getUserSpace(userId);
  if (!space) {
    return { data: [], total: 0, page, pageSize, hasMore: false };
  }

  const offset = (page - 1) * pageSize;

  const rows = dbPrepare(`
    SELECT * FROM memories
    WHERE space_id = ?
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(space.id, pageSize, offset) as MemoryRow[];

  const countResult = dbPrepare(`
    SELECT COUNT(*) as count FROM memories WHERE space_id = ?
  `).get(space.id) as { count: number };

  const total = countResult.count;
  const hasMore = offset + rows.length < total;

  return {
    data: rows.map(formatMemory),
    total,
    page,
    pageSize,
    hasMore,
  };
}

export function updateMemory(
  memoryId: string,
  userId: string,
  updates: Partial<CreateMemoryInput>
): Memory {
  // Check memory exists and user has access
  const existing = getMemoryById(memoryId, userId);
  if (!existing) {
    throw new AppError(404, 'MEMORY_NOT_FOUND', 'Memory not found');
  }

  const fields: string[] = [];
  const values: (string | number | null)[] = [];

  if (updates.content !== undefined) {
    fields.push('content = ?');
    values.push(updates.content);
    fields.push('word_count = ?');
    values.push(updates.content.split(/\s+/).filter(Boolean).length);
  }
  if (updates.mood !== undefined) {
    fields.push('mood = ?');
    values.push(updates.mood);
  }
  if (updates.photos !== undefined) {
    fields.push('photos = ?');
    values.push(JSON.stringify(updates.photos));
  }
  if (updates.location !== undefined) {
    fields.push('location = ?');
    values.push(JSON.stringify(updates.location));
  }
  if (updates.voiceNote !== undefined) {
    fields.push('voice_note = ?');
    values.push(updates.voiceNote);
  }
  if (updates.stickers !== undefined) {
    fields.push('stickers = ?');
    values.push(JSON.stringify(updates.stickers));
  }

  if (fields.length > 0) {
    values.push(memoryId);
    dbPrepare(`UPDATE memories SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  return getMemoryById(memoryId, userId)!;
}

export function deleteMemory(memoryId: string, userId: string): void {
  // Check memory exists and user has access
  const existing = getMemoryById(memoryId, userId);
  if (!existing) {
    throw new AppError(404, 'MEMORY_NOT_FOUND', 'Memory not found');
  }

  dbPrepare('DELETE FROM memories WHERE id = ?').run(memoryId);
}
