import { v4 as uuid } from 'uuid';
import { dbPrepare } from '../db/index.js';
import { AppError } from '../middleware/errorHandler.js';
import { getUserSpace } from './spaceService.js';

interface MilestoneRow {
  id: string;
  space_id: string;
  title: string;
  description: string | null;
  date: string;
  type: string;
  icon: string | null;
  photos: string | null;
  created_at: string;
  created_by: string;
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
}

function formatMilestone(row: MilestoneRow): Milestone {
  return {
    id: row.id,
    spaceId: row.space_id,
    title: row.title,
    description: row.description || undefined,
    date: row.date,
    type: row.type,
    icon: row.icon || undefined,
    photos: row.photos ? JSON.parse(row.photos) : [],
    createdAt: row.created_at,
    createdBy: row.created_by,
  };
}

export function createMilestone(userId: string, input: CreateMilestoneInput): Milestone {
  // Get user's space
  const space = getUserSpace(userId);
  if (!space) {
    throw new AppError(400, 'NO_SPACE', 'User is not in a space');
  }

  const id = uuid();

  dbPrepare(`
    INSERT INTO milestones (id, space_id, title, description, date, type, icon, photos, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    space.id,
    input.title,
    input.description || null,
    input.date,
    input.type,
    input.icon || null,
    input.photos ? JSON.stringify(input.photos) : null,
    userId
  );

  return getMilestoneById(id, userId)!;
}

export function getMilestoneById(milestoneId: string, userId: string): Milestone | null {
  const row = dbPrepare(`
    SELECT m.* FROM milestones m
    JOIN space_members sm ON m.space_id = sm.space_id
    WHERE m.id = ? AND sm.user_id = ?
  `).get(milestoneId, userId) as MilestoneRow | undefined;

  if (!row) return null;

  return formatMilestone(row);
}

export function listMilestones(userId: string): Milestone[] {
  // Get user's space
  const space = getUserSpace(userId);
  if (!space) {
    return [];
  }

  const rows = dbPrepare(`
    SELECT * FROM milestones
    WHERE space_id = ?
    ORDER BY date ASC
  `).all(space.id) as MilestoneRow[];

  return rows.map(formatMilestone);
}

export function updateMilestone(
  milestoneId: string,
  userId: string,
  updates: Partial<CreateMilestoneInput>
): Milestone {
  // Check milestone exists and user has access
  const existing = getMilestoneById(milestoneId, userId);
  if (!existing) {
    throw new AppError(404, 'MILESTONE_NOT_FOUND', 'Milestone not found');
  }

  const fields: string[] = [];
  const values: (string | null)[] = [];

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
    values.push(JSON.stringify(updates.photos));
  }

  if (fields.length > 0) {
    values.push(milestoneId);
    dbPrepare(`UPDATE milestones SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  return getMilestoneById(milestoneId, userId)!;
}

export function deleteMilestone(milestoneId: string, userId: string): void {
  // Check milestone exists and user has access
  const existing = getMilestoneById(milestoneId, userId);
  if (!existing) {
    throw new AppError(404, 'MILESTONE_NOT_FOUND', 'Milestone not found');
  }

  dbPrepare('DELETE FROM milestones WHERE id = ?').run(milestoneId);
}
