import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';
import { env } from '../config/env.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

export function errorMiddleware(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): Response {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message = err.message || 'An unexpected error occurred';

  logger.error(`[Error] ${req.method} ${req.originalUrl}: ${message}`, {
    code: errorCode,
    statusCode,
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });

  return sendError(
    res,
    errorCode,
    message,
    statusCode,
    env.NODE_ENV === 'development' ? err.details : undefined
  );
}
