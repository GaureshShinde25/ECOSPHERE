import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { notificationService } from './notificationService.js';
import { logger } from '../utils/logger.js';

export interface CreateReviewInput {
  targetType: string; // 'Business', 'Service', 'Product', 'Order'
  targetId: string | number;
  rating: number; // 1 to 5
  title?: string;
  reviewText?: string;
}

export interface UpdateReviewInput {
  rating?: number;
  title?: string;
  reviewText?: string;
}

export interface GetReviewsOptions {
  targetType?: string;
  targetId?: string | number;
  userId?: string | number;
  page?: number;
  limit?: number;
}

export interface ReviewDetail {
  id: string;
  userId: string;
  reviewerName: string;
  targetType: string;
  targetId: string;
  rating: number;
  title?: string;
  reviewText?: string;
  status: string;
  createdAt: string;
  updatedAt?: string;
}

async function resolveDbUserId(userIdStr: string | number): Promise<number> {
  if (typeof userIdStr === 'number' && userIdStr > 0) {
    return userIdStr;
  }
  const directId = parseInt(String(userIdStr), 10);
  if (!isNaN(directId) && directId > 0 && directId < 1000000) {
    return directId;
  }

  const cleanMobile = String(userIdStr).replace(/\D/g, '');
  const searchMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : cleanMobile;

  if (searchMobile) {
    const userByMobile = await databaseService.query<any>(
      'SELECT TOP 1 UserId FROM Users WITH (NOLOCK) WHERE Mobile = @mobile',
      [{ name: 'mobile', type: mssql.NVarChar(50), value: searchMobile }]
    );
    if (userByMobile.recordset && userByMobile.recordset.length > 0) {
      return Number(userByMobile.recordset[0].UserId);
    }
  }

  return 0;
}

function mapDbRowToReview(row: any): ReviewDetail {
  const firstName = row.FirstName || 'Anonymous';
  const lastName = row.LastName ? ` ${row.LastName}` : '';
  return {
    id: String(row.ReviewId),
    userId: String(row.UserId),
    reviewerName: `${firstName}${lastName}`.trim(),
    targetType: row.TargetType,
    targetId: String(row.TargetId),
    rating: Number(row.Rating),
    title: row.Title || undefined,
    reviewText: row.ReviewText || undefined,
    status: row.Status || 'PUBLISHED',
    createdAt: row.CreatedAt ? new Date(row.CreatedAt).toISOString() : new Date().toISOString(),
    updatedAt: row.UpdatedAt ? new Date(row.UpdatedAt).toISOString() : undefined,
  };
}

async function syncBusinessRating(businessId: number): Promise<void> {
  try {
    const statsRes = await databaseService.query<any>(
      `SELECT 
         AVG(CAST(Rating AS DECIMAL(3,2))) AS AvgRating,
         COUNT(*) AS ReviewCount
       FROM Reviews WITH (NOLOCK)
       WHERE TargetType = 'Business' AND TargetId = @bizId AND Status = 'PUBLISHED'`,
      [{ name: 'bizId', type: mssql.BigInt(), value: businessId }]
    );

    const row = statsRes.recordset?.[0];
    const avgRating = row && row.AvgRating !== null ? Math.round(Number(row.AvgRating) * 100) / 100 : 0.00;
    const reviewCount = row && row.ReviewCount !== null ? Number(row.ReviewCount) : 0;

    await databaseService.query(
      `UPDATE Businesses 
       SET Rating = @rating, ReviewCount = @count, UpdatedAt = CURRENT_TIMESTAMP 
       WHERE BusinessId = @bizId`,
      [
        { name: 'rating', type: mssql.Decimal(3, 2), value: avgRating },
        { name: 'count', type: mssql.Int(), value: reviewCount },
        { name: 'bizId', type: mssql.BigInt(), value: businessId },
      ]
    );
  } catch (error) {
    const err = error as Error;
    logger.warn('Failed to synchronize business rating', { businessId, error: err.message });
  }
}

