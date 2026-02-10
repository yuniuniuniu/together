import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// R2 Configuration - read dynamically to support dotenv loading
function getConfig() {
  return {
    accountId: process.env.R2_ACCOUNT_ID || '',
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
    bucket: process.env.R2_BUCKET || 'together',
    publicDomain: process.env.R2_PUBLIC_DOMAIN || '', // e.g., 'files.yourdomain.com'
  };
}

function getPublicUrl() {
  const { publicDomain, accountId, bucket } = getConfig();
  // If custom domain is configured, use it; otherwise use R2.dev public URL
  if (publicDomain) {
    return `https://${publicDomain}`;
  }
  // Fallback to R2.dev public URL (needs to be enabled in Cloudflare dashboard)
  return `https://pub-${accountId}.r2.dev`;
}

// Check if R2 is configured
export function isR2Configured(): boolean {
  const { accountId, accessKeyId, secretAccessKey } = getConfig();
  return !!(accountId && accessKeyId && secretAccessKey);
}

// Alias for backward compatibility
export const isCosConfigured = isR2Configured;

// Create S3 client for R2
let r2Client: S3Client | null = null;

function getR2Client(): S3Client {
  if (!r2Client) {
    if (!isR2Configured()) {
      throw new Error('R2 is not configured. Please set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY environment variables.');
    }

    const { accountId, accessKeyId, secretAccessKey } = getConfig();
    r2Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return r2Client;
}

// Determine content type from file extension
function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes: Record<string, string> = {
    // Images
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    // Videos
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.m4v': 'video/x-m4v',
    // Audio
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg',
    '.m4a': 'audio/mp4',
    '.aac': 'audio/aac',
  };
  return contentTypes[ext] || 'application/octet-stream';
}

// Upload file to R2
export async function uploadToR2(
  buffer: Buffer,
  originalFilename: string,
  folder: string = 'uploads'
): Promise<{ url: string; key: string }> {
  const client = getR2Client();
  const { bucket } = getConfig();

  const ext = path.extname(originalFilename);
  const key = `${folder}/${uuidv4()}${ext}`;
  const contentType = getContentType(originalFilename);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await client.send(command);

  // Return public URL
  const url = `${getPublicUrl()}/${key}`;

  return { url, key };
}

// Alias for backward compatibility
export const uploadToCos = uploadToR2;

// Delete file from R2
export async function deleteFromR2(key: string): Promise<void> {
  const client = getR2Client();
  const { bucket } = getConfig();

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await client.send(command);
}

// Alias for backward compatibility
export const deleteFromCos = deleteFromR2;

// Generate presigned URL for direct upload (optional, for large files)
export async function getPresignedUploadUrl(
  filename: string,
  folder: string = 'uploads',
  expiresIn: number = 3600
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
  const client = getR2Client();
  const { bucket } = getConfig();

  const ext = path.extname(filename);
  const key = `${folder}/${uuidv4()}${ext}`;
  const contentType = getContentType(filename);

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });

  const publicUrl = `${getPublicUrl()}/${key}`;

  return { uploadUrl, key, publicUrl };
}

// Extract key from R2 URL (supports both custom domain and r2.dev URLs)
export function extractKeyFromUrl(url: string): string | null {
  if (!url) return null;

  const { publicDomain } = getConfig();

  // Handle custom domain URL pattern: https://{custom-domain}/{key}
  if (publicDomain && url.includes(publicDomain)) {
    const pattern = new RegExp(`https?://${publicDomain.replace(/\./g, '\\.')}/(.+)$`);
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // Handle R2.dev URL pattern: https://pub-{accountId}.r2.dev/{key}
  const r2DevPattern = /\.r2\.dev\/(.+)$/;
  const r2Match = url.match(r2DevPattern);
  if (r2Match) return r2Match[1];

  // Handle legacy COS URL pattern for migration: https://{bucket}.cos.{region}.myqcloud.com/{key}
  const cosPattern = /\.cos\.[a-z-]+\.myqcloud\.com\/(.+)$/;
  const cosMatch = url.match(cosPattern);
  if (cosMatch) return cosMatch[1];

  return null;
}

// Delete file by URL
export async function deleteFromR2ByUrl(url: string): Promise<void> {
  const key = extractKeyFromUrl(url);
  if (key) {
    await deleteFromR2(key);
  }
}

// Alias for backward compatibility
export const deleteFromCosByUrl = deleteFromR2ByUrl;
