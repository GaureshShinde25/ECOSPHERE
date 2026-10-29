import { Response } from 'express';
import { ApiErrorResponse, ApiSuccessResponse } from '../types/index.js';

export function sendSuccess<T = Record<string, unknown>>(
  res: Response,
  dataOrProps: T,
  statusCode: number = 200
): Response {
  if (typeof dataOrProps === 'object' && dataOrProps !== null && !Array.isArray(dataOrProps)) {
    const responseBody: ApiSuccessResponse<T> = {
      success: true,
      ...dataOrProps,
    };
    return res.status(statusCode).json(responseBody);
  }
  return res.status(statusCode).json({
    success: true,
    data: dataOrProps,
  });
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: unknown
): Response {
  const responseBody: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
  return res.status(statusCode).json(responseBody);
}
