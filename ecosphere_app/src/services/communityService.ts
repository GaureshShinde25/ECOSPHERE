import { apiClient } from './apiClient';

export interface CommunityPost {
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
  imageUrl?: string;
  mediaUrl?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CommunityComment {
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

export interface GetPostsParams {
  page?: number;
  limit?: number;
  postType?: string;
  q?: string;
}

export const communityService = {
  /**
   * Fetch paginated list of posts GET /api/community/posts
   */
  async getPosts(params?: GetPostsParams): Promise<{ posts: CommunityPost[]; total: number; page: number; totalPages: number }> {
    try {
      const page = params?.page || 1;
      const limit = params?.limit || 20;
      let url = `/community/posts?page=${page}&limit=${limit}`;

      if (params?.postType) {
        url += `&postType=${encodeURIComponent(params.postType)}`;
      }
      if (params?.q) {
        url += `&q=${encodeURIComponent(params.q)}`;
      }

      const response = await apiClient.get<any>(url, { requiresAuth: false });

      if (response && response.success) {
        return {
          posts: response.posts || [],
          total: response.total || 0,
          page: response.page || 1,
          totalPages: response.totalPages || 1,
        };
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[communityService.getPosts] Failed to fetch posts', error);
      }
    }

    return { posts: [], total: 0, page: 1, totalPages: 1 };
  },

  /**
   * Fetch single post details GET /api/community/posts/:id
   */
  async getPostById(id: string): Promise<CommunityPost | null> {
    try {
      const response = await apiClient.get<any>(`/community/posts/${id}`, { requiresAuth: false });
      if (response && response.success) {
        return response;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[communityService.getPostById] Error:', error);
      }
    }
    return null;
  },

  /**
   * Create new community post POST /api/community/posts
   */
  async createPost(data: { postText: string; postType?: string; visibility?: string; businessId?: string }): Promise<CommunityPost> {
    const response = await apiClient.post<any>('/community/posts', data, { requiresAuth: true });
    if (response && response.id) {
      return response;
    }
    throw new Error(response?.error?.message || 'Failed to publish community post');
  },

  /**
   * Update existing post PUT /api/community/posts/:id
   */
  async updatePost(id: string, data: { postText: string; postType?: string }): Promise<CommunityPost> {
    const response = await apiClient.put<any>(`/community/posts/${id}`, data, { requiresAuth: true });
    if (response && response.id) {
      return response;
    }
    throw new Error(response?.error?.message || 'Failed to update post');
  },

  /**
   * Delete post DELETE /api/community/posts/:id
   */
  async deletePost(id: string): Promise<boolean> {
    const response = await apiClient.delete<any>(`/community/posts/${id}`, { requiresAuth: true });
    return Boolean(response && response.success);
  },

  /**
   * Toggle post like POST /api/community/posts/:id/like
   */
  async toggleLike(id: string): Promise<{ isLiked: boolean; likeCount: number }> {
    const response = await apiClient.post<any>(`/community/posts/${id}/like`, {}, { requiresAuth: true });
    if (response && typeof response.isLiked === 'boolean') {
      return { isLiked: response.isLiked, likeCount: response.likeCount };
    }
    return { isLiked: false, likeCount: 0 };
  },

  /**
   * Get comments for a post GET /api/community/posts/:postId/comments
   */
  async getComments(postId: string): Promise<CommunityComment[]> {
    try {
      const response = await apiClient.get<any>(`/community/posts/${postId}/comments`, { requiresAuth: false });
      if (response && response.comments) {
        return response.comments;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[communityService.getComments] Error:', error);
      }
    }
    return [];
  },

  /**
   * Create comment on post POST /api/community/posts/:postId/comments
   */
  async createComment(postId: string, commentText: string, parentCommentId?: string): Promise<CommunityComment> {
    const response = await apiClient.post<any>(`/community/posts/${postId}/comments`, {
      commentText,
      parentCommentId,
    }, { requiresAuth: true });

    if (response && response.id) {
      return response;
    }
    throw new Error(response?.error?.message || 'Failed to post comment');
  },

  /**
   * Update comment PUT /api/community/comments/:id
   */
  async updateComment(id: string, commentText: string): Promise<CommunityComment> {
    const response = await apiClient.put<any>(`/community/comments/${id}`, { commentText }, { requiresAuth: true });
    if (response && response.id) {
      return response;
    }
    throw new Error(response?.error?.message || 'Failed to update comment');
  },

  /**
   * Delete comment DELETE /api/community/comments/:id
   */
  async deleteComment(id: string): Promise<boolean> {
    const response = await apiClient.delete<any>(`/community/comments/${id}`, { requiresAuth: true });
    return Boolean(response && response.success);
  },

  /**
   * Alias for createComment
   */
  async addComment(postId: string, commentText: string, parentCommentId?: string): Promise<CommunityComment> {
    return this.createComment(postId, commentText, parentCommentId);
  },
};
