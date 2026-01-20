import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import {
  createMilestone,
  getMilestoneById,
  listMilestones,
  updateMilestone,
  deleteMilestone,
} from '../services/milestoneService.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/milestones - List milestones
router.get('/', (req: AuthRequest, res) => {
  const milestones = listMilestones(req.user!.id);

  res.json({
    success: true,
    data: milestones,
  });
});

// POST /api/milestones - Create milestone
router.post(
  '/',
  validate({
    title: { required: true, type: 'string', minLength: 1 },
    date: { required: true, type: 'string' },
    type: { required: true, type: 'string' },
  }),
  (req: AuthRequest, res, next) => {
    try {
      const { title, description, date, type, icon, photos } = req.body;
      const milestone = createMilestone(req.user!.id, {
        title,
        description,
        date,
        type,
        icon,
        photos,
      });

      res.status(201).json({
        success: true,
        data: milestone,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/milestones/:id - Get milestone by ID
router.get('/:id', (req: AuthRequest, res, next) => {
  try {
    const milestone = getMilestoneById(req.params.id, req.user!.id);

    if (!milestone) {
      throw new AppError(404, 'MILESTONE_NOT_FOUND', 'Milestone not found');
    }

    res.json({
      success: true,
      data: milestone,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/milestones/:id - Update milestone
router.put('/:id', (req: AuthRequest, res, next) => {
  try {
    const { title, description, date, type, icon, photos } = req.body;
    const milestone = updateMilestone(req.params.id, req.user!.id, {
      title,
      description,
      date,
      type,
      icon,
      photos,
    });

    res.json({
      success: true,
      data: milestone,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/milestones/:id - Delete milestone
router.delete('/:id', (req: AuthRequest, res, next) => {
  try {
    deleteMilestone(req.params.id, req.user!.id);

    res.json({
      success: true,
      message: 'Milestone deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
