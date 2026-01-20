import { Router } from 'express';
import { validate, patterns } from '../middleware/validate.js';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import {
  generateVerificationCode,
  verifyCode,
  updateUserProfile,
} from '../services/authService.js';

const router = Router();

// POST /api/auth/send-code
router.post(
  '/send-code',
  validate({
    phone: { required: true, type: 'string', pattern: patterns.phone },
  }),
  (req, res) => {
    const { phone } = req.body;
    const code = generateVerificationCode(phone);

    // In development mode, return the code for testing
    res.json({
      success: true,
      message: 'Verification code sent',
      data: { code }, // Remove in production
    });
  }
);

// POST /api/auth/verify
router.post(
  '/verify',
  validate({
    phone: { required: true, type: 'string', pattern: patterns.phone },
    code: { required: true, type: 'string', pattern: patterns.code },
  }),
  (req, res, next) => {
    try {
      const { phone, code } = req.body;
      const result = verifyCode(phone, code);

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
router.put('/profile', authenticate, (req: AuthRequest, res, next) => {
  try {
    const { nickname, avatar } = req.body;
    const user = updateUserProfile(req.user!.id, { nickname, avatar });

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
