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
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;

    const result = await listMemories(req.user!.id, page, pageSize);

    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/memories - Create memory
router.post(
  '/',
  validate({
    content: { required: true, type: 'string', minLength: 1 },
  }),
  async (req: AuthRequest, res, next) => {
    try {
      const { content, mood, photos, location, voiceNote, stickers, date } = req.body;
      const memory = await createMemory(req.user!.id, {
        content,
        mood,
        photos,
        location,
        voiceNote,
        stickers,
        date,
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
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const memoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const memory = await getMemoryById(memoryId, req.user!.id);

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
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const memoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { content, mood, photos, location, voiceNote, stickers } = req.body;
    const memory = await updateMemory(memoryId, req.user!.id, {
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
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const memoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteMemory(memoryId, req.user!.id);

    res.json({
      success: true,
      message: 'Memory deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
