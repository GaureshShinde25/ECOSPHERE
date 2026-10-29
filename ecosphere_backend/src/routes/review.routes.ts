import { Router } from 'express';
import { reviewController } from '../controllers/reviewController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Public / Authenticated review browsing
router.get('/', reviewController.getReviews);

// Protected user review endpoints
router.get('/mine', requireAuth, reviewController.getMyReviews);
router.get('/:id', reviewController.getReviewById);
router.post('/', requireAuth, reviewController.createReview);
router.put('/:id', requireAuth, reviewController.updateReview);
router.delete('/:id', requireAuth, reviewController.deleteReview);

export default router;
