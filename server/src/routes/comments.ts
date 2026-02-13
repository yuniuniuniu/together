import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import {
  addComment,
  listComments,
  deleteComment,
  getCommentCount,
  type CommentTargetType,
} from '../services/commentService.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

function parseTargetType(value: unknown): CommentTargetType {
  if (value === 'milestone') return 'milestone';
  return 'memory';
}

// POST /api/comments/:targetId - Add a comment (or reply) to a memory or milestone
router.post('/:targetId', async (req: AuthRequest, res, next) => {
  try {
    const targetId = Array.isArray(req.params.targetId) ? req.params.targetId[0] : req.params.targetId;
    const { content, parentId, targetType } = req.body;
    const comment = await addComment(targetId, req.user!.id, content, parentId, parseTargetType(targetType));

    res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/comments/:targetId - List comments for a memory or milestone (tree structure)
router.get('/:targetId', async (req: AuthRequest, res, next) => {
  try {
    const targetId = Array.isArray(req.params.targetId) ? req.params.targetId[0] : req.params.targetId;
    const targetType = parseTargetType(req.query.targetType);
    const comments = await listComments(targetId, req.user!.id, targetType);

    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/comments/:targetId/count - Get comment count for a memory or milestone
router.get('/:targetId/count', async (req: AuthRequest, res, next) => {
  try {
    const targetId = Array.isArray(req.params.targetId) ? req.params.targetId[0] : req.params.targetId;
    const count = await getCommentCount(targetId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/comments/item/:commentId - Delete own comment
router.delete('/item/:commentId', async (req: AuthRequest, res, next) => {
  try {
    const commentId = Array.isArray(req.params.commentId) ? req.params.commentId[0] : req.params.commentId;
    await deleteComment(commentId, req.user!.id);

    res.json({
      success: true,
      data: null,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
