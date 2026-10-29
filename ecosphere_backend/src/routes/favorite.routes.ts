import { Router } from 'express';
import { favoriteController } from '../controllers/favoriteController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// All favorites endpoints require authentication
router.get('/', requireAuth, favoriteController.getFavorites);
router.get('/:entityType/:entityId', requireAuth, favoriteController.checkFavorite);
router.post('/', requireAuth, favoriteController.addFavorite);
router.delete('/:entityType/:entityId', requireAuth, favoriteController.removeFavorite);

export default router;
