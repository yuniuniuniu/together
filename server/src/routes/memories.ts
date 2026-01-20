import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import {
  createMemory,
  getMemoryById,
  listMemories,
  updateMemory,
  deleteMemory,
} from '../services/memoryService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/memories - List memories
router.get('/', (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;

  const result = listMemories(req.user!.id, page, pageSize);

  res.json({
    success: true,
    ...result,
  });
});

// POST /api/memories - Create memory
router.post(
  '/',
  validate({
    content: { required: true, type: 'string', minLength: 1 },
  }),
  (req: AuthRequest, res, next) => {
    try {
      const { content, mood, photos, location, voiceNote, stickers } = req.body;
      const memory = createMemory(req.user!.id, {
        content,
        mood,
        photos,
        location,
        voiceNote,
        stickers,
      });

      res.status(201).json({
        success: true,
        data: memory,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/memories/:id - Get memory by ID
router.get('/:id', (req: AuthRequest, res, next) => {
  try {
    const memory = getMemoryById(req.params.id, req.user!.id);

    if (!memory) {
      throw new AppError(404, 'MEMORY_NOT_FOUND', 'Memory not found');
    }

    res.json({
      success: true,
      data: memory,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/memories/:id - Update memory
router.put('/:id', (req: AuthRequest, res, next) => {
  try {
    const { content, mood, photos, location, voiceNote, stickers } = req.body;
    const memory = updateMemory(req.params.id, req.user!.id, {
      content,
      mood,
      photos,
      location,
      voiceNote,
      stickers,
    });

    res.json({
      success: true,
      data: memory,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/memories/:id - Delete memory
router.delete('/:id', (req: AuthRequest, res, next) => {
  try {
    deleteMemory(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Memory deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
