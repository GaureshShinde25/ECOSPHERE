import { Router } from 'express';
import { searchController } from '../controllers/searchController.js';

const router = Router();

// Public Search & Discovery endpoints
router.get('/', searchController.search);
router.get('/suggestions', searchController.getSuggestions);
router.get('/tags', searchController.getSearchTags);

export default router;
