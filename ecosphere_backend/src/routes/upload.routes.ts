import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import multer from 'multer';
import { AuthenticatedRequest } from '../types/index.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

const router = Router();

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

// Ensure uploads directory exists on startup
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer memory storage configuration for multipart/form-data
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: MAX_IMAGE_SIZE_BYTES,
    files: 1,
  },
});

export interface DetectedImageInfo {
  format: 'jpeg' | 'png' | 'webp' | 'gif';
  ext: 'jpg' | 'png' | 'webp' | 'gif';
  mime: string;
}

/**
 * Strictly detect image binary magic bytes (Section 8, 9, 10, 11)
 * Compares the actual file header bytes against authoritative format signatures.
 * Does NOT blindly trust file.mimetype or file.originalname.
 */
export function detectImageSignature(buffer: Buffer): DetectedImageInfo | null {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return { format: 'jpeg', ext: 'jpg', mime: 'image/jpeg' };
  }

  // PNG: 89 50 4E 47 (0x89 'PNG')
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return { format: 'png', ext: 'png', mime: 'image/png' };
  }

  // WEBP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { format: 'webp', ext: 'webp', mime: 'image/webp' };
  }

  // GIF: 47 49 46 38 ('GIF8') -> GIF87a or GIF89a
  if (
    buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38 &&
    (buffer[4] === 0x37 || buffer[4] === 0x39) && buffer[5] === 0x61
  ) {
    return { format: 'gif', ext: 'gif', mime: 'image/gif' };
  }

  return null;
}

/**
 * Middleware handling multipart upload errors safely
 */
const handleMulterUpload = (req: Request, res: Response, next: NextFunction) => {
  upload.single('image')(req, res, (err: any) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return sendError(res, 'FILE_TOO_LARGE', 'Unable to upload image. Try again. File size exceeds 5MB limit.', 400);
        }
      }
      return sendError(res, 'UPLOAD_ERROR', err?.message || 'Unable to upload image. Try again.', 400);
    }
    next();
  });
};

async function handleUpload(req: AuthenticatedRequest, res: Response): Promise<Response> {
  if (!req.user || !req.user.userId) {
    return sendError(res, 'UNAUTHORIZED', 'Authentication token required', 401);
  }

  try {
    const rawType = (req.body?.type || 'product').toString().toLowerCase();
    const type = ['product', 'logo', 'cover', 'general'].includes(rawType) ? rawType : 'product';

    // Verify seller authorization for merchant-scoped assets
    if (['product', 'logo', 'cover'].includes(type)) {
      if (req.user.role !== 'seller' && req.user.role !== 'administrator') {
        return sendError(res, 'FORBIDDEN', 'Access denied. Seller or Administrator role required to upload business assets.', 403);
      }
    }

    let buffer: Buffer | null = null;
    let originalName = 'uploaded-file';
    let incomingMime = 'application/octet-stream';

    // Case A: Multipart File upload (Section 3, 5, 8, 9)
    if (req.file) {
      buffer = req.file.buffer;
      originalName = req.file.originalname || originalName;
      incomingMime = req.file.mimetype || incomingMime;
    } else if (req.body && typeof req.body.image === 'string') {
      const rawImage = req.body.image.trim();

      // Case B1: Remote HTTP/HTTPS URL
      if (rawImage.startsWith('http://') || rawImage.startsWith('https://')) {
        try {
          new URL(rawImage);
        } catch {
          return sendError(res, 'INVALID_URL', 'Unable to upload image. Try again.', 400);
        }

        return sendSuccess(res, {
          url: rawImage,
          type,
          message: 'Image URL registered successfully',
        });
      }

      // Case B2: Base64 Encoded Image Data
      const base64Match = rawImage.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/i);
      if (base64Match) {
        incomingMime = `image/${base64Match[1].toLowerCase()}`;
        buffer = Buffer.from(base64Match[2], 'base64');
      }
    }

    if (!buffer) {
      return sendError(res, 'VALIDATION_ERROR', 'Unable to upload image. Try again. No image file provided.', 400);
    }

    if (buffer.length > MAX_IMAGE_SIZE_BYTES) {
      return sendError(res, 'FILE_TOO_LARGE', 'Unable to upload image. Try again. File size exceeds 5MB limit.', 400);
    }

    // Authoritative Signature Detection (Sections 8, 9, 10, 11)
    const detected = detectImageSignature(buffer);

    logger.info('Upload verification:', {
      fileName: originalName,
      declaredMime: incomingMime,
      sizeBytes: buffer.length,
      detectedFormat: detected?.format || 'UNKNOWN',
    });

    if (!detected) {
      return sendError(
        res,
        'INVALID_FILE_CONTENT',
        'Unable to upload image. Try again. File header does not match declared image format.',
        400
      );
    }

    // Generate safe normalized server-side filename based on authoritative detected format
    const randomSuffix = crypto.randomBytes(8).toString('hex');
    const safeFileName = `${type}-${Date.now()}-${randomSuffix}.${detected.ext}`;
    const filePath = path.join(UPLOADS_DIR, safeFileName);

    await fs.promises.writeFile(filePath, buffer);

    logger.info(`Saved verified image: ${safeFileName} (${buffer.length} bytes, format: ${detected.format}) by User: ${req.user.userId}`);

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol || 'http';
    const relativeUrl = `/uploads/${safeFileName}`;
    const fullUrl = `${protocol}://${host}${relativeUrl}`;

    return sendSuccess(res, {
      url: relativeUrl,
      fullUrl,
      fileName: safeFileName,
      type,
      sizeBytes: buffer.length,
      detectedFormat: detected.format,
      message: 'Image uploaded successfully',
    }, 201);
  } catch (error) {
    const err = error as Error;
    logger.error('Failed to handle image upload', { error: err.message });
    return sendError(res, 'UPLOAD_FAILED', 'Unable to upload image. Try again.', 500);
  }
}

router.post('/image', requireAuth, handleMulterUpload, handleUpload);
router.post('/', requireAuth, handleMulterUpload, handleUpload);

export default router;
