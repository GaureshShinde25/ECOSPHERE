import { Router } from 'express';
import { feedbackController } from '../controllers/feedbackController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// All feedback endpoints strictly require JWT authentication
router.use(requireAuth);

router.get('/summary', (req, res) => feedbackController.getSummary(req, res));
router.get('/categories', (req, res) => feedbackController.getCategories(req, res));
router.get('/services', (req, res) => feedbackController.getServices(req, res));
router.get('/jobs', (req, res) => feedbackController.getJobs(req, res));
router.get('/:category', (req, res) => feedbackController.getCategoryDetail(req, res));

export default router;
