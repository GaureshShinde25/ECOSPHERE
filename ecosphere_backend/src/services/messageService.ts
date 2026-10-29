import mssql from 'mssql';
import { databaseService } from './databaseService.js';
import { notificationService } from './notificationService.js';
import { logger } from '../utils/logger.js';

export interface ConversationSummary {
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

export interface MessageDetail {
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

export const messageService = {
  /**
   * Get all active conversations for authenticated user
   */
  async getConversations(userIdStr: string): Promise<ConversationSummary[]> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) throw new Error('UNAUTHORIZED_USER');

    try {
      // Find all conversations where current user is active participant
      const convRes = await databaseService.query<any>(
        `SELECT 
           c.ConversationId, c.ConversationType, c.Title, c.ReferenceType, c.ReferenceId, c.CreatedAt, c.UpdatedAt,
           cp.LastReadAt,
           op.UserId AS OtherUserId,
           ou.FirstName AS OtherFirstName, ou.LastName AS OtherLastName
         FROM ConversationParticipants cp WITH (NOLOCK)
         INNER JOIN Conversations c WITH (NOLOCK) ON cp.ConversationId = c.ConversationId
         INNER JOIN ConversationParticipants op WITH (NOLOCK) ON c.ConversationId = op.ConversationId AND op.UserId <> @dbUserId AND op.IsActive = 1
         INNER JOIN Users ou WITH (NOLOCK) ON op.UserId = ou.UserId
         WHERE cp.UserId = @dbUserId AND cp.IsActive = 1 AND c.IsActive = 1
         ORDER BY COALESCE(c.UpdatedAt, c.CreatedAt) DESC`,
        [{ name: 'dbUserId', type: mssql.BigInt(), value: dbUserId }]
      );

      const summaries: ConversationSummary[] = [];

      for (const r of convRes.recordset || []) {
        const convId = Number(r.ConversationId);
        const otherName = `${r.OtherFirstName || ''} ${r.OtherLastName || ''}`.trim() || 'ECOSPHERE User';
        const lastReadAt = r.LastReadAt ? new Date(r.LastReadAt) : new Date(0);

        // Fetch last message
        const lastMsgRes = await databaseService.query<any>(
          `SELECT TOP 1 MessageText, SentAt, IsDeleted
           FROM Messages WITH (NOLOCK)
           WHERE ConversationId = @convId
           ORDER BY MessageId DESC`,
          [{ name: 'convId', type: mssql.BigInt(), value: convId }]
        );

        let lastMessageText: string | undefined = undefined;
        let lastMessageSentAt: string | undefined = undefined;

        if (lastMsgRes.recordset && lastMsgRes.recordset.length > 0) {
          const lm = lastMsgRes.recordset[0];
          lastMessageText = lm.IsDeleted ? 'This message was deleted' : (lm.MessageText || '');
          lastMessageSentAt = lm.SentAt ? new Date(lm.SentAt).toISOString() : undefined;
        }

        // Count unread messages (messages sent after lastReadAt by other users)
        const unreadRes = await databaseService.query<any>(
          `SELECT COUNT(*) AS unread
           FROM Messages WITH (NOLOCK)
           WHERE ConversationId = @convId AND SenderUserId <> @dbUserId AND SentAt > @lastReadAt AND IsDeleted = 0`,
          [
            { name: 'convId', type: mssql.BigInt(), value: convId },
            { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
            { name: 'lastReadAt', type: mssql.DateTime2(), value: lastReadAt },
          ]
        );

        const unreadCount = unreadRes.recordset && unreadRes.recordset[0] ? Number(unreadRes.recordset[0].unread) : 0;

        summaries.push({
          id: String(r.ConversationId),
          conversationType: r.ConversationType || 'DIRECT',
          title: r.Title || undefined,
          referenceType: r.ReferenceType || undefined,
          referenceId: r.ReferenceId ? String(r.ReferenceId) : undefined,
          otherParticipantId: String(r.OtherUserId),
          otherParticipantName: otherName,
          otherParticipantInitials: getInitials(otherName),
          lastMessageText,
          lastMessageSentAt,
          unreadCount,
          createdAt: r.CreatedAt ? new Date(r.CreatedAt).toISOString() : new Date().toISOString(),
          updatedAt: r.UpdatedAt ? new Date(r.UpdatedAt).toISOString() : undefined,
        });
      }

      return summaries;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed fetching conversations', { userIdStr, error: err.message });
      throw err;
    }
  },

  /**
   * Get existing or create new 1-on-1 conversation
   */
  async getOrCreateConversation(
    userIdStr: string,
    targetUserIdStr: string,
    referenceType?: string,
    referenceIdStr?: string
  ): Promise<ConversationSummary> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) throw new Error('UNAUTHORIZED_USER');

