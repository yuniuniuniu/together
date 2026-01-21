import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { authenticate, type AuthRequest } from '../middleware/auth.js';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  },
});

// File filter for images
const imageFilter = (_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// All routes require authentication
router.use(authenticate);

// POST /api/upload - Upload single file
router.post('/', upload.single('file'), (req: AuthRequest, res) => {
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: { code: 'NO_FILE', message: 'No file uploaded' },
    });
    return;
  }

  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    success: true,
    data: {
      url: fileUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    },
  });
});

// POST /api/upload/multiple - Upload multiple files
router.post('/multiple', upload.array('files', 10), (req: AuthRequest, res) => {
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    res.status(400).json({
      success: false,
      error: { code: 'NO_FILES', message: 'No files uploaded' },
    });
    return;
  }

  const uploadedFiles = files.map((file) => ({
    url: `/uploads/${file.filename}`,
    filename: file.filename,
    originalName: file.originalname,
    size: file.size,
    mimetype: file.mimetype,
  }));

  res.json({
    success: true,
    data: uploadedFiles,
  });
});

export default router;
