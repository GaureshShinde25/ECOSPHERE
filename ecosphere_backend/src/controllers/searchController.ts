import { Request, Response } from 'express';
import { searchService } from '../services/searchService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const searchController = {
  /**
   * GET /api/search?q=<query>&type=<type>&page=<page>&limit=<limit>&city=<city>&category=<category>
   */
  search: async (req: Request, res: Response): Promise<Response> => {
    try {
      const q = req.query.q !== undefined ? String(req.query.q) : (req.query.search !== undefined ? String(req.query.search) : undefined);
      const rawType = req.query.type ? String(req.query.type).toLowerCase() : 'all';
      
      const validTypes = ['all', 'business', 'service', 'product', 'job'];
      const type = (validTypes.includes(rawType) ? rawType : 'all') as 'all' | 'business' | 'service' | 'product' | 'job';

      let page = req.query.page ? parseInt(String(req.query.page), 10) : 1;
      let limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 20;

      if (isNaN(page) || page < 1) page = 1;
      if (isNaN(limit) || limit < 1) limit = 20;
      if (limit > 100) limit = 100; // Cap limit at 100

      const city = req.query.city ? String(req.query.city) : undefined;
      const category = req.query.category ? String(req.query.category) : undefined;
      const categoryId = req.query.categoryId ? parseInt(String(req.query.categoryId), 10) : undefined;
      const businessId = req.query.businessId ? String(req.query.businessId) : undefined;
      const jobType = req.query.jobType ? String(req.query.jobType) : undefined;
      const workMode = req.query.workMode ? String(req.query.workMode) : undefined;
      const status = req.query.status ? String(req.query.status) : undefined;

      const isAvailable = req.query.isAvailable !== undefined 
        ? String(req.query.isAvailable).toLowerCase() === 'true' || String(req.query.isAvailable) === '1'
        : undefined;

      const result = await searchService.search({
        q,
        type,
        page,
        limit,
        city,
        category,
        categoryId: isNaN(Number(categoryId)) ? undefined : categoryId,
        businessId,
        isAvailable,
        jobType,
        workMode,
        status,
      });

      return sendSuccess(res, result);
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to execute search query', 500);
    }
  },

  /**
   * GET /api/search/suggestions?q=<query>
   */
  getSuggestions: async (req: Request, res: Response): Promise<Response> => {
    try {
      const q = req.query.q !== undefined ? String(req.query.q) : (req.query.query !== undefined ? String(req.query.query) : undefined);
      const suggestions = await searchService.getSuggestions(q);
      return sendSuccess(res, { suggestions, count: suggestions.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve search suggestions', 500);
    }
  },

  /**
   * GET /api/search/tags
   */
  getSearchTags: async (req: Request, res: Response): Promise<Response> => {
    try {
      const tags = await searchService.getSearchTags();
      return sendSuccess(res, { tags, count: tags.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to retrieve search tags', 500);
    }
  },
};
