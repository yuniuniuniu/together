import fs from 'fs';
import path from 'path';

const uploadsDir = path.join(process.cwd(), 'uploads');

/**
 * Extract file paths from a URL that points to uploads
 * @param url URL like /uploads/abc.jpg
 * @returns filename or null if not a local upload
 */
function extractFilename(url: string | null | undefined): string | null {
  if (!url) return null;

  // Handle /uploads/filename format
  if (url.startsWith('/uploads/')) {
    return url.substring('/uploads/'.length);
  }

  return null;
}

/**
 * Delete a single file from uploads
 */
export async function deleteUploadedFile(url: string | null | undefined): Promise<void> {
  const filename = extractFilename(url);
  if (!filename) return;

  const filePath = path.join(uploadsDir, filename);

  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[FileService] Deleted file: ${filename}`);
    }
  } catch (error) {
    console.error(`[FileService] Failed to delete file ${filename}:`, error);
    // Don't throw - file cleanup should not break the main operation
  }
}

/**
 * Delete multiple files from uploads
 */
export async function deleteUploadedFiles(urls: (string | null | undefined)[]): Promise<void> {
  await Promise.all(urls.map(url => deleteUploadedFile(url)));
}

/**
 * Delete files associated with a memory
 * @param photos JSON string of photo URLs or array
 * @param voiceNote voice note URL
 */
export async function deleteMemoryFiles(
  photos: string | string[] | null,
  voiceNote: string | null
): Promise<void> {
  const urls: string[] = [];

  // Parse photos if it's a JSON string
  if (photos) {
    if (typeof photos === 'string') {
      try {
        const parsed = JSON.parse(photos);
        if (Array.isArray(parsed)) {
          urls.push(...parsed);
        }
      } catch {
        // Not JSON, might be a single URL
        urls.push(photos);
      }
    } else if (Array.isArray(photos)) {
      urls.push(...photos);
    }
  }

  // Add voice note
  if (voiceNote) {
    urls.push(voiceNote);
  }

  await deleteUploadedFiles(urls);
}

/**
 * Delete files associated with a milestone
 * @param photos JSON string of photo URLs or array
 */
export async function deleteMilestoneFiles(
  photos: string | string[] | null
): Promise<void> {
  const urls: string[] = [];

  // Parse photos if it's a JSON string
  if (photos) {
    if (typeof photos === 'string') {
      try {
        const parsed = JSON.parse(photos);
        if (Array.isArray(parsed)) {
          urls.push(...parsed);
        }
      } catch {
        // Not JSON, might be a single URL
        urls.push(photos);
      }
    } else if (Array.isArray(photos)) {
      urls.push(...photos);
    }
  }

  await deleteUploadedFiles(urls);
}
