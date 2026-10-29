import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  TrendingDown,
  Plus,
  CheckCircle2,
  Tag,
  Layers,
  ArrowRight,
  Filter,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import {
  groceryService,
  GroceryRecommendation,
  GroceryProduct,
} from '../../services/groceryService';

interface SmartGroceryRecommendationsScreenProps {
  onBack: () => void;
  onNavigate: (screen: string, params?: any) => void;
}

export const SmartGroceryRecommendationsScreen: React.FC<SmartGroceryRecommendationsScreenProps> = ({
  onBack,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'popular' | 'similar' | 'cheaper'>('popular');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState<boolean>(true);
  const [popularRecs, setPopularRecs] = useState<GroceryRecommendation[]>([]);
  const [similarRecs, setSimilarRecs] = useState<GroceryRecommendation[]>([]);
  const [cheaperAlternatives, setCheaperAlternatives] = useState<any[]>([]);
  const [selectedReferenceItem, setSelectedReferenceItem] = useState<string>('Butter');
  const [catalog, setCatalog] = useState<GroceryProduct[]>([]);
  const [addedItems, setAddedItems] = useState<{ [key: string]: boolean }>({});

  const categories = ['All', 'Dairy', 'Produce', 'Bakery', 'Pantry', 'Beverages'];
  const referenceOptions = ['Butter', 'Chicken', 'Cooking Oil', 'Coffee', 'Cheese', 'Bread'];

  const loadData = async () => {
    try {
      setLoading(true);
      const [pop, cat, sim] = await Promise.all([
        groceryService.getPopularRecommendations(12),
        groceryService.getCatalog(),
        groceryService.getSimilarRecommendations(selectedReferenceItem, 6),
      ]);
      setPopularRecs(pop || []);
      setCatalog(cat || []);
      if (sim) {
        setSimilarRecs(sim.content_based_recommendations || []);
        setCheaperAlternatives(sim.cheaper_alternatives || []);
      }
    } catch (err) {
      if (__DEV__) console.warn('[SmartGroceryRecommendationsScreen] Error loading recs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReferenceChange = async (itemName: string) => {
    setSelectedReferenceItem(itemName);
    try {
      setLoading(true);
      const sim = await groceryService.getSimilarRecommendations(itemName, 6);
      if (sim) {
        setSimilarRecs(sim.content_based_recommendations || []);
        setCheaperAlternatives(sim.cheaper_alternatives || []);
      }
    } catch (err) {
      if (__DEV__) console.warn('[SmartGroceryRecommendationsScreen] Ref change error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToList = (itemName: string, price: number) => {
    setAddedItems((prev) => ({ ...prev, [itemName]: true }));
    Alert.alert(
      'Added to List',
      `${itemName} (₹${price}) has been added to your shopping list.`,
      [
        { text: 'Keep Browsing' },
        { text: 'View List', onPress: () => onNavigate('SmartGroceryList') },
      ]
    );
  };

  const filteredPopular = popularRecs.filter(
    (item) =>
      selectedCategory === 'All' ||
      item.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Theme.colors.primaryText} />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>AI Recommendations</Text>
            <View style={styles.aiTag}>
              <Sparkles size={11} color={Theme.colors.forestGreen} />
              <Text style={styles.aiTagText}>RECOMMENDER</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Personalized staples & smart budget swaps</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'popular' && styles.tabBtnActive]}
            onPress={() => setActiveTab('popular')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'popular' && styles.tabTextActive]}>
              Frequent Staples
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'similar' && styles.tabBtnActive]}
            onPress={() => setActiveTab('similar')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'similar' && styles.tabTextActive]}>
              Similar Products
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'cheaper' && styles.tabBtnActive]}
            onPress={() => setActiveTab('cheaper')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, activeTab === 'cheaper' && styles.tabTextActive]}>
              Cheaper Swaps
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Frequent Staples */}
        {activeTab === 'popular' && (
          <>
            {/* Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      selectedCategory === cat && styles.catChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Theme.colors.emerald} />
                <Text style={styles.loadingText}>Fetching recommended staples...</Text>
              </View>
            ) : (
              <View style={styles.itemsGrid}>
                {filteredPopular.map((rec, idx) => {
                  const isAdded = addedItems[rec.item_name];
                  return (
                    <View key={`${rec.item_name}_${idx}`} style={styles.recCard}>
                      <View style={styles.recBadgeRow}>
                        <View style={styles.reasonBadge}>
                          <Sparkles size={10} color={Theme.colors.forestGreen} />
                          <Text style={styles.reasonBadgeText} numberOfLines={1}>
                            {rec.reason}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.recItemName}>{rec.item_name}</Text>
                      <Text style={styles.recCategory}>
                        {rec.category} • {rec.unit}
                      </Text>

                      <View style={styles.recBottomRow}>
                        <View>
                          <Text style={styles.priceLabel}>Typical Price</Text>
                          <Text style={styles.priceValue}>₹{rec.typical_price}</Text>
                        </View>

                        <TouchableOpacity
                          style={[styles.addCardBtn, isAdded && styles.addCardBtnAdded]}
                          onPress={() => handleAddToList(rec.item_name, rec.typical_price)}
                          activeOpacity={0.8}
                        >
                          {isAdded ? (
                            <CheckCircle2 size={16} color="#FFFFFF" />
                          ) : (
                            <Plus size={16} color="#FFFFFF" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}

        {/* Tab 2: Similar Products (Content-Based) */}
        {activeTab === 'similar' && (
          <>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Select product to find similar items for:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.refScroll}>
                {referenceOptions.map((ref) => (
                  <TouchableOpacity
                    key={ref}
                    style={[
                      styles.refChip,
                      selectedReferenceItem.toLowerCase() === ref.toLowerCase() && styles.refChipActive,
                    ]}
                    onPress={() => handleReferenceChange(ref)}
                  >
                    <Text
                      style={[
                        styles.refChipText,
                        selectedReferenceItem.toLowerCase() === ref.toLowerCase() && styles.refChipTextActive,
                      ]}
                    >
                      {ref}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Theme.colors.emerald} />
                <Text style={styles.loadingText}>Calculating content similarity...</Text>
              </View>
            ) : (
              <View style={styles.itemsGrid}>
                {similarRecs.length === 0 ? (
                  <Text style={styles.emptyText}>No similar items found for {selectedReferenceItem}.</Text>
                ) : (
                  similarRecs.map((rec, idx) => {
                    const isAdded = addedItems[rec.item_name];
                    return (
                      <View key={`${rec.item_name}_${idx}`} style={styles.recCard}>
                        <View style={styles.recBadgeRow}>
                          <View style={styles.reasonBadge}>
                            <Layers size={10} color={Theme.colors.forestGreen} />
                            <Text style={styles.reasonBadgeText}>
                              Similarity: {rec.score ? Math.round(rec.score * 100) : 95}%
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.recItemName}>{rec.item_name}</Text>
                        <Text style={styles.recCategory}>{rec.category} • {rec.unit}</Text>

                        <View style={styles.recBottomRow}>
                          <View>
                            <Text style={styles.priceLabel}>Price</Text>
                            <Text style={styles.priceValue}>₹{rec.typical_price}</Text>
                          </View>

                          <TouchableOpacity
                            style={[styles.addCardBtn, isAdded && styles.addCardBtnAdded]}
                            onPress={() => handleAddToList(rec.item_name, rec.typical_price)}
                            activeOpacity={0.8}
                          >
                            {isAdded ? (
                              <CheckCircle2 size={16} color="#FFFFFF" />
                            ) : (
                              <Plus size={16} color="#FFFFFF" />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}
          </>
        )}

        {/* Tab 3: Cheaper Alternatives (Cost Optimization) */}
        {activeTab === 'cheaper' && (
          <>
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Compare cheaper alternatives for:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.refScroll}>
                {referenceOptions.map((ref) => (
                  <TouchableOpacity
                    key={ref}
                    style={[
                      styles.refChip,
                      selectedReferenceItem.toLowerCase() === ref.toLowerCase() && styles.refChipActive,
                    ]}
                    onPress={() => handleReferenceChange(ref)}
                  >
                    <Text
                      style={[
                        styles.refChipText,
                        selectedReferenceItem.toLowerCase() === ref.toLowerCase() && styles.refChipTextActive,
                      ]}
                    >
                      {ref}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {loading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color={Theme.colors.emerald} />
                <Text style={styles.loadingText}>Finding lower cost alternatives...</Text>
              </View>
            ) : cheaperAlternatives.length === 0 ? (
              <View style={styles.emptyCard}>
                <TrendingDown size={32} color={Theme.colors.emerald} />
                <Text style={styles.emptyTitle}>Already the Most Economical</Text>
                <Text style={styles.emptySub}>
                  {selectedReferenceItem} is already one of the lowest-priced options in its category.
                </Text>
              </View>
            ) : (
              <View style={styles.alternativesList}>
                {cheaperAlternatives.map((alt, idx) => (
                  <View key={idx} style={styles.alternativeCard}>
                    <View style={styles.altTopRow}>
                      <View style={styles.altLeft}>
                        <Text style={styles.altOriginalText}>Instead of {alt.original_item}</Text>
                        <Text style={styles.altItemName}>{alt.alternative_item}</Text>
                        <Text style={styles.altReason}>{alt.reason}</Text>
                      </View>
                      <View style={styles.altSavingsBadge}>
                        <TrendingDown size={14} color={Theme.colors.forestGreen} />
                        <Text style={styles.altSavingsText}>Save ₹{alt.savings}</Text>
                      </View>
                    </View>

                    <View style={styles.altActionRow}>
                      <TouchableOpacity
                        style={styles.altSwapBtn}
                        onPress={() => handleAddToList(alt.alternative_item, 50)}
                        activeOpacity={0.8}
                      >
                        <Plus size={15} color="#FFFFFF" />
                        <Text style={styles.altSwapBtnText}>Add Alternative to List</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  aiTagText: {
    fontSize: 10,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: '#DCFCE7',
  },
  tabText: {
    fontSize: 13,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.secondaryText,
  },
  tabTextActive: {
    color: Theme.colors.forestGreen,
    fontFamily: Theme.fonts.heading,
  },
  categoryScroll: {
    paddingBottom: 14,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  catChipActive: {
    backgroundColor: Theme.colors.emerald,
    borderColor: Theme.colors.emerald,
  },
  catChipText: {
    fontSize: 12,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.secondaryText,
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  recCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'space-between',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 5,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  recBadgeRow: {
    marginBottom: 8,
  },
  reasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    alignSelf: 'flex-start',
  },
  reasonBadgeText: {
    fontSize: 10,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
  },
  recItemName: {
    fontSize: 15,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  recCategory: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    marginBottom: 12,
  },
  recBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceLabel: {
    fontSize: 10,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
  },
  priceValue: {
    fontSize: 16,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
  },
  addCardBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Theme.colors.emerald,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCardBtnAdded: {
    backgroundColor: Theme.colors.forestGreen,
  },
  filterSection: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.secondaryText,
    marginBottom: 8,
  },
  refScroll: {
    gap: 8,
  },
  refChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginRight: 8,
  },
  refChipActive: {
    backgroundColor: '#DCFCE7',
    borderColor: Theme.colors.emerald,
  },
  refChipText: {
    fontSize: 13,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.primaryText,
  },
  refChipTextActive: {
    color: Theme.colors.forestGreen,
    fontFamily: Theme.fonts.heading,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: 30,
    width: '100%',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginTop: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
  },
  alternativesList: {
    gap: 12,
  },
  alternativeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  altTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  altLeft: {
    flex: 1,
  },
  altOriginalText: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: '#94A3B8',
  },
  altItemName: {
    fontSize: 16,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
    marginTop: 2,
  },
  altReason: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    marginTop: 4,
  },
  altSavingsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  altSavingsText: {
    fontSize: 12,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
  },
  altActionRow: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  altSwapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.emerald,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  altSwapBtnText: {
    fontSize: 13,
    fontFamily: Theme.fonts.heading,
    color: '#FFFFFF',
  },
});

