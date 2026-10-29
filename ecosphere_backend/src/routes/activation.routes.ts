import { Router } from 'express';
import { activationController } from '../controllers/activationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// All activation endpoints strictly require JWT authentication
router.use(requireAuth);

router.get('/next-actions', (req, res) => activationController.getNextBestActions(req, res));
router.get('/metrics', (req, res) => activationController.getMetrics(req, res));
router.get('/worker', (req, res) => activationController.getWorkerActivation(req, res));
router.get('/business', (req, res) => activationController.getBusinessActivation(req, res));
router.get('/customer', (req, res) => activationController.getCustomerActivation(req, res));

export default router;
