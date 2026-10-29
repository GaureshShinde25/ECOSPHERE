import { Router } from 'express';
import { groceryController } from '../controllers/groceryController.js';
import { requireAuth, optionalAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Catalog, Stores & Comparison
router.get('/catalog', optionalAuth, groceryController.getCatalog);
router.get('/stores', optionalAuth, groceryController.getStores);
router.get('/compare', optionalAuth, groceryController.comparePrice);

// Optimization Engine
router.post('/optimize', optionalAuth, groceryController.optimizeList);

// AI Recommendations & Budget Planning
router.get('/recommendations/popular', optionalAuth, groceryController.getPopularRecommendations);
router.post('/recommendations/similar', optionalAuth, groceryController.getSimilarRecommendations);
router.post('/budget/plan', optionalAuth, groceryController.planBudget);

// User Budgets (Authenticated)
router.get('/budget', requireAuth, groceryController.getBudget);
router.post('/budget', requireAuth, groceryController.setBudget);

// Shopping Lists (Authenticated)
router.get('/lists', requireAuth, groceryController.getShoppingLists);
router.post('/lists', requireAuth, groceryController.createShoppingList);
router.get('/lists/:id', requireAuth, groceryController.getShoppingListById);
router.put('/lists/:id', requireAuth, groceryController.updateShoppingList);
router.delete('/lists/:id', requireAuth, groceryController.deleteShoppingList);

// Shopping History (Authenticated)
router.get('/history', requireAuth, groceryController.getShoppingHistory);
router.post('/history', requireAuth, groceryController.recordShoppingTrip);

// Exports
router.post('/export/csv', optionalAuth, groceryController.exportCsv);

export default router;

