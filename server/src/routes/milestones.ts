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
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const milestones = await listMilestones(req.user!.id);

    res.json({
      success: true,
      data: milestones,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/milestones - Create milestone
router.post(
  '/',
  validate({
    title: { required: true, type: 'string', minLength: 1 },
    date: { required: true, type: 'string' },
    type: { required: true, type: 'string' },
  }),
  async (req: AuthRequest, res, next) => {
    try {
      const { title, description, date, type, icon, photos, location } = req.body;
      const milestone = await createMilestone(req.user!.id, {
        title,
        description,
        date,
        type,
        icon,
        photos,
        location,
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
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const milestoneId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const milestone = await getMilestoneById(milestoneId, req.user!.id);

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
router.put('/:id', async (req: AuthRequest, res, next) => {
  try {
    const milestoneId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const { title, description, date, type, icon, photos, location } = req.body;
    const milestone = await updateMilestone(milestoneId, req.user!.id, {
      title,
      description,
      date,
      type,
      icon,
      photos,
      location,
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
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const milestoneId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteMilestone(milestoneId, req.user!.id);

    res.json({
      success: true,
      message: 'Milestone deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
