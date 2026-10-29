import { Router, Response } from 'express';
import { z } from 'zod';
import { authController } from '../controllers/authController.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';
import { AuthenticatedRequest } from '../types/index.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

const requestOtpSchema = z.object({
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
  intent: z.enum(['login', 'register']).optional(),
});

const verifyOtpSchema = z.object({
  mobile: z.string().min(10, 'Mobile number must be at least 10 digits'),
  otp: z.string().min(4, 'OTP must be at least 4 digits'),
  name: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().optional(),
  requestedRole: z.string().optional(),
  sellerType: z.string().optional(),
  password: z.string().optional(),
  intent: z.enum(['login', 'register']).optional(),
  registrationData: z.any().optional(),
});

const loginSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required').optional(),
  username: z.string().optional(),
  mobile: z.string().optional(),
  password: z.string().optional(),
});

const switchModeSchema = z.object({
  targetMode: z.enum(['customer', 'seller']),
  sellerType: z.string().optional(),
});

const sellerRequestSchema = z.object({
  notes: z.string().max(500).optional(),
});

const forgotPasswordRequestSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required').optional(),
  mobile: z.string().optional(),
  email: z.string().optional(),
});

const forgotPasswordVerifySchema = z.object({
  identifier: z.string().min(1, 'Identifier is required').optional(),
  mobile: z.string().optional(),
  email: z.string().optional(),
  otp: z.string().min(4, 'OTP must be at least 4 digits'),
});

const forgotPasswordResetSchema = z.object({
  resetToken: z.string().min(10, 'Reset token is required'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters'),
});

// Public authentication routes
router.post('/request-otp', validateBody(requestOtpSchema), authController.requestOtp);
router.post('/verify-otp', validateBody(verifyOtpSchema), authController.verifyOtp);
router.post('/login', validateBody(loginSchema), authController.login);

// Public forgot password & recovery routes
router.post('/forgot-password/request', validateBody(forgotPasswordRequestSchema), authController.requestPasswordReset);
router.post('/forgot-password/verify', validateBody(forgotPasswordVerifySchema), authController.verifyPasswordResetOtp);
router.post('/forgot-password/reset', validateBody(forgotPasswordResetSchema), authController.resetPassword);

// Authenticated session profile route
router.get('/me', requireAuth, authController.getMe);

// Controlled mode-switch route (server-side authorization required)
router.post('/switch-mode', requireAuth, validateBody(switchModeSchema), authController.switchMode);

// Customer seller-access permission request workflow
router.post('/seller-access/request', requireAuth, validateBody(sellerRequestSchema), authController.requestSellerAccess);
router.get('/seller-access/status', requireAuth, authController.getSellerAccessStatus);

// Role-authorization test endpoints
router.get('/customer-only', requireAuth, requireRole('customer'), (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, { message: 'Welcome Customer!', role: req.user?.role });
});

router.get('/seller-only', requireAuth, requireRole('seller'), (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, { message: 'Welcome Seller!', role: req.user?.role });
});

router.get('/admin-only', requireAuth, requireRole('administrator'), (req: AuthenticatedRequest, res: Response) => {
  return sendSuccess(res, { message: 'Welcome Administrator!', role: req.user?.role });
});

export default router;
