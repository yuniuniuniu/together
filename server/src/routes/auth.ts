import { Router } from 'express';
import { validate, patterns } from '../middleware/validate.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import {
  generateVerificationCode,
  verifyCode,
  updateUserProfile,
  logout,
  logoutAllDevices,
} from '../services/authService.js';

const router = Router();

// POST /api/auth/send-code
router.post(
  '/send-code',
  validate({
    email: { required: true, type: 'string', pattern: patterns.email },
  }),
  async (req, res, next) => {
    try {
      const { email } = req.body;
      await generateVerificationCode(email);

      res.json({
        success: true,
        message: 'Verification code sent to your email',
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/auth/verify
router.post(
  '/verify',
  validate({
    email: { required: true, type: 'string', pattern: patterns.email },
    code: { required: true, type: 'string', pattern: patterns.code },
  }),
  async (req, res, next) => {
    try {
      const { email, code } = req.body;
      const result = await verifyCode(email, code);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/auth/me
router.get('/me', authenticate, (req: AuthRequest, res) => {
  res.json({
    success: true,
    data: req.user,
  });
});

// PUT /api/auth/profile
router.put('/profile', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { nickname, avatar } = req.body;
    const user = await updateUserProfile(req.user!.id, { nickname, avatar });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout - Logout current session
router.post('/logout', authenticate, async (req: AuthRequest, res, next) => {
  try {
    if (req.sessionId) {
      await logout(req.sessionId);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout-all - Logout from all devices
router.post('/logout-all', authenticate, async (req: AuthRequest, res, next) => {
  try {
    await logoutAllDevices(req.user!.id);

    res.json({
      success: true,
      message: 'Logged out from all devices',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
