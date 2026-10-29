import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';
import { sendError } from './utils/response.js';
// Reload trigger: ECOSPHERE Role & Seller Type Architecture
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import profileRoutes from './routes/profile.routes.js';
import businessRoutes from './routes/business.routes.js';
import serviceRoutes from './routes/service.routes.js';
import productRoutes from './routes/product.routes.js';
import orderRoutes from './routes/order.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import jobRoutes from './routes/job.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reviewRoutes from './routes/review.routes.js';
import searchRoutes from './routes/search.routes.js';
import favoriteRoutes from './routes/favorite.routes.js';
import communityRoutes from './routes/community.routes.js';
import messageRoutes from './routes/message.routes.js';
import customerDashboardRoutes from './routes/customerDashboard.routes.js';
import sellerDashboardRoutes from './routes/sellerDashboard.routes.js';
import adminRoutes from './routes/admin.routes.js';
import opportunityRoutes from './routes/opportunity.routes.js';
import recommendationRoutes from './routes/recommendation.routes.js';
import economicIntelligenceRoutes from './routes/economicIntelligence.routes.js';
import aiRoutes from './routes/ai.routes.js';
import decisionIntelligenceRoutes from './routes/decisionIntelligence.routes.js';
import trendRoutes from './routes/trend.routes.js';
import skillRoutes from './routes/skill.routes.js';
import activationRoutes from './routes/activation.routes.js';
import path from 'path';
import feedbackRoutes from './routes/feedback.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import sellerAccessRoutes from './routes/sellerAccess.routes.js';
import locationRoutes from './routes/location.routes.js';
import groceryRoutes from './routes/grocery.routes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { databaseService } from './services/databaseService.js';
import { groceryService } from './services/groceryService.js';

const app = express();

// Security HTTP headers with cross-origin resource policy allowing images to be loaded
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS configuration
app.use(
  cors({
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    credentials: true,
  })
);

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Structured Request Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
    });
  });
  next();
});

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/seller-access', sellerAccessRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/customer', customerDashboardRoutes);
app.use('/api/seller', sellerDashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', opportunityRoutes);
app.use('/api', recommendationRoutes);
app.use('/api', economicIntelligenceRoutes);
app.use('/api', aiRoutes);
app.use('/api', decisionIntelligenceRoutes);
app.use('/api', trendRoutes);
app.use('/api', skillRoutes);
app.use('/api/activation', activationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/grocery', groceryRoutes);

// 404 Route Handler
app.use((req: Request, res: Response) => {
  return sendError(res, 'NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`, 404);
});

// Centralized Error Middleware
app.use(errorMiddleware);

// Server startup
const server = app.listen(env.PORT, () => {
  logger.info(`🚀 ECOSPHERE Backend running on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`Health check: http://localhost:${env.PORT}/api/health`);
  logger.info(`Database health check: http://localhost:${env.PORT}/api/health/database`);
  groceryService.initializeDatabase().catch((err) => {
    logger.warn('Grocery schema init warning:', { error: (err as Error).message });
  });
});

// Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await databaseService.close();
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export default app;
