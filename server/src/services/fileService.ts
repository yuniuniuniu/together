import { deleteFromR2ByUrl } from './r2Service.js';

/**
 * Delete a single file from R2 storage
 */
export async function deleteUploadedFile(url: string | null | undefined): Promise<void> {
  if (!url) return;

  try {
    // Check if it's an R2 URL (custom domain, r2.dev, or legacy COS URL)
    const isR2Url = url.includes('.r2.dev') ||
                    url.includes(process.env.R2_PUBLIC_DOMAIN || '') ||
                    // Support legacy COS URLs during migration
                    (url.includes('.cos.') && url.includes('.myqcloud.com'));

    if (isR2Url) {
      await deleteFromR2ByUrl(url);
      console.log(`[FileService] Deleted file from R2: ${url}`);
    }
  } catch (error) {
    console.error(`[FileService] Failed to delete file ${url}:`, error);
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
