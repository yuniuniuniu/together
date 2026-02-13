import { v4 as uuid } from 'uuid';
import { getDatabase, CommentData } from '../db/database.js';
import { AppError } from '../middleware/errorHandler.js';
import { getMemoryById } from './memoryService.js';
import { getMilestoneById } from './milestoneService.js';
import { createNotification } from './notificationService.js';

export type CommentTargetType = 'memory' | 'milestone';

export interface Comment {
  id: string;
  memoryId: string;
  userId: string;
  parentId: string | null;
  content: string;
  createdAt: string;
  user: {
    id: string;
    nickname: string;
    avatar: string | null;
  };
  replies?: Comment[];
}

function formatComment(
  row: CommentData,
  userInfo: { id: string; nickname: string; avatar: string | null }
): Comment {
  return {
    id: row.id,
    memoryId: row.memory_id,
    userId: row.user_id,
    parentId: row.parent_id,
    content: row.content,
    createdAt: row.created_at,
    user: userInfo,
  };
}

/** Validate target exists and return its createdBy user ID */
async function validateTarget(
  targetId: string,
  userId: string,
  targetType: CommentTargetType
): Promise<{ createdBy: string }> {
  if (targetType === 'milestone') {
    const milestone = await getMilestoneById(targetId, userId);
    if (!milestone) {
      throw new AppError(404, 'MILESTONE_NOT_FOUND', 'Milestone not found');
    }
    return { createdBy: milestone.createdBy };
  }
  // default: memory
  const memory = await getMemoryById(targetId, userId);
  if (!memory) {
    throw new AppError(404, 'MEMORY_NOT_FOUND', 'Memory not found');
  }
  return { createdBy: memory.createdBy };
}

export async function addComment(
  targetId: string,
  userId: string,
  content: string,
  parentId?: string,
  targetType: CommentTargetType = 'memory'
): Promise<Comment> {
  const db = getDatabase();

  // Validate content
  if (!content || !content.trim()) {
    throw new AppError(400, 'INVALID_CONTENT', 'Comment content cannot be empty');
  }

  // Check target exists and user has access
  const target = await validateTarget(targetId, userId, targetType);

  // If replying, validate parent comment exists and belongs to same target
  if (parentId) {
    const parentComment = await db.getCommentById(parentId);
    if (!parentComment || parentComment.memory_id !== targetId) {
      throw new AppError(404, 'COMMENT_NOT_FOUND', 'Parent comment not found');
    }
    // If parent itself is a reply, redirect to the top-level comment
    if (parentComment.parent_id) {
      parentId = parentComment.parent_id;
    }
  }

  const id = uuid();
  const comment = await db.createComment({
    id,
    memory_id: targetId,
    user_id: userId,
    parent_id: parentId || null,
    content: content.trim(),
    created_at: new Date().toISOString(),
  });

  // Get commenter info
  const commenter = await db.getUserById(userId);
  const commenterName = commenter?.nickname || 'Your partner';

  // Send notification to the other person
  const previewText =
    content.length > 40 ? content.substring(0, 40) + '...' : content;

  const targetLabel = targetType === 'milestone' ? 'milestone' : 'memory';
  const targetUrl = targetType === 'milestone' ? `/milestone/${targetId}` : `/memory/${targetId}`;

  if (parentId) {
    // Reply: notify the parent comment author (if different user)
    const parentComment = await db.getCommentById(parentId);
    if (parentComment && parentComment.user_id !== userId) {
      await createNotification(
        parentComment.user_id,
        'comment_reply',
        `${commenterName} replied to your comment`,
        previewText,
        targetUrl
      );
    }
    // Also notify target creator if they didn't write the parent comment and aren't the replier
    if (
      target.createdBy !== userId &&
      target.createdBy !== parentComment?.user_id
    ) {
      await createNotification(
        target.createdBy,
        'comment',
        `${commenterName} commented on your ${targetLabel}`,
        previewText,
        targetUrl
      );
    }
  } else {
    // Top-level comment: notify target creator (if different user)
    if (target.createdBy !== userId) {
      await createNotification(
        target.createdBy,
        'comment',
        `${commenterName} commented on your ${targetLabel}`,
        previewText,
        targetUrl
      );
    }
  }

  const userInfo = commenter
    ? { id: commenter.id, nickname: commenter.nickname, avatar: commenter.avatar }
    : { id: userId, nickname: 'Unknown', avatar: null };

  return formatComment(comment, userInfo);
}

export async function listComments(
  targetId: string,
  userId: string,
  targetType: CommentTargetType = 'memory'
): Promise<Comment[]> {
  const db = getDatabase();

  // Check target exists and user has access
  await validateTarget(targetId, userId, targetType);

  const comments = await db.listCommentsByMemoryId(targetId);

  // Collect unique user IDs
  const userIds = [...new Set(comments.map((c) => c.user_id))];
  const users = await db.getUsersByIds(userIds);
  const userMap = new Map(
    users.map((u) => [u.id, { id: u.id, nickname: u.nickname, avatar: u.avatar }])
  );
  const unknownUser = { id: '', nickname: 'Unknown', avatar: null };

  // Format and build tree structure
  const topLevel: Comment[] = [];
  const replyMap = new Map<string, Comment[]>();

  for (const row of comments) {
    const userInfo = userMap.get(row.user_id) || { ...unknownUser, id: row.user_id };
    const comment = formatComment(row, userInfo);

    if (row.parent_id) {
      const replies = replyMap.get(row.parent_id) || [];
      replies.push(comment);
      replyMap.set(row.parent_id, replies);
    } else {
      comment.replies = [];
      topLevel.push(comment);
    }
  }

  // Attach replies to their parent comments
  for (const comment of topLevel) {
    comment.replies = replyMap.get(comment.id) || [];
  }

  return topLevel;
}

export async function deleteComment(
  commentId: string,
  userId: string
): Promise<void> {
  const db = getDatabase();

  const comment = await db.getCommentById(commentId);
  if (!comment) {
    throw new AppError(404, 'COMMENT_NOT_FOUND', 'Comment not found');
  }

  // Only the comment author can delete
  if (comment.user_id !== userId) {
    throw new AppError(403, 'FORBIDDEN', 'You can only delete your own comments');
  }

  // This will also soft-delete all replies if it's a top-level comment
  await db.deleteComment(commentId);
}

export async function getCommentCount(memoryId: string): Promise<number> {
  const db = getDatabase();
  return db.countCommentsByMemoryId(memoryId);
}
