import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Theme } from '../theme';
import { GlassCard } from '../components/cards/GlassCard';
import { ArrowLeft, Send, Search, MessageSquare, Trash2, CheckCheck } from 'lucide-react-native';
import { messageService, Conversation, Message } from '../services/messageService';

interface ChatScreenProps {
  initialConversation?: Conversation | null;
  initialTargetUserId?: string;
  initialTargetUserName?: string;
  onBack?: () => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  initialConversation,
  initialTargetUserId,
  initialTargetUserName,
  onBack,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(initialConversation || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const fetchConversations = async () => {
    setLoading(true);
    const list = await messageService.getConversations();
    setConversations(list);
    setLoading(false);
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (initialTargetUserId && !initialConversation) {
      messageService
        .getOrCreateConversation(initialTargetUserId)
        .then((conv) => {
          setActiveConversation(conv);
          fetchConversations();
        })
        .catch((err) => {
          if (__DEV__) console.warn('Failed starting conversation', err);
        });
    }
  }, [initialTargetUserId]);

  const loadMessages = async (convId: string) => {
    setLoadingMessages(true);
    const msgs = await messageService.getMessages(convId);
    setMessages(msgs);
    setLoadingMessages(false);
    messageService.markAsRead(convId);

    // Auto-scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    if (activeConversation) {
      loadMessages(activeConversation.id);
    }
  }, [activeConversation]);

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv);
  };

  const handleSendMessage = async () => {
    if (!activeConversation || !inputMessage.trim()) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    try {
      const sentMsg = await messageService.sendMessage(activeConversation.id, textToSend);
      setMessages((prev) => [...prev, sentMsg]);

      // Update last message in conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversation.id
            ? { ...c, lastMessageText: textToSend, lastMessageSentAt: new Date().toISOString() }
            : c
        )
      );

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (err: any) {
      Alert.alert('Send Failed', err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = (msgId: string) => {
    Alert.alert('Delete Message', 'Are you sure you want to delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await messageService.deleteMessage(msgId);
          if (activeConversation) {
            loadMessages(activeConversation.id);
          }
        },
      },
    ]);
  };

  const filteredConversations = conversations.filter((c) =>
    c.otherParticipantName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      {/* Top Navigation Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => {
            if (activeConversation && !initialConversation) {
              setActiveConversation(null);
            } else if (onBack) {
              onBack();
            }
          }}
          style={styles.backBtn}
        >
          <ArrowLeft size={22} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          {activeConversation ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.avatarMini}>
                <Text style={styles.avatarMiniText}>{activeConversation.otherParticipantInitials}</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>{activeConversation.otherParticipantName}</Text>
                <Text style={styles.headerSub}>Online</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.headerTitle}>Messages & Chat</Text>
          )}
        </View>
      </View>

      {/* Main View: Inbox or Thread */}
      {!activeConversation ? (
        // INBOX VIEW
        <ScrollView contentContainerStyle={styles.inboxContent} showsVerticalScrollIndicator={false}>
          {/* Search Filter */}
          <View style={styles.searchBar}>
            <Search size={18} color={Theme.colors.secondaryText} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search conversations..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {loading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
              <Text style={styles.loadingText}>Loading Conversations...</Text>
            </View>
          ) : filteredConversations.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <MessageSquare size={36} color={Theme.colors.secondaryText} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySub}>
                Start messaging merchants, service providers, or job posters across ECOSPHERE!
              </Text>
            </GlassCard>
          ) : (
            filteredConversations.map((conv) => (
              <TouchableOpacity key={conv.id} onPress={() => handleSelectConversation(conv)}>
                <GlassCard style={styles.convCard}>
                  <View style={styles.avatarLarge}>
                    <Text style={styles.avatarLargeText}>{conv.otherParticipantInitials}</Text>
                  </View>

                  <View style={styles.convInfo}>
                    <View style={styles.convHeaderRow}>
                      <Text style={styles.participantName}>{conv.otherParticipantName}</Text>
                      {conv.lastMessageSentAt && (
                        <Text style={styles.convTime}>
                          {new Date(conv.lastMessageSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      )}
                    </View>

                    <View style={styles.convHeaderRow}>
                      <Text style={styles.lastMsgText} numberOfLines={1}>
                        {conv.lastMessageText || 'Tap to start conversation'}
                      </Text>
                      {conv.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>{conv.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                </GlassCard>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      ) : (
        // THREAD VIEW
        <View style={{ flex: 1 }}>
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {loadingMessages ? (
              <ActivityIndicator size="small" color={Theme.colors.primary} style={{ marginVertical: 30 }} />
            ) : messages.length === 0 ? (
              <Text style={styles.emptyThreadText}>Send a message to start chatting!</Text>
            ) : (
              messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[styles.msgBubbleRow, msg.isOwnMessage ? styles.ownMsgRow : styles.otherMsgRow]}
                >
                  <View style={[styles.msgBubble, msg.isOwnMessage ? styles.ownMsgBubble : styles.otherMsgBubble]}>
                    <Text style={[styles.msgText, msg.isOwnMessage && { color: '#07111F' }]}>
                      {msg.messageText}
                    </Text>
                    <View style={styles.msgFooter}>
                      <Text style={[styles.msgTime, msg.isOwnMessage && { color: 'rgba(7, 17, 31, 0.7)' }]}>
                        {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      {msg.isOwnMessage && !msg.isDeleted && (
                        <TouchableOpacity onPress={() => handleDeleteMessage(msg.id)} style={{ marginLeft: 6 }}>
                          <Trash2 size={12} color="rgba(7, 17, 31, 0.6)" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))
            )}
          </ScrollView>

          {/* Bottom Message Input Bar */}
          <View style={styles.inputBar}>
            <TextInput
              style={styles.messageTextInput}
              placeholder="Write a message..."
              placeholderTextColor="#64748B"
              value={inputMessage}
              onChangeText={setInputMessage}
              multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage} disabled={sending}>
              {sending ? (
                <ActivityIndicator size="small" color="#07111F" />
              ) : (
                <Send size={18} color="#07111F" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: 'rgba(13, 24, 40, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backBtn: {
    marginRight: 14,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  headerSub: {
    fontSize: 11,
    color: Theme.colors.success,
    fontWeight: '600',
    fontFamily: Theme.typography.fontFamily,
  },
  avatarMini: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarMiniText: {
    color: '#07111F',
    fontSize: 12,
    fontWeight: '800',
  },
  inboxContent: {
    padding: Theme.spacing.lg,
    paddingBottom: 110,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 24, 40, 0.7)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    marginBottom: Theme.spacing.md,
  },
  searchInput: {
    flex: 1,
    height: 44,
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: Theme.typography.fontFamily,
  },
  centerLoading: {
    paddingVertical: 50,
    alignItems: 'center',
  },
  loadingText: {
    color: Theme.colors.secondaryText,
    marginTop: 10,
    fontSize: 13,
    fontFamily: Theme.typography.fontFamily,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  emptySub: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: 6,
    fontFamily: Theme.typography.fontFamily,
  },
  convCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 10,
  },
  avatarLarge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(47, 214, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarLargeText: {
    color: Theme.colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  convInfo: {
    flex: 1,
  },
  convHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  convTime: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  lastMsgText: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    flex: 1,
    marginRight: 8,
    fontFamily: Theme.typography.fontFamily,
  },
  unreadBadge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  unreadBadgeText: {
    color: '#07111F',
    fontSize: 11,
    fontWeight: '800',
  },
  messagesContent: {
    padding: Theme.spacing.lg,
    paddingBottom: 20,
  },
  emptyThreadText: {
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 13,
    fontFamily: Theme.typography.fontFamily,
  },
  msgBubbleRow: {
    marginVertical: 4,
    flexDirection: 'row',
  },
  ownMsgRow: {
    justifyContent: 'flex-end',
  },
  otherMsgRow: {
    justifyContent: 'flex-start',
  },
  msgBubble: {
    maxWidth: '78%',
    padding: 12,
    borderRadius: 16,
  },
  ownMsgBubble: {
    backgroundColor: Theme.colors.primary,
    borderBottomRightRadius: 2,
  },
  otherMsgBubble: {
    backgroundColor: 'rgba(13, 24, 40, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 2,
  },
  msgText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 19,
    fontFamily: Theme.typography.fontFamily,
  },
  msgFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  msgTime: {
    fontSize: 10,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(13, 24, 40, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  messageTextInput: {
    flex: 1,
    backgroundColor: 'rgba(7, 17, 31, 0.8)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    maxHeight: 90,
    fontFamily: Theme.typography.fontFamily,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
