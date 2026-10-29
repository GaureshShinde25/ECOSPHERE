import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Image,
  Dimensions,
} from 'react-native';
import {
  Sparkles,
  Send,
  TrendingUp,
  Briefcase,
  Store,
  Compass,
  ArrowRight,
  ShieldCheck,
  Bot,
  User,
  Mic,
  Lightbulb,
  LineChart,
  FileText,
} from 'lucide-react-native';
import { Theme } from '../theme';
import {
  aiService,
  StructuredAIResponseData,
  AISourceItem,
  AIActionItem,
  AIAnalysisPayload,
} from '../services/aiService';

const { width } = Dimensions.get('window');

interface MessageItem {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  intent?: string;
  sources?: AISourceItem[];
  actions?: AIActionItem[];
  analysis?: AIAnalysisPayload;
}

interface AiScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

const PROMPT_SUGGESTIONS = [
  {
    id: 'opps',
    label: 'Find the best business opportunities near me.',
    icon: Sparkles,
    desc: 'Local commerce matches & underserved demands',
  },
  {
    id: 'skills',
    label: 'Show trending skills for jobs.',
    icon: TrendingUp,
    desc: 'In-demand vocational & freelance work',
  },
  {
    id: 'services',
    label: 'Suggest services I can start.',
    icon: Lightbulb,
    desc: 'Low-capital neighbourhood service ideas',
  },
  {
    id: 'trends',
    label: 'Analyze local market trends.',
    icon: LineChart,
    desc: 'Customer search pulses and spending flows',
  },
  {
    id: 'plan',
    label: 'Help me create a business plan.',
    icon: FileText,
    desc: 'Step-by-step local business launch roadmap',
  },
];

