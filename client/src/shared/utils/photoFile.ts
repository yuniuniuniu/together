import type { PhotoResult } from '../hooks/usePhotoPicker';

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

export async function photoResultToFile(photo: PhotoResult, baseName: string): Promise<File> {
  const fallbackMimeType = normalizeImageMimeType(photo.format);
  const extension = (photo.format || 'jpeg').toLowerCase();
  const filename = `${baseName}.${extension}`;

  if (photo.dataUrl.startsWith('data:')) {
    const parsed = decodeDataUrl(photo.dataUrl);
    return new File([parsed.blob], filename, { type: parsed.mimeType || fallbackMimeType });
  }

  const response = await fetch(photo.dataUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || fallbackMimeType });
}
