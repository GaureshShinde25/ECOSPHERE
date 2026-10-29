import { Router } from 'express';
import { communityController } from '../controllers/communityController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Public / Optional Auth routes for reading feed and comments
router.get('/posts', optionalAuth, communityController.getPosts);
router.get('/posts/:id', optionalAuth, communityController.getPostById);
router.get('/posts/:postId/comments', optionalAuth, communityController.getComments);

// Protected routes requiring authentication
router.post('/posts', requireAuth, communityController.createPost);
router.put('/posts/:id', requireAuth, communityController.updatePost);
router.delete('/posts/:id', requireAuth, communityController.deletePost);
router.post('/posts/:id/like', requireAuth, communityController.toggleLike);

router.post('/posts/:postId/comments', requireAuth, communityController.createComment);
router.put('/comments/:id', requireAuth, communityController.updateComment);
router.delete('/comments/:id', requireAuth, communityController.deleteComment);

export default router;
