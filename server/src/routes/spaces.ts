import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import {
  createSpace,
  getSpaceById,
  getUserSpace,
  joinSpaceByInviteCode,
  deleteSpace,
} from '../services/spaceService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/spaces - Create new space
router.post(
  '/',
  validate({
    anniversaryDate: { required: true, type: 'string' },
  }),
  (req: AuthRequest, res, next) => {
    try {
      const { anniversaryDate } = req.body;
      const space = createSpace(req.user!.id, anniversaryDate);

      res.status(201).json({
        success: true,
        data: space,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/spaces/my - Get current user's space
router.get('/my', (req: AuthRequest, res) => {
  const space = getUserSpace(req.user!.id);

  res.json({
    success: true,
    data: space,
  });
});

// POST /api/spaces/join - Join space via invite code
router.post(
  '/join',
  validate({
    inviteCode: { required: true, type: 'string' },
  }),
  (req: AuthRequest, res, next) => {
    try {
      const { inviteCode } = req.body;
      const space = joinSpaceByInviteCode(req.user!.id, inviteCode);

      res.json({
        success: true,
        data: space,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/spaces/:id - Get space by ID
router.get('/:id', (req: AuthRequest, res, next) => {
  try {
    const space = getSpaceById(req.params.id);

    if (!space) {
      throw new AppError(404, 'SPACE_NOT_FOUND', 'Space not found');
    }

    res.json({
      success: true,
      data: space,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/spaces/:id - Delete space (unbind)
router.delete('/:id', (req: AuthRequest, res, next) => {
  try {
    deleteSpace(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Space deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