    const targetDbUserId = await resolveDbUserId(targetUserIdStr);
    if (!targetDbUserId) throw new Error('NOT_FOUND: Target recipient user not found');

    if (dbUserId === targetDbUserId) {
      throw new Error('INVALID_INPUT: You cannot start a conversation with yourself');
    }

    try {
      // Check if direct conversation already exists between these 2 users
      const existingRes = await databaseService.query<any>(
        `SELECT c.ConversationId
         FROM ConversationParticipants cp1 WITH (NOLOCK)
         INNER JOIN ConversationParticipants cp2 WITH (NOLOCK) ON cp1.ConversationId = cp2.ConversationId
         INNER JOIN Conversations c WITH (NOLOCK) ON cp1.ConversationId = c.ConversationId
         WHERE cp1.UserId = @dbUserId 
           AND cp2.UserId = @targetDbUserId 
           AND cp1.IsActive = 1 
           AND cp2.IsActive = 1 
           AND c.IsActive = 1
           AND c.ConversationType = 'DIRECT'`,
        [
          { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
          { name: 'targetDbUserId', type: mssql.BigInt(), value: targetDbUserId },
        ]
      );

      let convId: number;

      if (existingRes.recordset && existingRes.recordset.length > 0) {
        convId = Number(existingRes.recordset[0].ConversationId);
      } else {
        // Create new conversation
        const numericRefId = referenceIdStr ? parseInt(referenceIdStr.replace(/\D/g, ''), 10) : null;

        const insertConvRes = await databaseService.query<any>(
          `INSERT INTO Conversations (ConversationType, Title, ReferenceType, ReferenceId, CreatedByUserId, IsActive, CreatedAt)
           OUTPUT INSERTED.ConversationId
           VALUES ('DIRECT', NULL, @refType, @refId, @createdBy, 1, CURRENT_TIMESTAMP)`,
          [
            { name: 'refType', type: mssql.VarChar(50), value: referenceType || null },
            { name: 'refId', type: mssql.BigInt(), value: numericRefId && !isNaN(numericRefId) ? numericRefId : null },
            { name: 'createdBy', type: mssql.BigInt(), value: dbUserId },
          ]
        );

        convId = Number(insertConvRes.recordset[0].ConversationId);

        // Add both users as participants
        await databaseService.query(
          `INSERT INTO ConversationParticipants (ConversationId, UserId, JoinedAt, IsActive)
           VALUES (@convId, @user1, CURRENT_TIMESTAMP, 1),
                  (@convId, @user2, CURRENT_TIMESTAMP, 1)`,
          [
            { name: 'convId', type: mssql.BigInt(), value: convId },
            { name: 'user1', type: mssql.BigInt(), value: dbUserId },
            { name: 'user2', type: mssql.BigInt(), value: targetDbUserId },
          ]
        );
      }

      const allConvs = await this.getConversations(userIdStr);
      const found = allConvs.find((c) => c.id === String(convId));
      if (found) return found;

      // Fallback object formatting
      const targetUserRes = await databaseService.query<any>(
        'SELECT FirstName, LastName FROM Users WITH (NOLOCK) WHERE UserId = @id',
        [{ name: 'id', type: mssql.BigInt(), value: targetDbUserId }]
      );
      const tu = targetUserRes.recordset?.[0] || {};
      const otherName = `${tu.FirstName || ''} ${tu.LastName || ''}`.trim() || 'ECOSPHERE User';

      return {
        id: String(convId),
        conversationType: 'DIRECT',
        otherParticipantId: String(targetDbUserId),
        otherParticipantName: otherName,
        otherParticipantInitials: getInitials(otherName),
        unreadCount: 0,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      const err = error as Error;
      logger.error('Failed creating conversation', { userIdStr, targetUserIdStr, error: err.message });
      throw err;
    }
  },

  /**
   * Fetch messages for a conversation (Membership protected)
   */
  async getMessages(userIdStr: string, conversationIdStr: string): Promise<MessageDetail[]> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) throw new Error('UNAUTHORIZED_USER');

