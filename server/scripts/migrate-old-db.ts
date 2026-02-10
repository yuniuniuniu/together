import initSqlJs from 'sql.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import { isR2Configured, uploadToR2 } from '../src/services/r2Service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const serverRoot = join(__dirname, '..');

const OLD_DB_PATH = join(serverRoot, 'data', 'old_sanctuary.db');
const NEW_DB_PATH = join(serverRoot, 'data', 'sanctuary.db');
const UPLOADS_DIR = join(serverRoot, 'uploads');

dotenv.config({ path: join(serverRoot, '.env') });
dotenv.config({ path: join(serverRoot, '.env.production') });

function isR2Url(url: string): boolean {
  const publicDomain = process.env.R2_PUBLIC_DOMAIN || '';
  return url.includes('.r2.dev') || (publicDomain && url.includes(publicDomain));
}

function extractFilename(url: string): string | null {
  try {
    const parsed = new URL(url);
    const filename = parsed.pathname.split('/').pop();
    return filename ? decodeURIComponent(filename) : null;
  } catch {
    const parts = url.split('/');
    return parts[parts.length - 1] || null;
  }
}

function getFolderByExtension(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.mp4') || lower.endsWith('.webm') || lower.endsWith('.mov') || lower.endsWith('.avi') || lower.endsWith('.m4v')) {
    return 'videos';
  }
  if (lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.ogg') || lower.endsWith('.m4a') || lower.endsWith('.aac')) {
    return 'audio';
  }
  return 'images';
}

async function migrateUrl(url: string, cache: Map<string, string>): Promise<string> {
  if (!url || isR2Url(url)) {
    return url;
  }

  const cached = cache.get(url);
  if (cached) return cached;

  const filename = extractFilename(url);
  if (!filename) {
    console.warn(`[Migrate] Unable to parse filename for URL: ${url}`);
    return url;
  }

  const localPath = join(UPLOADS_DIR, filename);
  if (!existsSync(localPath)) {
    console.warn(`[Migrate] Missing local file for URL: ${url}`);
    return url;
  }

  const buffer = readFileSync(localPath);
  const folder = getFolderByExtension(filename);
  const result = await uploadToR2(buffer, filename, folder);
  cache.set(url, result.url);
  return result.url;
}

async function transformUrlField(
  value: string | null,
  cache: Map<string, string>
): Promise<{ newValue: string | null; changed: boolean }> {
  if (!value) return { newValue: value, changed: false };

  const trimmed = value.trim();
  if (!trimmed) return { newValue: value, changed: false };

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      const migrated = [];
      let changed = false;
      for (const item of parsed) {
        if (typeof item === 'string') {
          const next = await migrateUrl(item, cache);
          migrated.push(next);
          if (next !== item) changed = true;
        }
      }
      return { newValue: JSON.stringify(migrated), changed };
    }
    if (typeof parsed === 'string') {
      const next = await migrateUrl(parsed, cache);
      return { newValue: next, changed: next !== parsed };
    }
  } catch {
    // Not JSON, treat as a single URL string
  }

  const next = await migrateUrl(trimmed, cache);
  return { newValue: next, changed: next !== trimmed };
}

async function main(): Promise<void> {
  if (!existsSync(OLD_DB_PATH)) {
    throw new Error(`Legacy database not found at ${OLD_DB_PATH}`);
  }
  if (!existsSync(UPLOADS_DIR)) {
    throw new Error(`Uploads directory not found at ${UPLOADS_DIR}`);
  }
  if (!isR2Configured()) {
    throw new Error('R2 is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY.');
  }

  const SQL = await initSqlJs();
  const oldBuffer = readFileSync(OLD_DB_PATH);
  const db = new SQL.Database(oldBuffer);

  const cache = new Map<string, string>();
  let updatedUsers = 0;
  let updatedMemories = 0;
  let updatedMilestones = 0;

  const userStmt = db.prepare('SELECT id, avatar FROM users WHERE avatar IS NOT NULL AND avatar != ""');
  const users: Array<{ id: string; avatar: string }> = [];
  while (userStmt.step()) {
    users.push(userStmt.getAsObject() as { id: string; avatar: string });
  }
  userStmt.free();

  for (const user of users) {
    const result = await transformUrlField(user.avatar, cache);
    if (result.changed && result.newValue) {
      db.run('UPDATE users SET avatar = ? WHERE id = ?', [result.newValue, user.id]);
      updatedUsers += 1;
    }
  }

  const memoryStmt = db.prepare('SELECT id, photos, voice_note FROM memories WHERE photos IS NOT NULL OR voice_note IS NOT NULL');
  const memories: Array<{ id: string; photos: string | null; voice_note: string | null }> = [];
  while (memoryStmt.step()) {
    memories.push(memoryStmt.getAsObject() as { id: string; photos: string | null; voice_note: string | null });
  }
  memoryStmt.free();

  for (const memory of memories) {
    const photosResult = await transformUrlField(memory.photos, cache);
    const voiceResult = await transformUrlField(memory.voice_note, cache);
    if (photosResult.changed || voiceResult.changed) {
      db.run('UPDATE memories SET photos = ?, voice_note = ? WHERE id = ?', [
        photosResult.newValue,
        voiceResult.newValue,
        memory.id,
      ]);
      updatedMemories += 1;
    }
  }

  const milestoneStmt = db.prepare('SELECT id, photos, icon FROM milestones WHERE photos IS NOT NULL OR icon IS NOT NULL');
  const milestones: Array<{ id: string; photos: string | null; icon: string | null }> = [];
  while (milestoneStmt.step()) {
    milestones.push(milestoneStmt.getAsObject() as { id: string; photos: string | null; icon: string | null });
  }
  milestoneStmt.free();

  for (const milestone of milestones) {
    const photosResult = await transformUrlField(milestone.photos, cache);
    const iconResult = await transformUrlField(milestone.icon, cache);
    if (photosResult.changed || iconResult.changed) {
      db.run('UPDATE milestones SET photos = ?, icon = ? WHERE id = ?', [
        photosResult.newValue,
        iconResult.newValue,
        milestone.id,
      ]);
      updatedMilestones += 1;
    }
  }

  const data = db.export();
  const buffer = Buffer.from(data);
  writeFileSync(NEW_DB_PATH, buffer);

  console.log('[Migrate] Done.');
  console.log(`[Migrate] Updated users: ${updatedUsers}`);
  console.log(`[Migrate] Updated memories: ${updatedMemories}`);
  console.log(`[Migrate] Updated milestones: ${updatedMilestones}`);
  console.log(`[Migrate] Output database: ${NEW_DB_PATH}`);
}

main().catch((error) => {
  console.error('[Migrate] Failed:', error);
  process.exit(1);
});
