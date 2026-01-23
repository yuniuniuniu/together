import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { isR2Configured, uploadToR2 } from '../services/r2Service.js';

const router = Router();

// Check if we should use R2 (production) or local storage (development)
const useR2 = process.env.NODE_ENV === 'production' && isR2Configured();

// Ensure uploads directory exists (for local storage)
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
// In production with R2: use memory storage
// In development: use disk storage
const storage = useR2
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
      },
      filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
      },
    });

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
    fileSize: 50 * 1024 * 1024, // 50MB limit for video
  },
});

const mediaUpload = multer({
  storage,
  fileFilter: mediaFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for media (handles both images and videos)
  },
});

// Helper function to handle file upload (R2 or local)
async function handleFileUpload(file: Express.Multer.File, folder: string = 'uploads'): Promise<{ url: string; filename: string }> {
  if (useR2 && file.buffer) {
    // Upload to R2
    const result = await uploadToR2(file.buffer, file.originalname, folder);
    return { url: result.url, filename: path.basename(result.key) };
  } else {
    // Local storage - file is already saved by multer
    return {
      url: `/uploads/${file.filename}`,
      filename: file.filename,
    };
  }
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

export default router;
