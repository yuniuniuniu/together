import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import {
  addComment,
  listComments,
  deleteComment,
  getCommentCount,
} from '../services/commentService.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /api/comments/:memoryId - Add a comment (or reply) to a memory
router.post('/:memoryId', async (req: AuthRequest, res, next) => {
  try {
    const memoryId = Array.isArray(req.params.memoryId) ? req.params.memoryId[0] : req.params.memoryId;
    const { content, parentId } = req.body;
    const comment = await addComment(memoryId, req.user!.id, content, parentId);

    res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/comments/:memoryId - List comments for a memory (tree structure)
router.get('/:memoryId', async (req: AuthRequest, res, next) => {
  try {
    const memoryId = Array.isArray(req.params.memoryId) ? req.params.memoryId[0] : req.params.memoryId;
    const comments = await listComments(memoryId, req.user!.id);

    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/comments/:memoryId/count - Get comment count for a memory
router.get('/:memoryId/count', async (req: AuthRequest, res, next) => {
  try {
    const memoryId = Array.isArray(req.params.memoryId) ? req.params.memoryId[0] : req.params.memoryId;
    const count = await getCommentCount(memoryId);

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
