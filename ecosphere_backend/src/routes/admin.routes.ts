import { Router } from 'express';
import { adminController } from '../controllers/adminController.js';
import { requireAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();

// Strictly protected endpoints requiring JWT authentication & Administrator role authorization
router.use(requireAuth);
router.use(requireRole('administrator'));

router.get('/dashboard', adminController.getDashboardData);
router.get('/users', adminController.getUsers);
router.put('/users/:id/status', adminController.updateUserStatus);
router.delete('/users/:id', adminController.deleteUser);
router.put('/users/:id/revoke-seller', adminController.revokeSellerAccess);
router.put('/businesses/:id/verify', adminController.updateBusinessVerification);
router.get('/audit-logs', adminController.getAuditLogs);

// Seller Access Requests administrative workflow
router.get('/seller-access-requests', adminController.getSellerAccessRequests);
router.get('/seller-requests', adminController.getSellerAccessRequests);

router.put('/seller-access-requests/:id/approve', adminController.approveSellerAccessRequest);
router.patch('/seller-access-requests/:id/approve', adminController.approveSellerAccessRequest);
router.put('/seller-requests/:id/approve', adminController.approveSellerAccessRequest);

router.put('/seller-access-requests/:id/reject', adminController.rejectSellerAccessRequest);
router.patch('/seller-access-requests/:id/reject', adminController.rejectSellerAccessRequest);
router.put('/seller-requests/:id/reject', adminController.rejectSellerAccessRequest);

router.put('/seller-access-requests/:id/revoke', adminController.revokeSellerAccess);

export default router;
