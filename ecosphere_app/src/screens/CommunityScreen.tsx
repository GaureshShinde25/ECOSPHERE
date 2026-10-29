import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import {
  MessageSquare,
  Heart,
  Share2,
  Plus,
  Edit3,
  Trash2,
  X,
  Send,
  Sparkles,
  ArrowRight,
  Briefcase,
  Store,
  Wrench,
  Users,
  Calendar,
} from 'lucide-react-native';
import { Theme } from '../theme';
import {
  Card,
  Chip,
  Button,
  ProfileImage,
  CommunityImage,
  EmptyState,
} from '../components/ui';
import { communityService, CommunityPost, CommunityComment } from '../services/communityService';

export const CommunityScreen: React.FC = () => {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Create Post Modal State
  const [isCreateModalVisible, setIsCreateModalVisible] = useState<boolean>(false);
  const [newPostText, setNewPostText] = useState<string>('');
  const [newPostType, setNewPostType] = useState<string>('OPPORTUNITY');
  const [publishing, setPublishing] = useState<boolean>(false);

  // Edit Post Modal State
  const [editingPost, setEditingPost] = useState<CommunityPost | null>(null);
  const [editPostText, setEditPostText] = useState<string>('');
  const [updating, setUpdating] = useState<boolean>(false);

  // Comments Modal State
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [loadingComments, setLoadingComments] = useState<boolean>(false);
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);

  const fetchPosts = async () => {
    setLoading(true);
    const filterType = activeTab === 'all' ? undefined : activeTab.toUpperCase();
    const res = await communityService.getPosts({ page, limit: 10, postType: filterType, q: searchQuery });
    setPosts(res.posts);
    setTotalPages(res.totalPages);
    setLoading(false);
  };

  useEffect(() => {
    fetchPosts();
  }, [page, activeTab]);

  const handleToggleLike = async (post: CommunityPost) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === post.id) {
          const nextLiked = !p.isLiked;
          const nextCount = nextLiked ? p.likeCount + 1 : Math.max(0, p.likeCount - 1);
          return { ...p, isLiked: nextLiked, likeCount: nextCount };
        }
        return p;
      })
    );

    try {
      const res = await communityService.toggleLike(post.id);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, isLiked: res.isLiked, likeCount: res.likeCount } : p))
      );
    } catch (err) {
      if (__DEV__) console.warn('[Community] Like error:', err);
    }
  };

  const handleCreatePostSubmit = async () => {
    if (!newPostText.trim()) {
      Alert.alert('Required', 'Please write a message to share.');
      return;
    }

    setPublishing(true);
    try {
      await communityService.createPost({
        postText: newPostText.trim(),
        postType: newPostType,
      });
      setNewPostText('');
      setIsCreateModalVisible(false);
      fetchPosts();
    } catch (err) {
      Alert.alert('Error', 'Failed to publish post. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const handleOpenEditPost = (post: CommunityPost) => {
    setEditingPost(post);
    setEditPostText(post.postText);
  };

  const handleUpdatePostSubmit = async () => {
    if (!editingPost || !editPostText.trim()) return;

    setUpdating(true);
    try {
      await communityService.updatePost(editingPost.id, { postText: editPostText.trim() });
      setEditingPost(null);
      fetchPosts();
    } catch (err) {
      Alert.alert('Error', 'Failed to update post.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await communityService.deletePost(postId);
            fetchPosts();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete post.');
          }
        },
      },
    ]);
  };

  const handleOpenComments = async (post: CommunityPost) => {
    setSelectedPost(post);
    setLoadingComments(true);
    try {
      const res = await communityService.getComments(post.id);
      setComments(res);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedPost || !newCommentText.trim()) return;

    setSubmittingComment(true);
    try {
      const comment = await communityService.addComment(selectedPost.id, newCommentText.trim());
      setComments((prev) => [...prev, comment]);
      setNewCommentText('');
      setPosts((prev) =>
        prev.map((p) => (p.id === selectedPost.id ? { ...p, commentCount: p.commentCount + 1 } : p))
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to add reply.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const getTagColor = (type?: string): { bg: string; text: string; label: string } => {
    switch (type) {
      case 'OPPORTUNITY':
        return { bg: '#DCFCE7', text: Theme.colors.forestGreen, label: 'OPPORTUNITY' };
      case 'BUSINESS':
        return { bg: '#FEF3C7', text: '#B45309', label: 'LOCAL BUSINESS' };
      case 'SERVICE':
        return { bg: '#CCFBF1', text: '#0F766E', label: 'SERVICE' };
      case 'JOB':
        return { bg: '#DBEAFE', text: '#1D4ED8', label: 'JOB OPENING' };
      default:
        return { bg: Theme.colors.aiAccent, text: '#6D28D9', label: 'COMMUNITY' };
    }
  };

  const getActionLabel = (type?: string): string => {
    switch (type) {
      case 'OPPORTUNITY':
        return 'Explore';
      case 'SERVICE':
        return 'Book';
      case 'JOB':
        return 'Apply';
      case 'BUSINESS':
        return 'View';
      default:
        return 'Connect';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Top Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerTitleRow}>
          <View>
            <Text style={styles.screenTitle}>Community</Text>
            <Text style={styles.screenSubtitle}>
              Local updates, discussions & announcements
            </Text>
          </View>

          <TouchableOpacity
            style={styles.headerCreateBtn}
            onPress={() => setIsCreateModalVisible(true)}
            activeOpacity={0.85}
            accessibilityLabel="Create Post"
          >
            <Plus size={16} color="#FFFFFF" strokeWidth={2.5} />
            <Text style={styles.headerCreateText}>Post</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Tabs Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}
        >
          <Chip label="For You" selected={activeTab === 'all'} onPress={() => setActiveTab('all')} />
          <Chip label="Following" selected={activeTab === 'following'} onPress={() => setActiveTab('following')} />
          <Chip label="Local" selected={activeTab === 'local'} onPress={() => setActiveTab('local')} />
          <Chip label="Trending" selected={activeTab === 'trending'} onPress={() => setActiveTab('trending')} />
          <Chip label="Opportunities" selected={activeTab === 'opportunity'} onPress={() => setActiveTab('opportunity')} />
          <Chip label="Businesses" selected={activeTab === 'business'} onPress={() => setActiveTab('business')} />
        </ScrollView>
      </View>

      {/* Feed List */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Theme.colors.emerald} />
            <Text style={styles.loadingText}>Loading community feed...</Text>
          </View>
        ) : posts.length === 0 ? (
          <EmptyState
            title="No community updates yet"
            description="Be the first to share an opportunity, ask a question, or connect with your neighbourhood!"
            actionTitle="Create Post"
            onAction={() => setIsCreateModalVisible(true)}
          />
        ) : (
          posts.map((post) => {
            const tag = getTagColor(post.postType);
            const actionName = getActionLabel(post.postType);

            return (
              <Card key={post.id} variant="solid" style={styles.postCard}>
                {/* Post Header */}
                <View style={styles.postHeader}>
                  <View style={styles.authorRow}>
                    <ProfileImage
                      name={post.authorName}
                      userId={post.userId}
                      size={42}
                      borderRadius={21}
                    />
                    <View style={styles.authorMeta}>
                      <Text style={styles.authorName}>{post.authorName}</Text>
                      <Text style={styles.timeText}>
                        {post.businessName ? `${post.businessName} • ` : ''}
                        {new Date(post.createdAt).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.headerRight}>
                    <View style={[styles.typeBadge, { backgroundColor: tag.bg }]}>
                      <Text style={[styles.typeText, { color: tag.text }]}>{tag.label}</Text>
                    </View>

                    {post.isOwnPost && (
                      <View style={styles.ownerActions}>
                        <TouchableOpacity
                          onPress={() => handleOpenEditPost(post)}
                          style={styles.actionIcon}
                        >
                          <Edit3 size={15} color={Theme.colors.secondaryText} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeletePost(post.id)}
                          style={styles.actionIcon}
                        >
                          <Trash2 size={15} color="#DC2626" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>

                {/* Post Body */}
                <Text style={styles.postBody}>{post.postText}</Text>

                {/* Media Support */}
                <CommunityImage uri={post.imageUrl} postType={post.postType} height={160} />

                {/* Contextual Action Strip */}
                <View style={styles.actionStrip}>
                  <TouchableOpacity
                    style={styles.contextualActionBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      Alert.alert(
                        actionName,
                        `Initiated "${actionName}" for this ${tag.label.toLowerCase()}.`
                      );
                    }}
                  >
                    <Text style={styles.contextualActionText}>{actionName}</Text>
                    <ArrowRight size={13} color={Theme.colors.forestGreen} />
                  </TouchableOpacity>

                  <View style={styles.socialButtons}>
                    <TouchableOpacity
                      style={styles.socialBtn}
                      onPress={() => handleToggleLike(post)}
                      activeOpacity={0.7}
                    >
                      <Heart
                        size={17}
                        color={post.isLiked ? '#DC2626' : Theme.colors.secondaryText}
                        fill={post.isLiked ? '#DC2626' : 'transparent'}
                      />
                      <Text style={[styles.socialCount, post.isLiked && { color: '#DC2626' }]}>
                        {post.likeCount}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.socialBtn}
                      onPress={() => handleOpenComments(post)}
                      activeOpacity={0.7}
                    >
                      <MessageSquare size={17} color={Theme.colors.secondaryText} />
                      <Text style={styles.socialCount}>{post.commentCount}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.socialBtn}
                      activeOpacity={0.7}
                      onPress={() => Alert.alert('Share', 'Link copied to clipboard!')}
                    >
                      <Share2 size={17} color={Theme.colors.secondaryText} />
                    </TouchableOpacity>
                  </View>
                </View>
              </Card>
            );
          })
        )}

        {/* Bottom spacing for navigation dock */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Create Post Button */}
      <TouchableOpacity
        style={styles.floatingBtn}
        onPress={() => setIsCreateModalVisible(true)}
        activeOpacity={0.88}
        accessibilityLabel="Create new community post"
      >
        <Plus size={24} color="#FFFFFF" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Create Post Modal */}
      <Modal visible={isCreateModalVisible} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <Card variant="solid" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share with Community</Text>
              <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
                <X size={20} color={Theme.colors.primaryText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.typeRow}>
              {['OPPORTUNITY', 'BUSINESS', 'SERVICE', 'JOB', 'GENERAL'].map((t) => (
                <Chip
                  key={t}
                  label={t}
                  selected={newPostType === t}
                  onPress={() => setNewPostType(t)}
                />
              ))}
            </View>

            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={styles.textArea}
              placeholder="What opportunity, service or update are you sharing with your local community?"
              placeholderTextColor={Theme.colors.secondaryText}
              multiline
              numberOfLines={4}
              value={newPostText}
              onChangeText={setNewPostText}
            />

            <Button
              title="Publish Update"
              onPress={handleCreatePostSubmit}
              loading={publishing}
              variant="primary"
              style={{ marginTop: 14 }}
            />
          </Card>
        </View>
      </Modal>

      {/* Edit Post Modal */}
      <Modal visible={Boolean(editingPost)} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <Card variant="solid" style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Update</Text>
              <TouchableOpacity onPress={() => setEditingPost(null)}>
                <X size={20} color={Theme.colors.primaryText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Message</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Update your message..."
              placeholderTextColor={Theme.colors.secondaryText}
              multiline
              numberOfLines={4}
              value={editPostText}
              onChangeText={setEditPostText}
            />

            <Button
              title="Save Changes"
              onPress={handleUpdatePostSubmit}
              loading={updating}
              variant="primary"
              style={{ marginTop: 14 }}
            />
          </Card>
        </View>
      </Modal>

      {/* Comments Modal */}
      <Modal visible={Boolean(selectedPost)} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <Card variant="solid" style={[styles.modalCard, { height: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Replies</Text>
              <TouchableOpacity onPress={() => setSelectedPost(null)}>
                <X size={20} color={Theme.colors.primaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {loadingComments ? (
                <ActivityIndicator size="small" color={Theme.colors.emerald} style={{ marginTop: 20 }} />
              ) : comments.length === 0 ? (
                <Text style={styles.noCommentsText}>No replies yet. Be the first to join the conversation!</Text>
              ) : (
                comments.map((c) => (
                  <View key={c.id} style={styles.commentItem}>
                    <Text style={styles.commentAuthor}>{c.authorName}</Text>
                    <Text style={styles.commentText}>{c.commentText}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Write a reply..."
                placeholderTextColor={Theme.colors.secondaryText}
                value={newCommentText}
                onChangeText={setNewCommentText}
              />
              <Button
                title="Send"
                onPress={handleAddComment}
                loading={submittingComment}
                variant="primary"
                size="sm"
              />
            </View>
          </Card>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAF7', // Main background
  },
  topHeader: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border, // #E4EBE3
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 36 : 10,
    paddingBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Theme.colors.primaryText, // #17231B
    fontFamily: Theme.typography.headingFont,
  },
  screenSubtitle: {
    fontSize: 12,
    color: Theme.colors.secondaryText, // #68756B
    fontFamily: Theme.typography.bodyFont,
    marginTop: 2,
  },
  headerCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.emerald, // #16A34A
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 4,
  },
  headerCreateText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.bodyFont,
  },
  tabsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    marginTop: 10,
    fontFamily: Theme.typography.bodyFont,
  },
  postCard: {
    padding: 16,
    marginBottom: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.border, // #E4EBE3
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorMeta: {
    marginLeft: 10,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.headingFont,
  },
  timeText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.bodyFont,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ownerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  actionIcon: {
    padding: 2,
  },
  postBody: {
    fontSize: 14,
    color: Theme.colors.primaryText,
    lineHeight: 20,
    marginBottom: 8,
    fontFamily: Theme.typography.bodyFont,
  },
  actionStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  contextualActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  contextualActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.forestGreen,
  },
  socialButtons: {
    flexDirection: 'row',
    gap: 14,
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    minHeight: 32,
  },
  socialCount: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontWeight: '600',
  },
  floatingBtn: {
    position: 'absolute',
    bottom: 88,
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Theme.colors.emerald, // #16A34A
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.emerald,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 35, 27, 0.45)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    padding: 20,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderColor: Theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.headingFont,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
    marginBottom: 6,
    marginTop: 10,
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  textArea: {
    backgroundColor: '#F8FAF7',
    borderRadius: 12,
    padding: 12,
    color: Theme.colors.primaryText,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    textAlignVertical: 'top',
    height: 100,
    fontFamily: Theme.typography.bodyFont,
  },
  noCommentsText: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: 20,
  },
  commentItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.emerald,
  },
  commentText: {
    fontSize: 13,
    color: Theme.colors.primaryText,
    marginTop: 2,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#F8FAF7',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    color: Theme.colors.primaryText,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
});

export default CommunityScreen;
