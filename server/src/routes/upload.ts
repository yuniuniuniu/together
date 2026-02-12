import { Router } from 'express';
import path from 'path';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import {
  isR2Configured,
  getPresignedUploadUrl,
  deleteFromR2ByUrl,
} from '../services/r2Service.js';

const router = Router();

// Check R2 configuration at startup
if (!isR2Configured()) {
  console.warn('[Upload] R2 is not configured. File uploads will fail.');
}

// All routes require authentication
router.use(authenticate);

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
