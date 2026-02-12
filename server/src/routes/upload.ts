import { Router } from 'express';
import path from 'path';
import multer from 'multer';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import {
  isR2Configured,
  getPresignedUploadUrl,
  deleteFromR2ByUrl,
  uploadToR2,
} from '../services/r2Service.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    // Keep a generous cap for short videos while preventing abuse.
    fileSize: 150 * 1024 * 1024,
    files: 10,
  },
  fileFilter: (_req, file, callback) => {
    const allowedMimePrefixes = ['image/', 'video/', 'audio/'];
    const isAllowed = allowedMimePrefixes.some((prefix) => file.mimetype.startsWith(prefix));
    callback(isAllowed ? null : new Error('Unsupported file type'));
  },
});

// Check R2 configuration at startup
if (!isR2Configured()) {
  console.warn('[Upload] R2 is not configured. File uploads will fail.');
}

// All routes require authentication
router.use(authenticate);

// POST /api/upload - Upload a single media file via backend proxy
router.post('/', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const request = req as AuthRequest & { file?: Express.Multer.File };
    const file = request.file;

    if (!file) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'File is required' },
      });
      return;
    }

    const requestedFolder = typeof req.body?.folder === 'string' ? req.body.folder : 'uploads';
    const { url, key } = await uploadToR2(file.buffer, file.originalname, requestedFolder, file.mimetype);
    const filename = path.basename(key);
    const type: 'image' | 'gif' | 'video' =
      file.mimetype.startsWith('video/')
        ? 'video'
        : file.mimetype === 'image/gif'
          ? 'gif'
          : 'image';

    res.json({
      success: true,
      data: {
        url,
        key,
        filename,
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size,
        type,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: 'Failed to upload file' },
    });
  }
});

// POST /api/upload/multiple - Upload multiple media files via backend proxy
router.post('/multiple', upload.array('files', 10), async (req: AuthRequest, res) => {
  try {
    const request = req as AuthRequest & { files?: Express.Multer.File[] };
    const files = request.files ?? [];

    if (files.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILES', message: 'At least one file is required' },
      });
      return;
    }

    const requestedFolder = typeof req.body?.folder === 'string' ? req.body.folder : 'uploads';
    const uploaded = await Promise.all(
      files.map(async (file) => {
        const { url, key } = await uploadToR2(file.buffer, file.originalname, requestedFolder, file.mimetype);
        const filename = path.basename(key);
        const type: 'image' | 'gif' | 'video' =
          file.mimetype.startsWith('video/')
            ? 'video'
            : file.mimetype === 'image/gif'
              ? 'gif'
              : 'image';

        return {
          url,
          key,
          filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          type,
        };
      })
    );

    res.json({
      success: true,
      data: uploaded,
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: 'Failed to upload files' },
    });
  }
});

// POST /api/upload/presign - Get presigned URL for direct upload to R2
router.post('/presign', async (req: AuthRequest, res) => {
  try {
    const { filename, folder = 'uploads', contentType } = req.body;

    if (!filename) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILENAME', message: 'Filename is required' },
      });
      return;
    }

    // Validate file type
    const ext = path.extname(filename).toLowerCase();
    const allowedExtensions = [
      // Images
      '.jpg', '.jpeg', '.png', '.gif', '.webp',
      // Videos
      '.mp4', '.webm', '.mov', '.avi', '.m4v',
      // Audio
      '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.webm',
    ];

    if (!allowedExtensions.includes(ext)) {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_TYPE', message: 'File type not allowed' },
      });
      return;
    }

    if (contentType && typeof contentType !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_CONTENT_TYPE', message: 'contentType must be a string' },
      });
      return;
    }

    const result = await getPresignedUploadUrl(filename, folder, 3600, contentType);

    res.json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        key: result.key,
        publicUrl: result.publicUrl,
        contentType: result.contentType,
      },
    });
  } catch (error) {
    console.error('Presign error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'PRESIGN_ERROR', message: 'Failed to generate presigned URL' },
    });
  }
});

// DELETE /api/upload/delete - Delete file from R2
router.delete('/delete', async (req: AuthRequest, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_URL', message: 'URL is required' },
      });
      return;
    }

    await deleteFromR2ByUrl(url);

    res.json({
      success: true,
      data: { message: 'File deleted successfully' },
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_ERROR', message: 'Failed to delete file' },
    });
  }
});

export default router;
