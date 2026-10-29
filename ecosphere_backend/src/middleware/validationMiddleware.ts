import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response.js';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    try {
      req.body = schema.parse(req.body);
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
        return sendError(res, 'VALIDATION_ERROR', `Request validation failed: ${issues}`, 400);
      }
      return sendError(res, 'VALIDATION_ERROR', 'Invalid request body', 400);
    }
  };
}