    const numericConvId = parseInt(conversationIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericConvId) || numericConvId <= 0) {
      throw new Error('NOT_FOUND: Conversation not found');
    }

    // Verify conversation existence
    const convCheck = await databaseService.query<any>(
      'SELECT 1 FROM Conversations WITH (NOLOCK) WHERE ConversationId = @convId AND IsActive = 1',
      [{ name: 'convId', type: mssql.BigInt(), value: numericConvId }]
    );

    if (!convCheck.recordset || convCheck.recordset.length === 0) {
      throw new Error('NOT_FOUND: Conversation not found');
    }

    // Verify participant membership
    const partCheck = await databaseService.query<any>(
      'SELECT 1 FROM ConversationParticipants WITH (NOLOCK) WHERE ConversationId = @convId AND UserId = @userId AND IsActive = 1',
      [
        { name: 'convId', type: mssql.BigInt(), value: numericConvId },
        { name: 'userId', type: mssql.BigInt(), value: dbUserId },
      ]
    );

    if (!partCheck.recordset || partCheck.recordset.length === 0) {
      throw new Error('FORBIDDEN: You are not a participant in this conversation');
    }

    // Fetch messages
    const msgRes = await databaseService.query<any>(
      `SELECT 
         m.MessageId, m.ConversationId, m.SenderUserId, m.MessageType, m.MessageText,
         m.IsEdited, m.IsDeleted, m.SentAt,
         u.FirstName, u.LastName,
         CASE WHEN mrs.MessageReadStatusId IS NOT NULL THEN 1 ELSE 0 END AS IsRead
       FROM Messages m WITH (NOLOCK)
       INNER JOIN Users u WITH (NOLOCK) ON m.SenderUserId = u.UserId
       LEFT JOIN MessageReadStatus mrs WITH (NOLOCK) ON m.MessageId = mrs.MessageId AND mrs.UserId = @dbUserId
       WHERE m.ConversationId = @convId
       ORDER BY m.MessageId ASC`,
      [
        { name: 'convId', type: mssql.BigInt(), value: numericConvId },
        { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
      ]
    );

    return (msgRes.recordset || []).map((r: any) => {
      const senderName = `${r.FirstName || ''} ${r.LastName || ''}`.trim() || 'ECOSPHERE User';
      const isOwnMessage = Number(r.SenderUserId) === dbUserId;

      return {
        id: String(r.MessageId),
        conversationId: String(r.ConversationId),
        senderUserId: String(r.SenderUserId),
        senderName,
        senderInitials: getInitials(senderName),
        isOwnMessage,
        messageType: r.MessageType || 'text',
        messageText: r.IsDeleted ? 'This message was deleted' : (r.MessageText || ''),
        isEdited: Boolean(r.IsEdited),
        isDeleted: Boolean(r.IsDeleted),
        sentAt: r.SentAt ? new Date(r.SentAt).toISOString() : new Date().toISOString(),
        isRead: Boolean(r.IsRead || isOwnMessage),
      };
    });
  },

  /**
   * Send a message in conversation (Membership protected)
   */
  async sendMessage(
    userIdStr: string,
    conversationIdStr: string,
    messageText: string,
    messageType: string = 'text'
  ): Promise<MessageDetail> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) throw new Error('UNAUTHORIZED_USER');

    const numericConvId = parseInt(conversationIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericConvId) || numericConvId <= 0) {
      throw new Error('NOT_FOUND: Conversation not found');
    }

    const cleanText = messageText ? messageText.trim() : '';
    if (!cleanText || cleanText.length < 1 || cleanText.length > 5000) {
      throw new Error('INVALID_INPUT: Message text cannot be empty or exceed 5000 characters');
    }

    // Verify participant membership
    const partCheck = await databaseService.query<any>(
      'SELECT 1 FROM ConversationParticipants WITH (NOLOCK) WHERE ConversationId = @convId AND UserId = @userId AND IsActive = 1',
      [
        { name: 'convId', type: mssql.BigInt(), value: numericConvId },
        { name: 'userId', type: mssql.BigInt(), value: dbUserId },
      ]
    );

    if (!partCheck.recordset || partCheck.recordset.length === 0) {
      throw new Error('FORBIDDEN: You are not a participant in this conversation');
    }

    try {
      const insertRes = await databaseService.query<any>(
        `INSERT INTO Messages (ConversationId, SenderUserId, MessageType, MessageText, IsEdited, IsDeleted, SentAt)
         OUTPUT INSERTED.MessageId
         VALUES (@convId, @userId, @msgType, @msgText, 0, 0, CURRENT_TIMESTAMP)`,
        [
          { name: 'convId', type: mssql.BigInt(), value: numericConvId },
          { name: 'userId', type: mssql.BigInt(), value: dbUserId },
          { name: 'msgType', type: mssql.VarChar(30), value: messageType.toLowerCase() },
          { name: 'msgText', type: mssql.NVarChar(mssql.MAX), value: cleanText },
        ]
      );

      const newMsgId = String(insertRes.recordset[0].MessageId);

      // Update Conversation UpdatedAt
      await databaseService.query(
        'UPDATE Conversations SET UpdatedAt = CURRENT_TIMESTAMP WHERE ConversationId = @convId',
        [{ name: 'convId', type: mssql.BigInt(), value: numericConvId }]
      );

      const msgs = await this.getMessages(userIdStr, conversationIdStr);
      const sent = msgs.find((m) => m.id === newMsgId);
      if (!sent) throw new Error('FAILED_SEND_MESSAGE');

      // Notify recipient conversation participants
      const otherParticipantsRes = await databaseService.query<any>(
        `SELECT UserId FROM ConversationParticipants WITH (NOLOCK) 
         WHERE ConversationId = @convId AND UserId <> @senderId AND IsActive = 1`,
        [
          { name: 'convId', type: mssql.BigInt(), value: numericConvId },
          { name: 'senderId', type: mssql.BigInt(), value: dbUserId },
        ]
      );

      for (const p of otherParticipantsRes.recordset || []) {
        notificationService.createNotification({
          userId: Number(p.UserId),
          notificationType: 'MESSAGE',
          title: `New Message from ${sent.senderName}`,
          message: cleanText.length > 80 ? `${cleanText.substring(0, 77)}...` : cleanText,
          referenceType: 'Conversation',
          referenceId: conversationIdStr,
        }).catch((e: any) => logger.warn('Messaging notification error', { error: e?.message }));
      }

      return sent;
    } catch (error) {
      const err = error as Error;
      logger.error('Failed sending message', { userIdStr, conversationIdStr, error: err.message });
      throw err;
    }
  },

  /**
   * Mark conversation messages as read
   */
  async markAsRead(userIdStr: string, conversationIdStr: string): Promise<{ success: boolean; message: string }> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) throw new Error('UNAUTHORIZED_USER');

    const numericConvId = parseInt(conversationIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericConvId) || numericConvId <= 0) {
      throw new Error('NOT_FOUND: Conversation not found');
    }

    // Update LastReadAt in ConversationParticipants
    await databaseService.query(
      `UPDATE ConversationParticipants 
       SET LastReadAt = CURRENT_TIMESTAMP 
       WHERE ConversationId = @convId AND UserId = @dbUserId`,
      [
        { name: 'convId', type: mssql.BigInt(), value: numericConvId },
        { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
      ]
    );

    // Insert read status records for unread messages
    await databaseService.query(
      `INSERT INTO MessageReadStatus (MessageId, UserId, ReadAt)
       SELECT m.MessageId, @dbUserId, CURRENT_TIMESTAMP
       FROM Messages m WITH (NOLOCK)
       LEFT JOIN MessageReadStatus mrs WITH (NOLOCK) ON m.MessageId = mrs.MessageId AND mrs.UserId = @dbUserId
       WHERE m.ConversationId = @convId AND m.SenderUserId <> @dbUserId AND mrs.MessageReadStatusId IS NULL`,
      [
        { name: 'convId', type: mssql.BigInt(), value: numericConvId },
        { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
      ]
    );

    return { success: true, message: 'Conversation marked as read' };
  },

  /**
   * Delete message (Soft delete, sender ownership protected)
   */
  async deleteMessage(userIdStr: string, messageIdStr: string): Promise<{ success: boolean; message: string }> {
    const dbUserId = await resolveDbUserId(userIdStr);
    if (!dbUserId) throw new Error('UNAUTHORIZED_USER');

    const numericMsgId = parseInt(messageIdStr.replace(/\D/g, ''), 10);
    if (isNaN(numericMsgId) || numericMsgId <= 0) {
      throw new Error('NOT_FOUND: Message not found');
    }

    const checkRes = await databaseService.query<any>(
      'SELECT SenderUserId FROM Messages WITH (NOLOCK) WHERE MessageId = @msgId AND IsDeleted = 0',
      [{ name: 'msgId', type: mssql.BigInt(), value: numericMsgId }]
    );

    if (!checkRes.recordset || checkRes.recordset.length === 0) {
      throw new Error('NOT_FOUND: Message not found');
    }

    const senderUserId = Number(checkRes.recordset[0].SenderUserId);
    if (senderUserId !== dbUserId) {
      throw new Error('FORBIDDEN: You can only delete your own messages');
    }

    await databaseService.query(
      'UPDATE Messages SET IsDeleted = 1, DeletedAt = CURRENT_TIMESTAMP WHERE MessageId = @msgId AND SenderUserId = @dbUserId',
      [
        { name: 'msgId', type: mssql.BigInt(), value: numericMsgId },
        { name: 'dbUserId', type: mssql.BigInt(), value: dbUserId },
      ]
    );

    return { success: true, message: 'Message deleted successfully' };
  },
};
