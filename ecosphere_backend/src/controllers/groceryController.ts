import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { groceryService } from '../services/groceryService.js';
import { groceryOptimizerService } from '../services/groceryOptimizerService.js';
import { logger } from '../utils/logger.js';

export const groceryController = {
  /**
   * GET /api/grocery/catalog
   */
  async getCatalog(req: Request, res: Response) {
    try {
      const catalog = await groceryOptimizerService.getCatalog();
      return sendSuccess(res, { count: catalog.length, items: catalog });
    } catch (err) {
      logger.error('Failed to get grocery catalog', { error: (err as Error).message });
      return sendError(res, 'CATALOG_ERROR', (err as Error).message || 'Failed to retrieve grocery catalog', 500);
    }
  },

  /**
   * GET /api/grocery/stores
   */
  async getStores(req: Request, res: Response) {
    try {
      const lat = req.query.lat ? parseFloat(String(req.query.lat)) : undefined;
      const lon = req.query.lon ? parseFloat(String(req.query.lon)) : undefined;
      const stores = await groceryOptimizerService.getStores(lat, lon);
      return sendSuccess(res, { count: stores.length, stores });
    } catch (err) {
      logger.error('Failed to get stores', { error: (err as Error).message });
      return sendError(res, 'STORES_ERROR', (err as Error).message || 'Failed to retrieve grocery stores', 500);
    }
  },

  /**
   * POST /api/grocery/optimize
   */
  async optimizeList(req: Request, res: Response) {
    try {
      const { items, latitude, longitude } = req.body;
      if (!items || (Array.isArray(items) && items.length === 0)) {
        return sendError(res, 'INVALID_INPUT', 'Grocery list cannot be empty.', 400);
      }

      const lat = latitude !== undefined ? parseFloat(latitude) : 19.12;
      const lon = longitude !== undefined ? parseFloat(longitude) : 72.88;

      const result = await groceryOptimizerService.optimize(items, lat, lon);
      return sendSuccess(res, result);
    } catch (err) {
      logger.error('Optimization failed', { error: (err as Error).message });
      return sendError(res, 'OPTIMIZE_ERROR', (err as Error).message || 'Optimization failed', 500);
    }
  },

  /**
   * GET /api/grocery/compare?item=Milk
   */
  async comparePrice(req: Request, res: Response) {
    try {
      const item = String(req.query.item || '').trim();
      if (!item) {
        return sendError(res, 'INVALID_INPUT', 'Item query parameter is required.', 400);
      }

      const lat = req.query.lat ? parseFloat(String(req.query.lat)) : undefined;
      const lon = req.query.lon ? parseFloat(String(req.query.lon)) : undefined;

      const comparison = await groceryOptimizerService.compareItemPrices(item, lat, lon);
      return sendSuccess(res, comparison);
    } catch (err) {
      logger.error('Price comparison failed', { error: (err as Error).message });
      return sendError(res, 'COMPARE_ERROR', (err as Error).message || 'Failed to compare grocery prices', 500);
    }
  },

  /**
   * GET /api/grocery/recommendations/popular
   */
  async getPopularRecommendations(req: Request, res: Response) {
    try {
      const topN = req.query.top_n ? parseInt(String(req.query.top_n), 10) : 6;
      const category = req.query.category ? String(req.query.category) : undefined;
      const recs = await groceryOptimizerService.getPopularRecommendations(topN, category);
      return sendSuccess(res, { count: recs.length, items: recs });
    } catch (err) {
      logger.error('Failed to get popular recommendations', { error: (err as Error).message });
      return sendError(res, 'RECOMMENDATION_ERROR', (err as Error).message || 'Failed to retrieve recommendations', 500);
    }
  },

  /**
   * POST /api/grocery/recommendations/similar
   */
  async getSimilarRecommendations(req: Request, res: Response) {
    try {
      const { item_name, top_n, budget_max } = req.body;
      if (!item_name) {
        return sendError(res, 'INVALID_INPUT', 'item_name is required.', 400);
      }

      const result = await groceryOptimizerService.getSimilarItems(
        item_name,
        top_n ? parseInt(top_n, 10) : 5,
        budget_max ? parseFloat(budget_max) : undefined
      );
      return sendSuccess(res, result);
    } catch (err) {
      logger.error('Similar recommendations failed', { error: (err as Error).message });
      return sendError(res, 'RECOMMENDATION_ERROR', (err as Error).message || 'Failed to compute similar items', 500);
    }
  },

  /**
   * POST /api/grocery/budget/plan
   */
  async planBudget(req: Request, res: Response) {
    try {
      const { budget, items, user_id } = req.body;
      const numBudget = parseFloat(budget);
      if (isNaN(numBudget) || numBudget <= 0) {
        return sendError(res, 'INVALID_INPUT', 'Budget must be a positive number.', 400);
      }

      const result = await groceryOptimizerService.planBudget(numBudget, items || [], user_id);
      return sendSuccess(res, result);
    } catch (err) {
      logger.error('Budget planning failed', { error: (err as Error).message });
      return sendError(res, 'BUDGET_PLAN_ERROR', (err as Error).message, 500);
    }
  },

  /**
   * GET /api/grocery/budget
   */
  async getBudget(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || '1';
      const budget = await groceryService.getBudget(userId);
      return sendSuccess(res, budget);
    } catch (err) {
      logger.error('Failed to get budget', { error: (err as Error).message });
      return sendError(res, 'BUDGET_ERROR', 'Failed to fetch grocery budget', 500);
    }
  },

  /**
   * POST /api/grocery/budget
   */
  async setBudget(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || '1';
      const { monthlyBudget, weeklyBudget } = req.body;
      const num = parseFloat(monthlyBudget);
      if (isNaN(num) || num <= 0) {
        return sendError(res, 'INVALID_INPUT', 'Please specify a valid monthly budget.', 400);
      }

      const budget = await groceryService.setBudget(
        userId,
        num,
        weeklyBudget ? parseFloat(weeklyBudget) : undefined
      );
      return sendSuccess(res, budget);
    } catch (err) {
      logger.error('Failed to set budget', { error: (err as Error).message });
      return sendError(res, 'BUDGET_ERROR', 'Failed to update grocery budget', 500);
    }
  },

  /**
   * GET /api/grocery/lists
   */
  async getShoppingLists(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || '1';
      const lists = await groceryService.getShoppingLists(userId);
      return sendSuccess(res, { count: lists.length, lists });
    } catch (err) {
      logger.error('Failed to fetch lists', { error: (err as Error).message });
      return sendError(res, 'LISTS_ERROR', 'Failed to retrieve shopping lists', 500);
    }
  },

  /**
   * POST /api/grocery/lists
   */
  async createShoppingList(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || '1';
      const { name, items } = req.body;
      const list = await groceryService.createShoppingList(userId, name || 'New Grocery List', items || []);
      return sendSuccess(res, list, 201);
    } catch (err) {
      logger.error('Failed to create list', { error: (err as Error).message });
      return sendError(res, 'CREATE_LIST_ERROR', 'Failed to create shopping list', 500);
    }
  },

  /**
   * GET /api/grocery/lists/:id
   */
  async getShoppingListById(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || '1';
      const listId = String(req.params.id);
      const list = await groceryService.getShoppingListById(listId, userId);
      if (!list) {
        return sendError(res, 'NOT_FOUND', 'Shopping list not found.', 404);
      }
      return sendSuccess(res, list);
    } catch (err) {
      logger.error('Failed to fetch list by ID', { error: (err as Error).message });
      return sendError(res, 'LIST_ERROR', 'Failed to retrieve shopping list', 500);
    }
  },

  /**
   * PUT /api/grocery/lists/:id
   */
  async updateShoppingList(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || '1';
      const listId = String(req.params.id);
      const updated = await groceryService.updateShoppingList(listId, userId, req.body);
      return sendSuccess(res, updated);
    } catch (err) {
      logger.error('Failed to update list', { error: (err as Error).message });
      return sendError(res, 'UPDATE_LIST_ERROR', (err as Error).message, 500);
    }
  },

  /**
   * DELETE /api/grocery/lists/:id
   */
  async deleteShoppingList(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || '1';
      const listId = String(req.params.id);
      await groceryService.deleteShoppingList(listId, userId);
      return sendSuccess(res, { success: true, message: 'Shopping list deleted' });
    } catch (err) {
      logger.error('Failed to delete list', { error: (err as Error).message });
      return sendError(res, 'DELETE_LIST_ERROR', 'Failed to delete shopping list', 500);
    }
  },

  /**
   * GET /api/grocery/history
   */
  async getShoppingHistory(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || '1';
      const history = await groceryService.getShoppingHistory(userId);
      return sendSuccess(res, { count: history.length, trips: history });
    } catch (err) {
      logger.error('Failed to fetch history', { error: (err as Error).message });
      return sendError(res, 'HISTORY_ERROR', 'Failed to retrieve shopping history', 500);
    }
  },

  /**
   * POST /api/grocery/history
   */
  async recordShoppingTrip(req: AuthenticatedRequest, res: Response) {
    try {
      const userId = req.user?.userId || '1';
      const { listName, items, store, totalSpend, savings } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return sendError(res, 'INVALID_INPUT', 'Trip must contain at least one purchased item.', 400);
      }

      const trip = await groceryService.recordShoppingTrip(
        userId,
        listName || 'Completed Grocery Trip',
        items,
        store || 'D-Mart',
        totalSpend ? parseFloat(totalSpend) : undefined,
        savings ? parseFloat(savings) : undefined
      );
      return sendSuccess(res, trip, 201);
    } catch (err) {
      logger.error('Failed to record shopping trip', { error: (err as Error).message });
      return sendError(res, 'RECORD_TRIP_ERROR', 'Failed to record shopping trip', 500);
    }
  },

  /**
   * POST /api/grocery/export/csv
   */
  async exportCsv(req: Request, res: Response) {
    try {
      const { plan } = req.body;
      const csvContent = groceryService.generateCsvExport(plan);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="smart_grocery_optimized.csv"');
      return res.status(200).send(csvContent);
    } catch (err) {
      logger.error('CSV export failed', { error: (err as Error).message });
      return sendError(res, 'EXPORT_ERROR', 'Failed to export CSV', 500);
    }
  },
};