export const reviewService = {
  /**
   * Fetch reviews with filtering, pagination, average rating calculation
   */
  async getReviews(
    options: GetReviewsOptions = {}
  ): Promise<{
    reviews: ReviewDetail[];
    total: number;
    averageRating: number;
    ratingDistribution: { [star: number]: number };
  }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const whereClauses: string[] = ["r.Status = 'PUBLISHED'"];
    const sqlParams: Array<{ name: string; type: any; value: any }> = [];

    if (options.targetType && options.targetType.trim()) {
      const cleanType = options.targetType.trim();
      const formattedType = cleanType.charAt(0).toUpperCase() + cleanType.slice(1).toLowerCase();
      whereClauses.push('r.TargetType = @targetType');
      sqlParams.push({ name: 'targetType', type: mssql.VarChar(50), value: formattedType });
    }

    if (options.targetId) {
      const numTargetId = parseInt(String(options.targetId).replace(/\D/g, ''), 10);
      if (!isNaN(numTargetId)) {
        whereClauses.push('r.TargetId = @targetId');
        sqlParams.push({ name: 'targetId', type: mssql.BigInt(), value: numTargetId });
      }
    }

    if (options.userId) {
      const dbUserId = await resolveDbUserId(options.userId);
      if (dbUserId > 0) {
        whereClauses.push('r.UserId = @userId');
        sqlParams.push({ name: 'userId', type: mssql.BigInt(), value: dbUserId });
      }
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    try {
      const statsRes = await databaseService.query<any>(
        `SELECT 
           COUNT(*) AS TotalCount,
           AVG(CAST(r.Rating AS DECIMAL(3,2))) AS AvgRating
         FROM Reviews r WITH (NOLOCK)
         ${whereSql}`,
        sqlParams
      );

      const total = statsRes.recordset?.[0]?.TotalCount ? Number(statsRes.recordset[0].TotalCount) : 0;
      const averageRating = statsRes.recordset?.[0]?.AvgRating ? Math.round(Number(statsRes.recordset[0].AvgRating) * 10) / 10 : 0;

      // Rating distribution 1..5
      const distRes = await databaseService.query<any>(
        `SELECT r.Rating, COUNT(*) AS StarCount
         FROM Reviews r WITH (NOLOCK)
         ${whereSql}
         GROUP BY r.Rating`,
        sqlParams
      );

      const ratingDistribution: { [star: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      (distRes.recordset || []).forEach((row: any) => {
        const star = Number(row.Rating);
        if (star >= 1 && star <= 5) {
          ratingDistribution[star] = Number(row.StarCount);
        }
      });

      const pageParams = [
        ...sqlParams,
        { name: 'offset', type: mssql.Int(), value: offset },
        { name: 'limit', type: mssql.Int(), value: limit },
      ];

      const reviewsRes = await databaseService.query<any>(
        `SELECT 
           r.ReviewId, r.UserId, r.TargetType, r.TargetId, r.Rating, r.Title,
           r.ReviewText, r.Status, r.CreatedAt, r.UpdatedAt,
           u.FirstName, u.LastName
         FROM Reviews r WITH (NOLOCK)
         INNER JOIN Users u WITH (NOLOCK) ON r.UserId = u.UserId
         ${whereSql}
         ORDER BY r.ReviewId DESC
         OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
        pageParams
      );

      const reviews = (reviewsRes.recordset || []).map(mapDbRowToReview);
      return { reviews, total, averageRating, ratingDistribution };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query reviews', { options, error: err.message });
      throw err;
    }
  },

  /**
   * Fetch authenticated user's submitted reviews
   */
  async getMyReviews(requestingUserId: string): Promise<ReviewDetail[]> {
    const dbUserId = await resolveDbUserId(requestingUserId);
    if (!dbUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    try {
      const res = await databaseService.query<any>(
        `SELECT 
           r.ReviewId, r.UserId, r.TargetType, r.TargetId, r.Rating, r.Title,
           r.ReviewText, r.Status, r.CreatedAt, r.UpdatedAt,
           u.FirstName, u.LastName
         FROM Reviews r WITH (NOLOCK)
         INNER JOIN Users u WITH (NOLOCK) ON r.UserId = u.UserId
         WHERE r.UserId = @uId
         ORDER BY r.ReviewId DESC`,
        [{ name: 'uId', type: mssql.BigInt(), value: dbUserId }]
      );

      return (res.recordset || []).map(mapDbRowToReview);
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query my reviews', { requestingUserId, error: err.message });
      throw err;
    }
  },

  /**
   * Fetch single review detail by ID
   */
  async getReviewById(reviewIdStr: string): Promise<ReviewDetail | null> {
    const numericId = parseInt(reviewIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericId)) return null;

    try {
      const res = await databaseService.query<any>(
        `SELECT 
           r.ReviewId, r.UserId, r.TargetType, r.TargetId, r.Rating, r.Title,
           r.ReviewText, r.Status, r.CreatedAt, r.UpdatedAt,
           u.FirstName, u.LastName
         FROM Reviews r WITH (NOLOCK)
         INNER JOIN Users u WITH (NOLOCK) ON r.UserId = u.UserId
         WHERE r.ReviewId = @rId`,
        [{ name: 'rId', type: mssql.BigInt(), value: numericId }]
      );

      if (!res.recordset || res.recordset.length === 0) return null;
      return mapDbRowToReview(res.recordset[0]);
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to query review by ID', { reviewIdStr, error: err.message });
      throw err;
    }
  },

  /**
   * Submit new review with target existence validation & duplicate review protection
   */
  async createReview(requestingUserId: string, input: CreateReviewInput): Promise<ReviewDetail> {
    const dbUserId = await resolveDbUserId(requestingUserId);
    if (!dbUserId) {
      throw new Error('UNAUTHORIZED_USER');
    }

    // Validate rating
    const rating = Math.round(Number(input.rating));
    if (isNaN(rating) || rating < 1 || rating > 5) {
      throw new Error('INVALID_RATING: Rating must be an integer between 1 and 5');
    }

    // Validate TargetType
    const cleanType = String(input.targetType || '').trim();
    const formattedType = cleanType.charAt(0).toUpperCase() + cleanType.slice(1).toLowerCase();
    const validTypes = ['Business', 'Service', 'Product', 'Order'];
    if (!validTypes.includes(formattedType)) {
      throw new Error(`INVALID_TARGET_TYPE: Target type must be one of: ${validTypes.join(', ')}`);
    }

    // Validate TargetId
    const numericTargetId = parseInt(String(input.targetId).replace(/\D/g, ''), 10);
    if (isNaN(numericTargetId) || numericTargetId <= 0) {
      throw new Error('INVALID_TARGET_ID: Valid numeric target ID is required');
    }

    // Validate target entity existence in database
    if (formattedType === 'Business') {
      const bizCheck = await databaseService.query<any>(
        'SELECT 1 FROM Businesses WITH (NOLOCK) WHERE BusinessId = @tId',
        [{ name: 'tId', type: mssql.BigInt(), value: numericTargetId }]
      );
      if (!bizCheck.recordset || bizCheck.recordset.length === 0) {
        throw new Error(`TARGET_NOT_FOUND: Business with ID ${numericTargetId} does not exist`);
      }
    } else if (formattedType === 'Service') {
      const srvCheck = await databaseService.query<any>(
        'SELECT 1 FROM Services WITH (NOLOCK) WHERE ServiceId = @tId',
        [{ name: 'tId', type: mssql.BigInt(), value: numericTargetId }]
      );
      if (!srvCheck.recordset || srvCheck.recordset.length === 0) {
        throw new Error(`TARGET_NOT_FOUND: Service with ID ${numericTargetId} does not exist`);
      }
    } else if (formattedType === 'Product') {
      const prodCheck = await databaseService.query<any>(
        'SELECT 1 FROM Products WITH (NOLOCK) WHERE ProductId = @tId',
        [{ name: 'tId', type: mssql.BigInt(), value: numericTargetId }]
      );
      if (!prodCheck.recordset || prodCheck.recordset.length === 0) {
        throw new Error(`TARGET_NOT_FOUND: Product with ID ${numericTargetId} does not exist`);
      }
    } else if (formattedType === 'Order') {
      const ordCheck = await databaseService.query<any>(
        'SELECT 1 FROM Orders WITH (NOLOCK) WHERE OrderId = @tId AND CustomerUserId = @uId',
        [
          { name: 'tId', type: mssql.BigInt(), value: numericTargetId },
          { name: 'uId', type: mssql.BigInt(), value: dbUserId },
        ]
      );
      if (!ordCheck.recordset || ordCheck.recordset.length === 0) {
        throw new Error(`TARGET_NOT_FOUND: Order with ID ${numericTargetId} does not exist or does not belong to you`);
      }
    }

    // Duplicate Review Protection
    const dupCheck = await databaseService.query<any>(
      'SELECT 1 FROM Reviews WITH (NOLOCK) WHERE UserId = @uId AND TargetType = @tType AND TargetId = @tId',
      [
        { name: 'uId', type: mssql.BigInt(), value: dbUserId },
        { name: 'tType', type: mssql.VarChar(50), value: formattedType },
        { name: 'tId', type: mssql.BigInt(), value: numericTargetId },
      ]
    );
    if (dupCheck.recordset && dupCheck.recordset.length > 0) {
      throw new Error(`DUPLICATE_REVIEW: You have already submitted a review for this ${formattedType}`);
    }

    try {
      const insertRes = await databaseService.query<any>(
        `INSERT INTO Reviews (
           UserId, TargetType, TargetId, Rating, Title, ReviewText, Status, CreatedAt
         )
         OUTPUT INSERTED.ReviewId
         VALUES (
           @uId, @tType, @tId, @rating, @title, @text, 'PUBLISHED', CURRENT_TIMESTAMP
         )`,
        [
          { name: 'uId', type: mssql.BigInt(), value: dbUserId },
          { name: 'tType', type: mssql.VarChar(50), value: formattedType },
          { name: 'tId', type: mssql.BigInt(), value: numericTargetId },
          { name: 'rating', type: mssql.TinyInt(), value: rating },
          { name: 'title', type: mssql.NVarChar(250), value: input.title || null },
          { name: 'text', type: mssql.NVarChar(2000), value: input.reviewText || null },
        ]
      );

      const createdId = Number(insertRes.recordset[0].ReviewId);

      // Synchronize business aggregate rating
      if (formattedType === 'Business') {
        await syncBusinessRating(numericTargetId);
      }

      const created = await this.getReviewById(String(createdId));
      if (!created) {
        throw new Error('Review created successfully but failed to reload record');
      }

      // Notify business owner of new review
      if (formattedType === 'Business') {
        const bizOwnerRes = await databaseService.query<any>(
          'SELECT OwnerUserId FROM Businesses WHERE BusinessId = @bId',
          [{ name: 'bId', type: mssql.BigInt(), value: numericTargetId }]
        );
        if (bizOwnerRes.recordset?.[0]?.OwnerUserId) {
          notificationService.createNotification({
            userId: Number(bizOwnerRes.recordset[0].OwnerUserId),
            notificationType: 'BUSINESS_UPDATE',
            title: 'New Business Review Received',
            message: `Your business received a ${created.rating}★ review: "${created.title || 'Customer Review'}".`,
            referenceType: 'Business',
            referenceId: String(numericTargetId),
          }).catch((e: any) => logger.warn('Review seller notification error', { error: e?.message }));
        }
      }

      return created;
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('DUPLICATE_REVIEW') || err.message.includes('INVALID_') || err.message.includes('TARGET_')) {
        throw err;
      }
      logger.error('Failed to create review', { requestingUserId, input, error: err.message });
      throw err;
    }
  },

  /**
   * Edit submitted review with author verification
   */
  async updateReview(reviewIdStr: string, requestingUserId: string, input: UpdateReviewInput): Promise<ReviewDetail> {
    const existing = await this.getReviewById(reviewIdStr);
    if (!existing) {
      throw new Error('REVIEW_NOT_FOUND');
    }

    const dbUserId = await resolveDbUserId(requestingUserId);
    if (Number(existing.userId) !== dbUserId) {
      throw new Error('FORBIDDEN_REVIEW_MODIFICATION: You can only edit your own reviews');
    }

    let newRating = existing.rating;
    if (input.rating !== undefined) {
      const rVal = Math.round(Number(input.rating));
      if (isNaN(rVal) || rVal < 1 || rVal > 5) {
        throw new Error('INVALID_RATING: Rating must be an integer between 1 and 5');
      }
      newRating = rVal;
    }

    const numericReviewId = parseInt(existing.id, 10);

    try {
      await databaseService.query(
        `UPDATE Reviews 
         SET Rating = @rating, Title = @title, ReviewText = @text, UpdatedAt = CURRENT_TIMESTAMP 
         WHERE ReviewId = @rId AND UserId = @uId`,
        [
          { name: 'rating', type: mssql.TinyInt(), value: newRating },
          { name: 'title', type: mssql.NVarChar(250), value: input.title !== undefined ? input.title : existing.title || null },
          { name: 'text', type: mssql.NVarChar(2000), value: input.reviewText !== undefined ? input.reviewText : existing.reviewText || null },
          { name: 'rId', type: mssql.BigInt(), value: numericReviewId },
          { name: 'uId', type: mssql.BigInt(), value: dbUserId },
        ]
      );

      // Resync business rating if target is business
      if (existing.targetType === 'Business') {
        await syncBusinessRating(parseInt(existing.targetId, 10));
      }

      const updated = await this.getReviewById(reviewIdStr);
      if (!updated) {
        throw new Error('Review updated successfully but failed to reload record');
      }
      return updated;
    } catch (error) {
      const err = error as Error;
      if (err.message.includes('FORBIDDEN_') || err.message.includes('INVALID_')) throw err;
      logger.error('Failed to update review', { reviewIdStr, requestingUserId, error: err.message });
      throw err;
    }
  },

  /**
   * Delete review with author / administrator ownership verification
   */
  async deleteReview(reviewIdStr: string, requestingUserId: string, requestingRole: string): Promise<boolean> {
    const existing = await this.getReviewById(reviewIdStr);
    if (!existing) {
      throw new Error('REVIEW_NOT_FOUND');
    }

    const dbUserId = await resolveDbUserId(requestingUserId);
    const isOwner = Number(existing.userId) === dbUserId;
    const isAdmin = requestingRole === 'administrator';

    if (!isOwner && !isAdmin) {
      throw new Error('FORBIDDEN_REVIEW_MODIFICATION: You can only delete your own reviews');
    }

    const numericReviewId = parseInt(existing.id, 10);

    try {
      await databaseService.query(
        'DELETE FROM Reviews WHERE ReviewId = @rId',
        [{ name: 'rId', type: mssql.BigInt(), value: numericReviewId }]
      );

      // Resync business rating if target is business
      if (existing.targetType === 'Business') {
        await syncBusinessRating(parseInt(existing.targetId, 10));
      }

      return true;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed to delete review', { reviewIdStr, requestingUserId, error: err.message });
      throw err;
    }
  },
};
