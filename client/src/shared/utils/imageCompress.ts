/**
 * Client-side image compression before upload.
 *
 * Resizes large photos down to MAX_DIMENSION on the longest edge
 * and re-encodes as JPEG at JPEG_QUALITY. This typically reduces
 * a 4-12 MB phone photo to 300-500 KB — a 70-80% reduction.
 *
 * Skipped for: GIFs (animated), videos, already-small files.
 */

const MAX_DIMENSION = 1920;
const JPEG_QUALITY = 0.85;
/** Files smaller than this are returned as-is (no point compressing). */
const MIN_COMPRESS_SIZE = 200 * 1024; // 200 KB
/** Files larger than this but within MAX_DIMENSION are still re-encoded to save bandwidth. */
const RE_ENCODE_THRESHOLD = 2 * 1024 * 1024; // 2 MB

/**
 * Compress a single image File.
 * Returns the original file unchanged for non-images, GIFs, and small files.
 */
export async function compressImage(file: File): Promise<File> {
  // Skip non-image files (videos, audio, etc.)
  if (!file.type.startsWith('image/')) return file;

  // Skip GIFs (may be animated — re-encoding would lose animation)
  if (file.type === 'image/gif') return file;

  // Skip already-small files
  if (file.size < MIN_COMPRESS_SIZE) return file;

  try {
    // Decode image off the main thread where supported
    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;

    // Check if resize is needed
    const needsResize = width > MAX_DIMENSION || height > MAX_DIMENSION;

    // If dimensions are fine and file isn't too large, skip
    if (!needsResize && file.size < RE_ENCODE_THRESHOLD) {
      bitmap.close();
      return file;
    }

    // Calculate target dimensions preserving aspect ratio
    const scale = needsResize
      ? Math.min(1, MAX_DIMENSION / Math.max(width, height))
      : 1;
    const targetW = Math.round(width * scale);
    const targetH = Math.round(height * scale);

    // Use OffscreenCanvas if available, otherwise fall back to regular canvas
    let blob: Blob;
    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(targetW, targetH);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        bitmap.close();
        return file;
      }
      ctx.drawImage(bitmap, 0, 0, targetW, targetH);
      bitmap.close();
      blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: JPEG_QUALITY });
    } else {
      // Fallback for environments without OffscreenCanvas
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        bitmap.close();
        return file;
      }
      ctx.drawImage(bitmap, 0, 0, targetW, targetH);
      bitmap.close();
      blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
          'image/jpeg',
          JPEG_QUALITY
        );
      });
    }

    // If compression actually made it larger (unlikely but possible for tiny PNGs), keep original
    if (blob.size >= file.size) {
      return file;
    }

    // Build a new File with .jpg extension
    const compressedName = file.name.replace(/\.[^.]+$/, '.jpg');
    return new File([blob], compressedName, {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch {
    // If anything fails (e.g. corrupt image), fall back to original
    return file;
  }
}

/**
 * Compress an array of files in parallel.
 * Non-image files pass through unchanged.
 */
export async function compressImages(files: File[]): Promise<File[]> {
  return Promise.all(files.map(compressImage));
}
