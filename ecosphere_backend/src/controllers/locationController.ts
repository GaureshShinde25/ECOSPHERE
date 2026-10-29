import { Request, Response } from 'express';
import { locationService } from '../services/locationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const locationController = {
  getPopularCities: async (_req: Request, res: Response): Promise<Response> => {
    try {
      const cities = locationService.getPopularCities();
      return sendSuccess(res, { cities, count: cities.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to get popular cities', 500);
    }
  },

  search: async (req: Request, res: Response): Promise<Response> => {
    try {
      const q = req.query.q !== undefined ? String(req.query.q) : (req.query.query !== undefined ? String(req.query.query) : '');
      const results = await locationService.searchLocations(q);
      return sendSuccess(res, { results, count: results.length });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to search locations', 500);
    }
  },

  reverseGeocode: async (req: Request, res: Response): Promise<Response> => {
    try {
      const lat = parseFloat(String(req.query.lat || req.query.latitude));
      const lon = parseFloat(String(req.query.lon || req.query.longitude || req.query.lng));

      if (isNaN(lat) || isNaN(lon)) {
        return sendError(res, 'INVALID_COORDINATES', 'Valid latitude and longitude are required', 400);
      }

      const location = await locationService.reverseGeocode(lat, lon);
      if (!location) {
        return sendError(res, 'LOCATION_NOT_FOUND', 'Could not resolve address for given coordinates', 404);
      }

      return sendSuccess(res, { location });
    } catch (error) {
      const err = error as Error;
      return sendError(res, 'SERVER_ERROR', err.message || 'Failed to reverse geocode', 500);
    }
  },
};
