import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { notificationService } from './notificationService.js';
import { logger } from '../utils/logger.js';

export interface CommunityPostDetail {
  id: string;
  userId: string;
  authorName: string;
  authorInitials: string;
  businessId?: string;
  businessName?: string;
  postText: string;
  postType: string;
  visibility: string;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewCount: number;
  isEdited: boolean;
  isLiked?: boolean;
  isOwnPost?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityCommentDetail {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  authorInitials: string;
  parentCommentId?: string;
  commentText: string;
  likeCount: number;
  isEdited: boolean;
  isOwnComment?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface GetPostsOptions {
  page?: number;
  limit?: number;
  postType?: string;
  q?: string;
  userIdStr?: string;
}

async function resolveDbUserId(userIdStr: string): Promise<number> {
  if (!userIdStr) return 0;
  const directId = parseInt(userIdStr, 10);
  if (!isNaN(directId) && directId > 0 && directId < 1000000) {
    const userById = await databaseService.query<any>(
      'SELECT TOP 1 UserId FROM Users WITH (NOLOCK) WHERE UserId = @numId',
      [{ name: 'numId', type: mssql.BigInt(), value: directId }]
    );
    if (userById.recordset && userById.recordset.length > 0) {
      return Number(userById.recordset[0].UserId);
    }
  }

  const cleanMobile = userIdStr.replace(/\D/g, '');
  const searchMobile = cleanMobile.length >= 10 ? cleanMobile.slice(-10) : '';

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

function getInitials(name?: string): string {
  if (!name) return 'ES';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export const communityService = {
  /**
   * Fetch paginated list of community posts
   */
  async getPosts(options: GetPostsOptions): Promise<{ posts: CommunityPostDetail[]; page: number; limit: number; total: number; totalPages: number }> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.min(100, Math.max(1, options.limit || 20));
    const offset = (page - 1) * limit;

    const currentDbUserId = options.userIdStr ? await resolveDbUserId(options.userIdStr) : 0;

    try {
      let whereClause = 'WHERE p.IsActive = 1 AND p.IsHidden = 0';
      const params: any[] = [];

      if (options.postType && options.postType.toLowerCase() !== 'all') {
        whereClause += ' AND p.PostType = @postType';
        params.push({ name: 'postType', type: mssql.VarChar(30), value: options.postType.toUpperCase() });
      }

      if (options.q && options.q.trim().length > 0) {
        whereClause += ' AND p.PostText LIKE @query';
        params.push({ name: 'query', type: mssql.NVarChar(500), value: `%${options.q.trim()}%` });
      }

      // Count query
      const countRes = await databaseService.query<any>(
        `SELECT COUNT(*) AS total FROM CommunityPosts p WITH (NOLOCK) ${whereClause}`,
        params
      );
      const total = countRes.recordset[0].total || 0;
      const totalPages = Math.ceil(total / limit) || 1;

      // Add pagination params
      const fetchParams = [
        ...params,
        { name: 'offset', type: mssql.Int(), value: offset },
        { name: 'limit', type: mssql.Int(), value: limit },
        { name: 'currentDbUserId', type: mssql.BigInt(), value: currentDbUserId },
      ];

      const queryStr = `
        SELECT 
          p.PostId, p.UserId, p.BusinessId, p.PostText, p.PostType, p.Visibility,
          p.LikeCount, p.CommentCount, p.ShareCount, p.ViewCount, p.IsEdited, p.CreatedAt, p.UpdatedAt,
          u.FirstName, u.LastName,
          b.BusinessName,
          CASE WHEN pl.PostLikeId IS NOT NULL THEN 1 ELSE 0 END AS IsLiked
        FROM CommunityPosts p WITH (NOLOCK)
        INNER JOIN Users u WITH (NOLOCK) ON p.UserId = u.UserId
        LEFT JOIN Businesses b WITH (NOLOCK) ON p.BusinessId = b.BusinessId
        LEFT JOIN CommunityPostLikes pl WITH (NOLOCK) ON p.PostId = pl.PostId AND pl.UserId = @currentDbUserId
        ${whereClause}
        ORDER BY p.PostId DESC
        OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY
      `;

      const postsRes = await databaseService.query<any>(queryStr, fetchParams);

      const posts: CommunityPostDetail[] = (postsRes.recordset || []).map((r: any) => {
        const authorName = `${r.FirstName || ''} ${r.LastName || ''}`.trim() || 'ECOSPHERE Member';
        const isOwnPost = currentDbUserId > 0 && Number(r.UserId) === currentDbUserId;

        return {
          id: String(r.PostId),
          userId: String(r.UserId),
          authorName,
          authorInitials: getInitials(authorName),
          businessId: r.BusinessId ? String(r.BusinessId) : undefined,
          businessName: r.BusinessName || undefined,
          postText: r.PostText || '',
          postType: r.PostType || 'GENERAL',
          visibility: r.Visibility || 'PUBLIC',
          likeCount: Number(r.LikeCount || 0),
          commentCount: Number(r.CommentCount || 0),
          shareCount: Number(r.ShareCount || 0),
          viewCount: Number(r.ViewCount || 0),
          isEdited: Boolean(r.IsEdited),
          isLiked: Boolean(r.IsLiked),
          isOwnPost,
          createdAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : new Date().toISOString(),
          updatedAt: r.UpdatedAt ? new Date(r.UpdatedAt).toISOString() : undefined,
        };
      });

      return { posts, page, limit, total, totalPages };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed fetching community posts', { error: err.message });
      throw err;
    }
  },

  /**
   * Get single post by ID
   */
  async getPostById(postIdStr: string, userIdStr?: string): Promise<CommunityPostDetail> {
    const numericId = parseInt(postIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericId) || numericId <= 0) {
      throw new Error('NOT_FOUND: Post not found');
    }

    const currentDbUserId = userIdStr ? await resolveDbUserId(userIdStr) : 0;

    const res = await databaseService.query<any>(
      `SELECT 
         p.PostId, p.UserId, p.BusinessId, p.PostText, p.PostType, p.Visibility,
         p.LikeCount, p.CommentCount, p.ShareCount, p.ViewCount, p.IsEdited, p.CreatedAt, p.UpdatedAt,
         u.FirstName, u.LastName,
         b.BusinessName,
         CASE WHEN pl.PostLikeId IS NOT NULL THEN 1 ELSE 0 END AS IsLiked
       FROM CommunityPosts p WITH (NOLOCK)
       INNER JOIN Users u WITH (NOLOCK) ON p.UserId = u.UserId
       LEFT JOIN Businesses b WITH (NOLOCK) ON p.BusinessId = b.BusinessId
       LEFT JOIN CommunityPostLikes pl WITH (NOLOCK) ON p.PostId = pl.PostId AND pl.UserId = @currentDbUserId
       WHERE p.PostId = @postId AND p.IsActive = 1`,
      [
        { name: 'postId', type: mssql.BigInt(), value: numericId },
        { name: 'currentDbUserId', type: mssql.BigInt(), value: currentDbUserId },
      ]
    );

    if (!res.recordset || res.recordset.length === 0) {
      throw new Error('NOT_FOUND: Post not found');
    }

    const r = res.recordset[0];
    const authorName = `${r.FirstName || ''} ${r.LastName || ''}`.trim() || 'ECOSPHERE Member';
    const isOwnPost = currentDbUserId > 0 && Number(r.UserId) === currentDbUserId;

    return {
      id: String(r.PostId),
      userId: String(r.UserId),
      authorName,
      authorInitials: getInitials(authorName),
      businessId: r.BusinessId ? String(r.BusinessId) : undefined,
      businessName: r.BusinessName || undefined,
      postText: r.PostText || '',
      postType: r.PostType || 'GENERAL',
      visibility: r.Visibility || 'PUBLIC',
      likeCount: Number(r.LikeCount || 0),
      commentCount: Number(r.CommentCount || 0),
      shareCount: Number(r.ShareCount || 0),
      viewCount: Number(r.ViewCount || 0),
      isEdited: Boolean(r.IsEdited),
      isLiked: Boolean(r.IsLiked),
      isOwnPost,
      createdAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : new Date().toISOString(),
      updatedAt: r.UpdatedAt ? new Date(r.UpdatedAt).toISOString() : undefined,
    };
  },

  /**
   * Create new post
   */
  async createPost(userIdStr: string, data: { postText: string; postType?: string; visibility?: string; businessId?: string }): Promise<CommunityPostDetail> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) throw new Error('UNAUTHORIZED_USER');

    const cleanText = data.postText ? data.postText.trim() : '';
    if (!cleanText || cleanText.length < 3 || cleanText.length > 5000) {
      throw new Error('INVALID_INPUT: Post text must be between 3 and 5000 characters');
    }

    const postType = data.postType ? data.postType.toUpperCase() : 'GENERAL';
    const visibility = data.visibility ? data.visibility.toUpperCase() : 'PUBLIC';
    const numericBusinessId = data.businessId ? parseInt(data.businessId.replace(/\D/g, ''), 10) : null;

    try {
      const insertRes = await databaseService.query<any>(
        `INSERT INTO CommunityPosts (UserId, BusinessId, PostText, PostType, Visibility, LikeCount, CommentCount, ShareCount, ViewCount, IsEdited, IsActive, IsHidden, CreatedAt)
         OUTPUT INSERTED.PostId
         VALUES (@userId, @businessId, @postText, @postType, @visibility, 0, 0, 0, 0, 0, 1, 0, CURRENT_TIMESTAMP)`,
        [
          { name: 'userId', type: mssql.BigInt(), value: dbUserId },
          { name: 'businessId', type: mssql.BigInt(), value: numericBusinessId && !isNaN(numericBusinessId) ? numericBusinessId : null },
          { name: 'postText', type: mssql.NVarChar(mssql.MAX), value: cleanText },
          { name: 'postType', type: mssql.VarChar(30), value: postType },
          { name: 'visibility', type: mssql.VarChar(30), value: visibility },
        ]
      );

      const newPostId = String(insertRes.recordset[0].PostId);
      return this.getPostById(newPostId, userIdStr);
    } catch (error) {
      const err = error as Error;
      logger.error('Failed creating community post', { userIdStr, error: err.message });
      throw err;
    }
  },

