import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import {
  toggleReaction,
  getReactionsByMemory,
  getUserReaction,
} from '../services/reactionService.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/reactions/:memoryId - Toggle reaction on a memory
router.post('/:memoryId', async (req: AuthRequest, res, next) => {
  try {
    const memoryId = Array.isArray(req.params.memoryId) ? req.params.memoryId[0] : req.params.memoryId;
    const { type = 'love' } = req.body;
    const result = await toggleReaction(memoryId, req.user!.id, type);

    res.json({
      success: true,
      action: result.action,
      data: result.reaction || null,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reactions/:memoryId - Get all reactions for a memory
router.get('/:memoryId', async (req: AuthRequest, res, next) => {
  try {
    const memoryId = Array.isArray(req.params.memoryId) ? req.params.memoryId[0] : req.params.memoryId;
    const reactions = await getReactionsByMemory(memoryId, req.user!.id);

    res.json({
      success: true,
      data: reactions,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reactions/:memoryId/me - Get current user's reaction
router.get('/:memoryId/me', async (req: AuthRequest, res, next) => {
  try {
    const memoryId = Array.isArray(req.params.memoryId) ? req.params.memoryId[0] : req.params.memoryId;
    const reaction = await getUserReaction(memoryId, req.user!.id);

    res.json({
      success: true,
      data: reaction,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