export const AiScreen: React.FC<AiScreenProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, isLoading]);

  const handleSendMessage = async (queryText?: string) => {
    const messageToSend = (queryText || inputText).trim();
    if (!messageToSend || isLoading) return;

    const userMessageId = `msg-user-${Date.now()}`;
    const userMsg: MessageItem = {
      id: userMessageId,
      sender: 'user',
      text: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputText('');
    setIsLoading(true);

    try {
      const response: StructuredAIResponseData = await aiService.queryAIChat(messageToSend);
      const aiMessageId = `msg-ai-${Date.now()}`;
      const aiMsg: MessageItem = {
        id: aiMessageId,
        sender: 'ai',
        text: response.message,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        intent: response.intent,
        sources: response.sources,
        actions: response.actions,
        analysis: response.analysis,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const errorMsg: MessageItem = {
        id: `msg-err-${Date.now()}`,
        sender: 'ai',
        text: 'ECOSPHERE AI is currently updating real-time local signals. Please try asking again in a moment.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 70 : 0}
      >
        {/* Header Bar */}
        <View style={styles.topHeader}>
          <View style={styles.headerIconCircle}>
            <Sparkles size={20} color="#6D28D9" />
          </View>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>ECOSPHERE AI</Text>
            <Text style={styles.headerSubtitle}>
              Your Local Economy Assistant
            </Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Ready</Text>
          </View>
        </View>

        {/* Scrollable Conversation or Welcome Hero */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* ========================================================
              WELCOME HERO (ecosystem-ai-assistant.png)
             ======================================================== */}
          {messages.length === 0 && (
            <View style={styles.welcomeContainer}>
              {/* Mascot Presentation Hero Card */}
              <View style={styles.mascotHeroCard}>
                <View style={styles.mascotImageWrapper}>
                  <Image
                    source={require('../../assets/images/ai/ecosystem-ai-assistant.png')}
                    style={styles.mascotImage}
                    resizeMode="contain"
                  />
                </View>

                <View style={styles.mascotInfo}>
                  <View style={styles.mascotBadge}>
                    <Text style={styles.mascotBadgeText}>LOCAL ECONOMY COPILOT</Text>
                  </View>
                  <Text style={styles.mascotTitle}>
                    Hi there! 👋
                  </Text>
                  <Text style={styles.mascotSubtext}>
                    Ask me anything about local businesses, job opportunities, market trends, or how to grow in your community.
                  </Text>
                </View>
              </View>

              {/* Prompt Suggestions */}
              <View style={styles.promptSection}>
                <Text style={styles.promptSectionTitle}>Suggested Prompts</Text>

                <View style={styles.promptList}>
                  {PROMPT_SUGGESTIONS.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.promptCard}
                        activeOpacity={0.82}
                        onPress={() => handleSendMessage(item.label)}
                        accessibilityLabel={item.label}
                      >
                        <View style={styles.promptCardLeft}>
                          <View style={styles.promptIconBox}>
                            <IconComp size={18} color="#6D28D9" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.promptLabel}>{item.label}</Text>
                            <Text style={styles.promptDesc}>{item.desc}</Text>
                          </View>
                        </View>
                        <ArrowRight size={16} color={Theme.colors.emerald} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* ========================================================
              CONVERSATION MESSAGES
             ======================================================== */}
          {messages.map((item) => {
            const isAi = item.sender === 'ai';
            return (
              <View
                key={item.id}
                style={[
                  styles.messageRow,
                  isAi ? styles.messageRowAi : styles.messageRowUser,
                ]}
              >
                {/* Assistant Avatar */}
                {isAi && (
                  <View style={styles.avatarAi}>
                    <Sparkles size={14} color="#6D28D9" />
                  </View>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    isAi ? styles.bubbleAi : styles.bubbleUser,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isAi ? styles.messageTextAi : styles.messageTextUser,
                    ]}
                  >
                    {item.text}
                  </Text>

                  {/* Grounded Signals (if present) */}
                  {item.sources && item.sources.length > 0 && (
                    <View style={styles.sourcesContainer}>
                      <Text style={styles.sourcesHeader}>GROUNDED SIGNALS</Text>
                      {item.sources.map((src, i) => (
                        <View key={i} style={styles.sourceItem}>
                          <Text style={styles.sourceText} numberOfLines={1}>
                            • {src.title || src.entityType} ({src.metricLabel || 'Verified'})
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Suggested Actions (Emerald Action Buttons) */}
                  {item.actions && item.actions.length > 0 && (
                    <View style={styles.actionsContainer}>
                      {item.actions.map((act, i) => (
                        <TouchableOpacity
                          key={i}
                          style={styles.aiActionBtn}
                          activeOpacity={0.8}
                          onPress={() => {
                            if (act.targetScreen) {
                              onNavigate(act.targetScreen, act.targetParams);
                            } else {
                              onNavigate('Explore');
                            }
                          }}
                        >
                          <Text style={styles.aiActionBtnText}>{act.label}</Text>
                          <ArrowRight size={13} color="#FFFFFF" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <Text
                    style={[
                      styles.timestampText,
                      isAi ? styles.timestampAi : styles.timestampUser,
                    ]}
                  >
                    {item.timestamp}
                  </Text>
                </View>

                {/* User Avatar */}
                {!isAi && (
                  <View style={styles.avatarUser}>
                    <User size={14} color="#FFFFFF" />
                  </View>
                )}
              </View>
            );
          })}

          {/* Loading Indicator Bubble */}
          {isLoading && (
            <View style={styles.loadingRow}>
              <View style={styles.avatarAi}>
                <Sparkles size={14} color="#6D28D9" />
              </View>
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={Theme.colors.emerald} />
                <Text style={styles.loadingText}>
                  Synthesizing local intelligence...
                </Text>
              </View>
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>

        {/* ========================================================
            ACCESSIBLE INPUT BAR (Text input, Send button, Microphone icon)
           ======================================================== */}
        <View style={styles.inputBarWrapper}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Ask anything about local work, shops, or growth..."
              placeholderTextColor={Theme.colors.secondaryText}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={() => handleSendMessage()}
              returnKeyType="send"
              multiline={false}
              accessibilityLabel="Type a message to AI assistant"
            />

            <TouchableOpacity
              style={styles.micButton}
              activeOpacity={0.75}
              onPress={() => handleSendMessage('What is trending nearby right now?')}
              accessibilityLabel="Voice input"
            >
              <Mic size={18} color={Theme.colors.forestGreen} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
              ]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.85}
              accessibilityLabel="Send message"
            >
              <Send size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF7', // Main background
  },
  keyboardView: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border, // #E4EBE3
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 10,
    paddingBottom: 12,
  },
  headerIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.colors.aiAccent, // #EEE8FF
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.primaryText, // #17231B
    fontFamily: Theme.typography.headingFont,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Theme.colors.secondaryText, // #68756B
    fontFamily: Theme.typography.bodyFont,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.emerald,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.forestGreen,
  },
  scrollContainer: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  // Welcome Hero Section
  welcomeContainer: {
    width: '100%',
  },
  mascotHeroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#E6E0F8',
    padding: 18,
    alignItems: 'center',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#6D28D9',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  },
  mascotImageWrapper: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Theme.colors.aiSurface, // #F7F4FF
    borderWidth: 2,
    borderColor: Theme.colors.aiBorder,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 14,
  },
  mascotImage: {
    width: '100%',
    height: '100%',
  },
  mascotInfo: {
    alignItems: 'center',
  },
  mascotBadge: {
    backgroundColor: Theme.colors.aiAccent, // #EEE8FF
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 8,
  },
  mascotBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6D28D9',
    letterSpacing: 0.5,
  },
  mascotTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Theme.colors.primaryText, // #17231B
    fontFamily: Theme.typography.headingFont,
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 24,
  },
  mascotSubtext: {
    fontSize: 13,
    color: Theme.colors.secondaryText, // #68756B
    fontFamily: Theme.typography.bodyFont,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 300,
  },

  // Prompt Section
  promptSection: {
    marginBottom: 20,
  },
  promptSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.headingFont,
    marginBottom: 10,
  },
  promptList: {
    gap: 8,
  },
  promptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border, // #E4EBE3
    padding: 14,
    minHeight: 52,
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  promptCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
    gap: 12,
  },
  promptIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Theme.colors.aiAccent, // #EEE8FF
    justifyContent: 'center',
    alignItems: 'center',
  },
  promptLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.bodyFont,
  },
  promptDesc: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.bodyFont,
    marginTop: 1,
  },

  // Message Rows
  messageRow: {
    flexDirection: 'row',
    marginBottom: 14,
    maxWidth: '92%',
  },
  messageRowAi: {
    alignSelf: 'flex-start',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
  },
  avatarAi: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.aiAccent, // #EEE8FF
    borderWidth: 1,
    borderColor: Theme.colors.aiBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  avatarUser: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Theme.colors.emerald, // #16A34A
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginTop: 2,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    maxWidth: width * 0.74,
  },
  bubbleAi: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E0F8', // subtle lavender border
    borderTopLeftRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#6D28D9',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  bubbleUser: {
    backgroundColor: Theme.colors.emerald, // #16A34A
    borderTopRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: Theme.typography.bodyFont,
  },
  messageTextAi: {
    color: Theme.colors.primaryText, // #17231B
  },
  messageTextUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  sourcesContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE8FF',
  },
  sourcesHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6D28D9',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  sourceItem: {
    marginBottom: 2,
  },
  sourceText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.bodyFont,
  },
  actionsContainer: {
    marginTop: 10,
    gap: 6,
  },
  aiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Theme.colors.emerald, // #16A34A
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  aiActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.bodyFont,
  },
  timestampText: {
    fontSize: 10,
    marginTop: 6,
  },
  timestampAi: {
    color: Theme.colors.secondaryText,
    alignSelf: 'flex-start',
  },
  timestampUser: {
    color: 'rgba(255, 255, 255, 0.75)',
    alignSelf: 'flex-end',
  },

  // Loading
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E6E0F8',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.bodyFont,
  },

  // Input Bar
  inputBarWrapper: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border, // #E4EBE3
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: Platform.OS === 'ios' ? 8 : 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF7',
    borderWidth: 1,
    borderColor: Theme.colors.border, // #E4EBE3
    borderRadius: 24,
    paddingLeft: 16,
    paddingRight: 6,
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Theme.colors.primaryText, // #17231B
    fontFamily: Theme.typography.bodyFont,
    paddingVertical: 8,
  },
  micButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F9F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.colors.emerald, // #16A34A
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});

export default AiScreen;
