import type { PhotoResult } from '../hooks/usePhotoPicker';
import { Capacitor } from '@capacitor/core';

function normalizeImageMimeType(format?: string): string {
  if (!format) return 'image/jpeg';
  const normalized = format.toLowerCase();
  if (normalized === 'jpg') return 'image/jpeg';
  if (normalized === 'jpeg') return 'image/jpeg';
  if (normalized === 'png') return 'image/png';
  if (normalized === 'webp') return 'image/webp';
  if (normalized === 'gif') return 'image/gif';
  if (normalized === 'heic') return 'image/heic';
  return `image/${normalized}`;
}

function decodeDataUrl(dataUrl: string): { mimeType: string; blob: Blob } {
  const [header, payload] = dataUrl.split(',');
  const mimeMatch = header.match(/data:(.*?);base64/);
  const mimeType = mimeMatch?.[1] || 'image/jpeg';
  const binary = atob(payload || '');
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return {
    mimeType,
    blob: new Blob([bytes], { type: mimeType }),
  };
}

function resolveFetchableSource(source: string): string {
  if (/^(content|file):\/\//i.test(source)) {
    return Capacitor.convertFileSrc(source);
  }
  return source;
}

/** Extract native path (content:// or file://) from source if present */
function extractNativePath(source: string): string | undefined {
  if (/^(content|file):\/\//i.test(source)) {
    return source;
  }
  return undefined;
}

/** Extended File type with optional native path for video compression */
export interface FileWithNativePath extends File {
  _nativePath?: string;
}

export async function photoResultToFile(photo: PhotoResult, baseName: string): Promise<FileWithNativePath> {
  const fallbackMimeType = normalizeImageMimeType(photo.format);
  const extension = (photo.format || 'jpeg').toLowerCase();
  const filename = `${baseName}.${extension}`;

  if (import.meta.env.DEV) console.log('[PhotoFile Debug] Converting photo to file:', {
    sourceType: photo.sourceType,
    sourcePrefix: photo.source.substring(0, 100),
    format: photo.format,
    filename,
  });

  if (photo.source.startsWith('data:')) {
    const parsed = decodeDataUrl(photo.source);
    const file: FileWithNativePath = new File([parsed.blob], filename, { type: parsed.mimeType || fallbackMimeType });
    if (import.meta.env.DEV) console.log('[PhotoFile Debug] Created file from data URL:', { size: file.size, type: file.type });
    return file;
  }

  // Preserve native path for video compression on Android
  const nativePath = extractNativePath(photo.source);

  const source = resolveFetchableSource(photo.source);
  const response = await fetch(source);

  if (!response.ok) {
    throw new Error(`Failed to read selected photo (${response.status})`);
  }
  const blob = await response.blob();
  const file: FileWithNativePath = new File([blob], filename, { type: blob.type || fallbackMimeType });

  // Attach native path for video compression
  if (nativePath) {
    file._nativePath = nativePath;
  }

  if (import.meta.env.DEV) console.log('[PhotoFile Debug] Created file from fetch:', { size: file.size, type: file.type, nativePath });
  return file;
}
