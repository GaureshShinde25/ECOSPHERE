import { Request, Response } from 'express';
import { databaseService } from '../services/databaseService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const healthController = {
  getHealth: (_req: Request, res: Response): Response => {
    return sendSuccess(res, {
      service: 'ECOSPHERE API',
    });
  },

  getDatabaseHealth: async (_req: Request, res: Response): Promise<Response> => {
    const health = await databaseService.checkHealth();

    if (health.connected) {
      return sendSuccess(res, {
        database: health.database,
        connected: true,
      });
    }

    return sendError(
      res,
      'DATABASE_UNAVAILABLE',
      'Unable to connect to SQL Server database',
      503,
      { database: health.database, connected: false, info: health.details }
    );
  },
};
