import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import {
  createSpace,
  getSpaceById,
  getUserSpace,
  joinSpaceByInviteCode,
  deleteSpace,
  requestUnbind,
  cancelUnbind,
  getUnbindStatus,
  updateAnniversaryDate,
  getPetNames,
  updatePetNames,
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
  async (req: AuthRequest, res, next) => {
    try {
      const { anniversaryDate } = req.body;
      const space = await createSpace(req.user!.id, anniversaryDate);

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
router.get('/my', async (req: AuthRequest, res, next) => {
  try {
    const space = await getUserSpace(req.user!.id);

    res.json({
      success: true,
      data: space,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/spaces/join - Join space via invite code
router.post(
  '/join',
  validate({
    inviteCode: { required: true, type: 'string' },
  }),
  async (req: AuthRequest, res, next) => {
    try {
      const { inviteCode } = req.body;
      const space = await joinSpaceByInviteCode(req.user!.id, inviteCode);

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
router.get('/:id', async (req: AuthRequest, res, next) => {
  try {
    const spaceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const space = await getSpaceById(spaceId);

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

// PUT /api/spaces/:id - Update space (anniversary date)
router.put(
  '/:id',
  validate({
    anniversaryDate: { required: true, type: 'string' },
  }),
  async (req: AuthRequest, res, next) => {
    try {
      const spaceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { anniversaryDate } = req.body;
      const space = await updateAnniversaryDate(spaceId, req.user!.id, anniversaryDate);

      res.json({
        success: true,
        data: space,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/spaces/:id/unbind - Request unbind (start cooling-off period)
router.post('/:id/unbind', async (req: AuthRequest, res, next) => {
  try {
    const spaceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const unbindRequest = await requestUnbind(spaceId, req.user!.id);

    res.json({
      success: true,
      message: 'Unbind request created. You have 7 days to cancel.',
      data: unbindRequest,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/spaces/:id/unbind - Cancel unbind request
router.delete('/:id/unbind', async (req: AuthRequest, res, next) => {
  try {
    const spaceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await cancelUnbind(spaceId, req.user!.id);

    res.json({
      success: true,
      message: 'Unbind request cancelled',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/spaces/:id/unbind - Get unbind status
router.get('/:id/unbind', async (req: AuthRequest, res, next) => {
  try {
    const spaceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const unbindRequest = await getUnbindStatus(spaceId, req.user!.id);

    res.json({
      success: true,
      data: unbindRequest,
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/spaces/:id - Delete space immediately (force unbind)
router.delete('/:id', async (req: AuthRequest, res, next) => {
  try {
    const spaceId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    await deleteSpace(spaceId, req.user!.id);

    res.json({
      success: true,
      message: 'Space deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/spaces/pet-names - Get pet names
router.get('/pet-names', async (req: AuthRequest, res, next) => {
  try {
    const petNames = await getPetNames(req.user!.id);

    res.json({
      success: true,
      data: petNames,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/spaces/pet-names - Update pet names
router.put('/pet-names', async (req: AuthRequest, res, next) => {
  try {
    const { myPetName, partnerPetName } = req.body;
    const petNames = await updatePetNames(req.user!.id, { myPetName, partnerPetName });

    res.json({
      success: true,
      data: petNames,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
