/**
 * Video compression utility for Android.
 *
 * On Android, uses native MediaCodec for hardware-accelerated compression.
 * On other platforms (iOS, Web), returns the original file unchanged.
 */

import { Capacitor } from '@capacitor/core';
import { Platform } from './platform';
import VideoCompressor from '../plugins/VideoCompressor';
import type { FileWithNativePath } from './photoFile';

/** Minimum file size to compress (5MB) */
const MIN_COMPRESS_SIZE = 5 * 1024 * 1024;

/**
 * Compress a video file on Android.
 * Returns the original file unchanged on other platforms or if no native path available.
 */
export async function compressVideo(file: File): Promise<File> {
  // Only compress videos
  if (!file.type.startsWith('video/')) {
    return file;
  }

  // Only compress on Android
  if (!Platform.isAndroid()) {
    return file;
  }

  // Need native path for compression
  const nativePath = (file as FileWithNativePath)._nativePath;
  if (!nativePath) {
    if (import.meta.env.DEV) {
      console.log('[VideoCompress] No native path available, skipping compression');
    }
    return file;
  }

  // Skip small videos
  if (file.size < MIN_COMPRESS_SIZE) {
    if (import.meta.env.DEV) {
      console.log('[VideoCompress] Skipping small video:', file.size);
    }
    return file;
  }

  try {
    if (import.meta.env.DEV) {
      console.log('[VideoCompress] Starting compression:', {
        name: file.name,
        size: file.size,
        type: file.type,
        path: nativePath,
      });
    }

    const result = await VideoCompressor.compress({
      path: nativePath,
      quality: 'medium',
    });

    if (import.meta.env.DEV) {
      console.log('[VideoCompress] Compression result:', result);
    }

    // Fetch the compressed file
    const compressedPath = Capacitor.convertFileSrc(result.path);
    const response = await fetch(compressedPath);
    const blob = await response.blob();

    // Create new File with compressed data
    const compressedFile = new File([blob], file.name, {
      type: 'video/mp4',
      lastModified: Date.now(),
    });

    if (import.meta.env.DEV) {
      const savings = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
      console.log('[VideoCompress] Compression complete:', {
        originalSize: file.size,
        compressedSize: compressedFile.size,
        savings: `${savings}%`,
      });
    }

    return compressedFile;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('[VideoCompress] Compression failed, using original:', error);
    }
    // Fall back to original file on error
    return file;
  }
}
