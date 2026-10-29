import { Router } from 'express';
import { locationController } from '../controllers/locationController.js';

const router = Router();

// Public Location Discovery & Geocoding Endpoints
router.get('/popular', locationController.getPopularCities);
router.get('/search', locationController.search);
router.get('/reverse', locationController.reverseGeocode);

export default router;
