import { Request, Response } from 'express';
import { aiAssistantService } from '../services/aiAssistantService.js';
import { logger } from '../utils/logger.js';

// In-memory sliding window rate limiter (max 20 requests per 60 seconds per user/IP)
const requestLogs = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 100;

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = requestLogs.get(key) || [];
  const validTimestamps = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  validTimestamps.push(now);
  requestLogs.set(key, validTimestamps);
  return true;
}

export const aiController = {
  /**
   * POST /api/ai/chat
   */
  async chat(req: Request, res: Response): Promise<void> {
    try {
      const authUser = (req as any).user;
      const userIdStr = authUser?.userId ? String(authUser.userId) : '';
      const clientKey = userIdStr || req.ip || 'anonymous';

      // Rate limit check
      if (!checkRateLimit(clientKey)) {
        res.status(429).json({
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many AI Assistant requests. Please wait a minute before trying again.',
          },
        });
        return;
      }

      const { message } = req.body || {};

      if (!message || typeof message !== 'string' || !message.trim()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Message text is required and cannot be empty.',
          },
        });
        return;
      }

      if (message.length > 1000) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Message exceeds maximum length of 1000 characters.',
          },
        });
        return;
      }

      const result = await aiAssistantService.processUserQuery(userIdStr, message);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      const err = error as Error;
      logger.error('Error processing AI chat request', { error: err.message });
      res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Failed to process AI assistant request.',
        },
      });
    }
  },
};
