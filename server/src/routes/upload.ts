import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import {
  isR2Configured,
  uploadToR2,
  getPresignedUploadUrl,
  deleteFromR2ByUrl,
} from '../services/r2Service.js';

const router = Router();

// Check R2 configuration at startup
if (!isR2Configured()) {
  console.warn('[Upload] R2 is not configured. File uploads will fail.');
}

// Configure multer storage - always use memory storage for R2
const storage = multer.memoryStorage();

// File filter for images (including GIF)
const imageFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
  }
};

// File filter for audio
const audioFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['audio/webm', 'audio/mp3', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-m4a', 'audio/mp4'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only audio files are allowed'));
  }
};

// File filter for video
const videoFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-m4v'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only video files are allowed (MP4, WebM, MOV, AVI, M4V)'));
  }
};

// File filter for media (images, GIFs, and videos)
const mediaFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-m4v'];
  const allowedTypes = [...imageTypes, ...videoTypes];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image and video files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const audioUpload = multer({
  storage,
  fileFilter: audioFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for audio
  },
});

const videoUpload = multer({
  storage,
  fileFilter: videoFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for video
  },
});

const mediaUpload = multer({
  storage,
  fileFilter: mediaFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit for media (handles both images and videos)
  },
});

// Helper function to handle file upload to R2
async function handleFileUpload(file: Express.Multer.File, folder: string = 'uploads'): Promise<{ url: string; filename: string }> {
  if (!file.buffer) {
    throw new Error('File buffer is empty');
  }

  const result = await uploadToR2(file.buffer, file.originalname, folder);
  return { url: result.url, filename: path.basename(result.key) };
}

// All routes require authentication
router.use(authenticate);

// POST /api/upload - Upload single file
router.post('/', upload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No file uploaded' },
      });
      return;
    }

    const { url, filename } = await handleFileUpload(req.file, 'images');

    res.json({
      success: true,
      data: {
        url,
        filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
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

// POST /api/upload/multiple - Upload multiple files
router.post('/multiple', upload.array('files', 10), async (req: AuthRequest, res) => {
  try {
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILES', message: 'No files uploaded' },
      });
      return;
    }

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const { url, filename } = await handleFileUpload(file, 'images');
        return {
          url,
          filename,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        };
      })
    );

    res.json({
      success: true,
      data: uploadedFiles,
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: 'Failed to upload files' },
    });
  }
});

// POST /api/upload/audio - Upload audio file
router.post('/audio', audioUpload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No audio file uploaded' },
      });
      return;
    }

    const { url, filename } = await handleFileUpload(req.file, 'audio');

    res.json({
      success: true,
      data: {
        url,
        filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  } catch (error) {
    console.error('Audio upload error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: 'Failed to upload audio' },
    });
  }
});

// POST /api/upload/video - Upload video file (max 30 seconds enforced on client)
router.post('/video', videoUpload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No video file uploaded' },
      });
      return;
    }

    const { url, filename } = await handleFileUpload(req.file, 'videos');

    res.json({
      success: true,
      data: {
        url,
        filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        type: 'video',
      },
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: 'Failed to upload video' },
    });
  }
});

// POST /api/upload/media - Upload any media file (image, GIF, or video)
router.post('/media', mediaUpload.single('file'), async (req: AuthRequest, res) => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        error: { code: 'NO_FILE', message: 'No media file uploaded' },
      });
      return;
    }

    const isVideo = req.file.mimetype.startsWith('video/');
    const isGif = req.file.mimetype === 'image/gif';
    const folder = isVideo ? 'videos' : 'images';

    const { url, filename } = await handleFileUpload(req.file, folder);

    res.json({
      success: true,
      data: {
        url,
        filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        type: isVideo ? 'video' : isGif ? 'gif' : 'image',
      },
    });
  } catch (error) {
    console.error('Media upload error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'UPLOAD_ERROR', message: 'Failed to upload media' },
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

    const result = await getPresignedUploadUrl(filename, folder);

    res.json({
      success: true,
      data: {
        uploadUrl: result.uploadUrl,
        key: result.key,
        publicUrl: result.publicUrl,
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
