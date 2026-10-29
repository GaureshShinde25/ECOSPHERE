import { apiClient } from './apiClient';

export interface Conversation {
  id: string;
  conversationType: string;
  title?: string;
  referenceType?: string;
  referenceId?: string;
  otherParticipantId: string;
  otherParticipantName: string;
  otherParticipantInitials: string;
  lastMessageText?: string;
  lastMessageSentAt?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderUserId: string;
  senderName: string;
  senderInitials: string;
  isOwnMessage: boolean;
  messageType: string;
  messageText: string;
  isEdited: boolean;
  isDeleted: boolean;
  sentAt: string;
  isRead: boolean;
}

export const messageService = {
  /**
   * Get conversations list GET /api/messages/conversations
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const response = await apiClient.get<any>('/messages/conversations', { requiresAuth: true });
      if (response && response.conversations) {
        return response.conversations;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[messageService.getConversations] Error:', error);
      }
    }
    return [];
  },

  /**
   * Start or find 1-on-1 conversation POST /api/messages/conversations
   */
  async getOrCreateConversation(
    targetUserId: string,
    referenceType?: string,
    referenceId?: string
  ): Promise<Conversation> {
    const response = await apiClient.post<any>(
      '/messages/conversations',
      { targetUserId, referenceType, referenceId },
      { requiresAuth: true }
    );
    if (response && response.id) {
      return response;
    }
    throw new Error(response?.error?.message || 'Failed to initialize conversation');
  },

  /**
   * Get messages in conversation GET /api/messages/conversations/:id
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const response = await apiClient.get<any>(`/messages/conversations/${conversationId}`, { requiresAuth: true });
      if (response && response.messages) {
        return response.messages;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('[messageService.getMessages] Error:', error);
      }
    }
    return [];
  },

  /**
   * Send message in conversation POST /api/messages/conversations/:id/messages
   */
  async sendMessage(conversationId: string, messageText: string): Promise<Message> {
    const response = await apiClient.post<any>(
      `/messages/conversations/${conversationId}/messages`,
      { messageText },
      { requiresAuth: true }
    );
    if (response && response.id) {
      return response;
    }
    throw new Error(response?.error?.message || 'Failed to send message');
  },

  /**
   * Mark conversation as read PUT /api/messages/conversations/:id/read
   */
  async markAsRead(conversationId: string): Promise<boolean> {
    try {
      const response = await apiClient.put<any>(`/messages/conversations/${conversationId}/read`, {}, { requiresAuth: true });
      return Boolean(response && response.success);
    } catch (error) {
      return false;
    }
  },

  /**
   * Delete message DELETE /api/messages/:id
   */
  async deleteMessage(messageId: string): Promise<boolean> {
    const response = await apiClient.delete<any>(`/messages/${messageId}`, { requiresAuth: true });
    return Boolean(response && response.success);
  },
};