  /**
   * Update existing post (Ownership protected)
   */
  async updatePost(userIdStr: string, postIdStr: string, data: { postText: string; postType?: string }): Promise<CommunityPostDetail> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) throw new Error('UNAUTHORIZED_USER');

    const numericPostId = parseInt(postIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericPostId) || numericPostId <= 0) throw new Error('NOT_FOUND: Post not found');

    const checkRes = await databaseService.query<any>(
      'SELECT UserId FROM CommunityPosts WITH (NOLOCK) WHERE PostId = @postId AND IsActive = 1',
      [{ name: 'postId', type: mssql.BigInt(), value: numericPostId }]
    );

    if (!checkRes.recordset || checkRes.recordset.length === 0) {
      throw new Error('NOT_FOUND: Post not found');
    }

    const postAuthorId = Number(checkRes.recordset[0].UserId);
    if (postAuthorId !== dbUserId) {
      throw new Error('FORBIDDEN: You can only edit your own posts');
    }

    const cleanText = data.postText ? data.postText.trim() : '';
    if (!cleanText || cleanText.length < 3 || cleanText.length > 5000) {
      throw new Error('INVALID_INPUT: Post text must be between 3 and 5000 characters');
    }

    await databaseService.query(
      `UPDATE CommunityPosts 
       SET PostText = @postText,
           PostType = COALESCE(@postType, PostType),
           IsEdited = 1,
           UpdatedAt = CURRENT_TIMESTAMP
       WHERE PostId = @postId AND UserId = @dbUserId`,
      [
        { name: 'postText', type: mssql.NVarChar(mssql.MAX), value: cleanText },
        { name: 'postType', type: mssql.VarChar(30), value: data.postType ? data.postType.toUpperCase() : null },
        { name: 'postId', type: mssql.BigInt(), value: numericPostId },
        { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
      ]
    );

    return this.getPostById(postIdStr, userIdStr);
  },

  /**
   * Delete post (Soft delete, ownership protected)
   */
  async deletePost(userIdStr: string, postIdStr: string): Promise<{ success: boolean; message: string }> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) throw new Error('UNAUTHORIZED_USER');

    const numericPostId = parseInt(postIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericPostId) || numericPostId <= 0) throw new Error('NOT_FOUND: Post not found');

    const checkRes = await databaseService.query<any>(
      'SELECT UserId FROM CommunityPosts WITH (NOLOCK) WHERE PostId = @postId AND IsActive = 1',
      [{ name: 'postId', type: mssql.BigInt(), value: numericPostId }]
    );

    if (!checkRes.recordset || checkRes.recordset.length === 0) {
      throw new Error('NOT_FOUND: Post not found');
    }

    const postAuthorId = Number(checkRes.recordset[0].UserId);
    if (postAuthorId !== dbUserId) {
      throw new Error('FORBIDDEN: You can only delete your own posts');
    }

    await databaseService.query(
      'UPDATE CommunityPosts SET IsActive = 0, UpdatedAt = CURRENT_TIMESTAMP WHERE PostId = @postId AND UserId = @dbUserId',
      [
        { name: 'postId', type: mssql.BigInt(), value: numericPostId },
        { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
      ]
    );

    return { success: true, message: 'Post deleted successfully' };
  },

  /**
   * Toggle post like
   */
  async togglePostLike(userIdStr: string, postIdStr: string): Promise<{ isLiked: boolean; likeCount: number }> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) throw new Error('UNAUTHORIZED_USER');

    const numericPostId = parseInt(postIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericPostId) || numericPostId <= 0) throw new Error('NOT_FOUND: Post not found');

    // Check existing like
    const likeCheck = await databaseService.query<any>(
      'SELECT TOP 1 PostLikeId FROM CommunityPostLikes WITH (NOLOCK) WHERE PostId = @postId AND UserId = @userId',
      [
        { name: 'postId', type: mssql.BigInt(), value: numericPostId },
        { name: 'userId', type: mssql.BigInt(), value: dbUserId },
      ]
    );

    let isLiked = false;
    if (likeCheck.recordset && likeCheck.recordset.length > 0) {
      // Remove like
      await databaseService.query(
        'DELETE FROM CommunityPostLikes WHERE PostId = @postId AND UserId = @userId',
        [
          { name: 'postId', type: mssql.BigInt(), value: numericPostId },
          { name: 'userId', type: mssql.BigInt(), value: dbUserId },
        ]
      );
      await databaseService.query(
        'UPDATE CommunityPosts SET LikeCount = CASE WHEN LikeCount > 0 THEN LikeCount - 1 ELSE 0 END WHERE PostId = @postId',
        [{ name: 'postId', type: mssql.BigInt(), value: numericPostId }]
      );
      isLiked = false;
    } else {
      // Add like
      await databaseService.query(
        'INSERT INTO CommunityPostLikes (PostId, UserId, CreatedAt) VALUES (@postId, @userId, CURRENT_TIMESTAMP)',
        [
          { name: 'postId', type: mssql.BigInt(), value: numericPostId },
          { name: 'userId', type: mssql.BigInt(), value: dbUserId },
        ]
      );
      await databaseService.query(
        'UPDATE CommunityPosts SET LikeCount = LikeCount + 1 WHERE PostId = @postId',
        [{ name: 'postId', type: mssql.BigInt(), value: numericPostId }]
      );
      isLiked = true;

      // Notify post author if not self-like
      const postOwnerRes = await databaseService.query<any>(
        'SELECT UserId FROM CommunityPosts WITH (NOLOCK) WHERE PostId = @postId',
        [{ name: 'postId', type: mssql.BigInt(), value: numericPostId }]
      );
      if (postOwnerRes.recordset?.[0]?.UserId && Number(postOwnerRes.recordset[0].UserId) !== dbUserId) {
        notificationService.createNotification({
          userId: Number(postOwnerRes.recordset[0].UserId),
          notificationType: 'COMMUNITY_LIKE',
          title: 'New Like on Your Post',
          message: 'Someone liked your community post.',
          referenceType: 'CommunityPost',
          referenceId: postIdStr,
        }).catch((e: any) => logger.warn('Community like notification error', { error: (e as Error).message }));
      }
    }

    const postRes = await databaseService.query<any>(
      'SELECT LikeCount FROM CommunityPosts WITH (NOLOCK) WHERE PostId = @postId',
      [{ name: 'postId', type: mssql.BigInt(), value: numericPostId }]
    );

    const likeCount = postRes.recordset && postRes.recordset.length > 0 ? Number(postRes.recordset[0].LikeCount) : 0;
    return { isLiked, likeCount };
  },

  /**
   * Fetch comments for a post
   */
  async getComments(postIdStr: string, userIdStr?: string): Promise<CommunityCommentDetail[]> {
    const numericPostId = parseInt(postIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericPostId) || numericPostId <= 0) return [];

    const currentDbUserId = userIdStr ? await resolveDbUserId(userIdStr) : 0;

    const res = await databaseService.query<any>(
      `SELECT 
         c.CommentId, c.PostId, c.UserId, c.ParentCommentId, c.CommentText,
         c.LikeCount, c.IsEdited, c.CreatedAt, c.UpdatedAt,
         u.FirstName, u.LastName
       FROM CommunityPostComments c WITH (NOLOCK)
       INNER JOIN Users u WITH (NOLOCK) ON c.UserId = u.UserId
       WHERE c.PostId = @postId AND c.IsActive = 1
       ORDER BY c.CommentId ASC`,
      [{ name: 'postId', type: mssql.BigInt(), value: numericPostId }]
    );

    return (res.recordset || []).map((r: any) => {
      const authorName = `${r.FirstName || ''} ${r.LastName || ''}`.trim() || 'ECOSPHERE Member';
      const isOwnComment = currentDbUserId > 0 && Number(r.UserId) === currentDbUserId;

      return {
        id: String(r.CommentId),
        postId: String(r.PostId),
        userId: String(r.UserId),
        authorName,
        authorInitials: getInitials(authorName),
        parentCommentId: r.ParentCommentId ? String(r.ParentCommentId) : undefined,
        commentText: r.CommentText || '',
        likeCount: Number(r.LikeCount || 0),
        isEdited: Boolean(r.IsEdited),
        isOwnComment,
        createdAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : new Date().toISOString(),
        updatedAt: r.UpdatedAt ? new Date(r.UpdatedAt).toISOString() : undefined,
      };
    });
  },

  /**
   * Create comment on post
   */
  async createComment(userIdStr: string, postIdStr: string, commentText: string, parentCommentIdStr?: string): Promise<CommunityCommentDetail> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) throw new Error('UNAUTHORIZED_USER');

    const numericPostId = parseInt(postIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericPostId) || numericPostId <= 0) throw new Error('NOT_FOUND: Post not found');

    // Post existence check
    const postCheck = await databaseService.query<any>(
      'SELECT 1 FROM CommunityPosts WITH (NOLOCK) WHERE PostId = @postId AND IsActive = 1',
      [{ name: 'postId', type: mssql.BigInt(), value: numericPostId }]
    );
    if (!postCheck.recordset || postCheck.recordset.length === 0) {
      throw new Error('NOT_FOUND: Post not found');
    }

    const cleanText = commentText ? commentText.trim() : '';
    if (!cleanText || cleanText.length < 1 || cleanText.length > 2000) {
      throw new Error('INVALID_INPUT: Comment text must be between 1 and 2000 characters');
    }

    const numericParentId = parentCommentIdStr ? parseInt(parentCommentIdStr.replace(/\D/g, ''), 10) : null;

    const insertRes = await databaseService.query<any>(
      `INSERT INTO CommunityPostComments (PostId, UserId, ParentCommentId, CommentText, LikeCount, IsEdited, IsActive, CreatedAt)
       OUTPUT INSERTED.CommentId
       VALUES (@postId, @userId, @parentId, @commentText, 0, 0, 1, CURRENT_TIMESTAMP)`,
      [
        { name: 'postId', type: mssql.BigInt(), value: numericPostId },
        { name: 'userId', type: mssql.BigInt(), value: dbUserId },
        { name: 'parentId', type: mssql.BigInt(), value: numericParentId && !isNaN(numericParentId) ? numericParentId : null },
        { name: 'commentText', type: mssql.NVarChar(2000), value: cleanText },
      ]
    );

    // Increment CommentCount on Post
    await databaseService.query(
      'UPDATE CommunityPosts SET CommentCount = CommentCount + 1 WHERE PostId = @postId',
      [{ name: 'postId', type: mssql.BigInt(), value: numericPostId }]
    );

    const newCommentId = String(insertRes.recordset[0].CommentId);
    const comments = await this.getComments(postIdStr, userIdStr);
    const created = comments.find((c) => c.id === newCommentId);
    if (!created) {
      throw new Error('FAILED_CREATE_COMMENT');
    }

    // Notify post author if not self-comment
    const postOwnerRes = await databaseService.query<any>(
      'SELECT UserId FROM CommunityPosts WITH (NOLOCK) WHERE PostId = @postId',
      [{ name: 'postId', type: mssql.BigInt(), value: numericPostId }]
    );
    if (postOwnerRes.recordset?.[0]?.UserId && Number(postOwnerRes.recordset[0].UserId) !== dbUserId) {
      notificationService.createNotification({
        userId: Number(postOwnerRes.recordset[0].UserId),
        notificationType: 'COMMUNITY_COMMENT',
        title: 'New Comment on Your Post',
        message: cleanText.length > 80 ? `${cleanText.substring(0, 77)}...` : cleanText,
        referenceType: 'CommunityPost',
        referenceId: postIdStr,
      }).catch((e: any) => logger.warn('Community comment notification error', { error: (e as Error).message }));
    }

    return created;
  },

  /**
   * Update comment (Ownership protected)
   */
  async updateComment(userIdStr: string, commentIdStr: string, commentText: string): Promise<CommunityCommentDetail> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) throw new Error('UNAUTHORIZED_USER');

    const numericCommentId = parseInt(commentIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericCommentId) || numericCommentId <= 0) throw new Error('NOT_FOUND: Comment not found');

    const checkRes = await databaseService.query<any>(
      'SELECT PostId, UserId FROM CommunityPostComments WITH (NOLOCK) WHERE CommentId = @commentId AND IsActive = 1',
      [{ name: 'commentId', type: mssql.BigInt(), value: numericCommentId }]
    );

    if (!checkRes.recordset || checkRes.recordset.length === 0) {
      throw new Error('NOT_FOUND: Comment not found');
    }

    const commentAuthorId = Number(checkRes.recordset[0].UserId);
    const postId = String(checkRes.recordset[0].PostId);
    if (commentAuthorId !== dbUserId) {
      throw new Error('FORBIDDEN: You can only edit your own comments');
    }

    const cleanText = commentText ? commentText.trim() : '';
    if (!cleanText || cleanText.length < 1 || cleanText.length > 2000) {
      throw new Error('INVALID_INPUT: Comment text must be between 1 and 2000 characters');
    }

    await databaseService.query(
      `UPDATE CommunityPostComments 
       SET CommentText = @commentText, IsEdited = 1, UpdatedAt = CURRENT_TIMESTAMP 
       WHERE CommentId = @commentId AND UserId = @dbUserId`,
      [
        { name: 'commentText', type: mssql.NVarChar(2000), value: cleanText },
        { name: 'commentId', type: mssql.BigInt(), value: numericCommentId },
        { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
      ]
    );

    const comments = await this.getComments(postId, userIdStr);
    const updated = comments.find((c) => c.id === String(numericCommentId));
    if (!updated) throw new Error('FAILED_UPDATE_COMMENT');
    return updated;
  },

  /**
   * Delete comment (Soft delete, ownership protected)
   */
  async deleteComment(userIdStr: string, commentIdStr: string): Promise<{ success: boolean; message: string }> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) throw new Error('UNAUTHORIZED_USER');

    const numericCommentId = parseInt(commentIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericCommentId) || numericCommentId <= 0) throw new Error('NOT_FOUND: Comment not found');

    const checkRes = await databaseService.query<any>(
      'SELECT PostId, UserId FROM CommunityPostComments WITH (NOLOCK) WHERE CommentId = @commentId AND IsActive = 1',
      [{ name: 'commentId', type: mssql.BigInt(), value: numericCommentId }]
    );

    if (!checkRes.recordset || checkRes.recordset.length === 0) {
      throw new Error('NOT_FOUND: Comment not found');
    }

    const commentAuthorId = Number(checkRes.recordset[0].UserId);
    const numericPostId = Number(checkRes.recordset[0].PostId);
    if (commentAuthorId !== dbUserId) {
      throw new Error('FORBIDDEN: You can only delete your own comments');
    }

    await databaseService.query(
      'UPDATE CommunityPostComments SET IsActive = 0, UpdatedAt = CURRENT_TIMESTAMP WHERE CommentId = @commentId AND UserId = @dbUserId',
      [
        { name: 'commentId', type: mssql.BigInt(), value: numericCommentId },
        { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
      ]
    );

    // Decrement CommentCount on Post
    await databaseService.query(
      'UPDATE CommunityPosts SET CommentCount = CASE WHEN CommentCount > 0 THEN CommentCount - 1 ELSE 0 END WHERE PostId = @postId',
      [{ name: 'postId', type: mssql.BigInt(), value: numericPostId }]
    );

    return { success: true, message: 'Comment deleted successfully' };
  },
};
