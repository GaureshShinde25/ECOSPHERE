import { Router } from 'express';
import { z } from 'zod';
import { bookingController } from '../controllers/bookingController.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

const createBookingSchema = z.object({
  serviceId: z.string().min(1, 'Service ID is required'),
  bookingDate: z.string().min(1, 'Booking date is required'),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  customerAddress: z.string().max(1000).optional(),
  customerCity: z.string().max(150).optional(),
  customerState: z.string().max(150).optional(),
  customerPostalCode: z.string().max(20).optional(),
  customerNotes: z.string().max(2000).optional(),
  paymentMethod: z.string().max(50).optional(),
});

const updateStatusSchema = z.object({
  status: z.string().min(1, 'Status is required'),
});

// Protected booking endpoints
router.post('/', requireAuth, validateBody(createBookingSchema), bookingController.createBooking);
router.get('/mine', requireAuth, bookingController.getMyBookings);
router.get('/seller', requireAuth, requireRole('seller', 'administrator'), bookingController.getSellerBookings);
router.get('/:id', requireAuth, bookingController.getBookingById);
router.put('/:id/status', requireAuth, validateBody(updateStatusSchema), bookingController.updateBookingStatus);
router.put('/:id/cancel', requireAuth, bookingController.cancelBooking);

export default router;
