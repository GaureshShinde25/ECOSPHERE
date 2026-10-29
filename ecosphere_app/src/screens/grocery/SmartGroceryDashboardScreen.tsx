import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Sparkles,
  ShoppingBag,
  TrendingDown,
  Wallet,
  CheckCircle2,
  Plus,
  ArrowRight,
  Store,
  ChevronRight,
  Clock,
  Layers,
  Tag,
  Search,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import {
  groceryService,
  GroceryShoppingList,
  GroceryBudget,
  GroceryRecommendation,
} from '../../services/groceryService';

interface SmartGroceryDashboardScreenProps {
  onBack?: () => void;
  onNavigate: (screen: string, params?: any) => void;
}

export const SmartGroceryDashboardScreen: React.FC<SmartGroceryDashboardScreenProps> = ({
  onBack,
  onNavigate,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [lists, setLists] = useState<GroceryShoppingList[]>([]);
  const [budget, setBudget] = useState<GroceryBudget | null>(null);
  const [popularRecs, setPopularRecs] = useState<GroceryRecommendation[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      const [fetchedLists, fetchedBudget, recs] = await Promise.all([
        groceryService.getShoppingLists(),
        groceryService.getBudget(),
        groceryService.getPopularRecommendations(6),
      ]);
      setLists(fetchedLists || []);
      setBudget(fetchedBudget || null);
      setPopularRecs(recs || []);
    } catch (err) {
      if (__DEV__) console.warn('[SmartGroceryDashboardScreen] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboard();
  };

  // Metrics calculation from user's active list
  const activeList = lists.find((l) => l.status === 'draft' || l.status === 'planned') || lists[0];
  const itemsCount = activeList?.items?.length || 0;
  const estimatedTotal = activeList?.estimatedCost || 0;
  const potentialSavings = activeList?.estimatedSavings || (estimatedTotal > 0 ? Math.round(estimatedTotal * 0.12) : 0);
  const monthlyBudget = budget?.monthlyBudget || 3000;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.emerald} />
        <Text style={styles.loadingText}>Loading Smart Grocery...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
              <ArrowLeft size={22} color={Theme.colors.primaryText} />
            </TouchableOpacity>
          )}
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.headerTitle}>Smart Grocery</Text>
              <View style={styles.aiTag}>
                <Sparkles size={11} color={Theme.colors.forestGreen} />
                <Text style={styles.aiTagText}>OPTIMIZER</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>Plan smarter. Shop better. Save more.</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addListHeaderBtn}
          onPress={() => onNavigate('SmartGroceryList')}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addListHeaderText}>New List</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.emerald]} />
        }
      >
        {/* 4 Summary Cards (Section 6 Specification) */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Grocery Budget */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => onNavigate('SmartGroceryBudget')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiIconRow}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#EAF7EE' }]}>
                <Wallet size={18} color="#16A34A" />
              </View>
              <Text style={styles.kpiLinkText}>Manage</Text>
            </View>
            <Text style={styles.kpiValue}>₹{monthlyBudget.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>Grocery Budget</Text>
          </TouchableOpacity>

          {/* Card 2: Estimated Total */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => onNavigate('SmartGroceryList', { list: activeList })}
            activeOpacity={0.8}
          >
            <View style={styles.kpiIconRow}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#EFF6FF' }]}>
                <ShoppingBag size={18} color="#2563EB" />
              </View>
              <Text style={styles.kpiStatusText}>{activeList ? 'Active' : 'Empty'}</Text>
            </View>
            <Text style={styles.kpiValue}>₹{estimatedTotal.toLocaleString()}</Text>
            <Text style={styles.kpiLabel}>Estimated Total</Text>
          </TouchableOpacity>

          {/* Card 3: Potential Savings */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => onNavigate('SmartGroceryOptimizer')}
            activeOpacity={0.8}
          >
            <View style={styles.kpiIconRow}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#DCFCE7' }]}>
                <TrendingDown size={18} color="#15803D" />
              </View>
              <View style={styles.savingsPill}>
                <Text style={styles.savingsPillText}>~12%</Text>
              </View>
            </View>
            <Text style={[styles.kpiValue, { color: Theme.colors.forestGreen }]}>
              ₹{potentialSavings.toLocaleString()}
            </Text>
            <Text style={styles.kpiLabel}>Potential Savings</Text>
          </TouchableOpacity>

          {/* Card 4: Items on List */}
          <TouchableOpacity
            style={styles.kpiCard}
            onPress={() => onNavigate('SmartGroceryList', { list: activeList })}
            activeOpacity={0.8}
          >
            <View style={styles.kpiIconRow}>
              <View style={[styles.kpiIconBox, { backgroundColor: '#FEF9C3' }]}>
                <Layers size={18} color="#D97706" />
              </View>
              <Text style={styles.kpiSubCount}>items</Text>
            </View>
            <Text style={styles.kpiValue}>{itemsCount}</Text>
            <Text style={styles.kpiLabel}>Items on List</Text>
          </TouchableOpacity>
        </View>

        {/* 4 Quick Actions (Section 6 Specification) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
        </View>

        <View style={styles.quickActionGrid}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => onNavigate('SmartGroceryList')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#EAF7EE' }]}>
              <Plus size={20} color={Theme.colors.forestGreen} />
            </View>
            <Text style={styles.quickActionTitle}>Create List</Text>
            <Text style={styles.quickActionSub}>Build custom basket</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => onNavigate('SmartGroceryOptimizer')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#EFF6FF' }]}>
              <Sparkles size={20} color="#2563EB" />
            </View>
            <Text style={styles.quickActionTitle}>Optimize List</Text>
            <Text style={styles.quickActionSub}>Multi-store savings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => onNavigate('SmartGroceryCompare')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FEF3C7' }]}>
              <Store size={20} color="#D97706" />
            </View>
            <Text style={styles.quickActionTitle}>Compare Prices</Text>
            <Text style={styles.quickActionSub}>D-Mart vs Reliance</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => onNavigate('SmartGroceryHistory')}
            activeOpacity={0.7}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FDF2F8' }]}>
              <Clock size={20} color="#DB2777" />
            </View>
            <Text style={styles.quickActionTitle}>History</Text>
            <Text style={styles.quickActionSub}>Past trips & reuse</Text>
          </TouchableOpacity>
        </View>

        {/* Prominent Promotional Card (Section 6 Specification) */}
        <View style={styles.promoCard}>
          <View style={styles.promoBadge}>
            <Sparkles size={13} color="#064E3B" />
            <Text style={styles.promoBadgeText}>AI PRICE OPTIMIZER</Text>
          </View>
          <Text style={styles.promoTitle}>Compare 3 Major Supermarkets</Text>
          <Text style={styles.promoDesc}>
            Our engine checks real-time prices across D-Mart, Reliance Fresh, and Big Bazaar, finds the cheapest store for every item, and calculates your geodesic travel distance.
          </Text>
          <TouchableOpacity
            style={styles.promoCtaBtn}
            onPress={() => onNavigate('SmartGroceryOptimizer')}
            activeOpacity={0.85}
          >
            <Text style={styles.promoCtaText}>Run Cost Optimizer</Text>
            <ArrowRight size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Active Shopping Lists Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>My Shopping Lists</Text>
          <TouchableOpacity onPress={() => onNavigate('SmartGroceryList')} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>+ New List</Text>
          </TouchableOpacity>
        </View>

        {lists.length === 0 ? (
          <View style={styles.emptyListCard}>
            <ShoppingBag size={34} color={Theme.colors.emerald} />
            <Text style={styles.emptyListTitle}>No shopping lists created yet</Text>
            <Text style={styles.emptyListSub}>
              Start building your grocery list to calculate exact costs and unlock multi-store savings.
            </Text>
            <TouchableOpacity
              style={styles.createFirstListBtn}
              onPress={() => onNavigate('SmartGroceryList')}
              activeOpacity={0.85}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.createFirstListText}>Create Your First List</Text>
            </TouchableOpacity>
          </View>
        ) : (
          lists.slice(0, 3).map((list) => (
            <TouchableOpacity
              key={list.id}
              style={styles.listCard}
              onPress={() => onNavigate('SmartGroceryList', { listId: list.id, list })}
              activeOpacity={0.75}
            >
              <View style={styles.listCardLeft}>
                <View style={styles.listIconBox}>
                  <ShoppingBag size={18} color={Theme.colors.forestGreen} />
                </View>
                <View>
                  <Text style={styles.listCardTitle}>{list.name}</Text>
                  <Text style={styles.listCardMeta}>
                    {list.items.length} items • {new Date(list.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              </View>

              <View style={styles.listCardRight}>
                <Text style={styles.listCardTotal}>₹{list.estimatedCost.toLocaleString()}</Text>
                <View style={styles.statusPill}>
                  <Text style={styles.statusPillText}>{list.status.toUpperCase()}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}

        {/* AI Recommendations Preview */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Popular Staples</Text>
          <TouchableOpacity onPress={() => onNavigate('SmartGroceryRecommendations')} activeOpacity={0.7}>
            <Text style={styles.seeAllText}>View All AI Picks →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recScroll}>
          {popularRecs.map((rec, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.recItemCard}
              onPress={() => onNavigate('SmartGroceryCompare', { selectedItem: rec.item_name })}
              activeOpacity={0.8}
            >
              {rec.imageUrl ? (
                <Image source={{ uri: rec.imageUrl }} style={styles.recImage} resizeMode="cover" />
              ) : (
                <View style={styles.recPlaceholder}>
                  <Tag size={20} color={Theme.colors.emerald} />
                </View>
              )}
              <View style={styles.recBody}>
                <Text style={styles.recTitle} numberOfLines={1}>
                  {rec.item_name}
                </Text>
                <Text style={styles.recUnit}>{rec.unit}</Text>
                <View style={styles.recPriceRow}>
                  <Text style={styles.recPrice}>₹{rec.typical_price}</Text>
                  <Text style={styles.recStoreTag}>Cheapest: D-Mart</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAF7',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Theme.colors.secondaryText,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 14,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBE3',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    padding: 6,
    marginRight: 6,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C7F36B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  aiTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  addListHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.emerald,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addListHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 14,
    shadowColor: '#17231B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  kpiIconRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiLinkText: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.emerald,
  },
  kpiStatusText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
  },
  kpiSubCount: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
  },
  savingsPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  savingsPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  kpiLabel: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.emerald,
  },
  quickActionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 18,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 14,
  },
  quickActionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.primaryText,
  },
  quickActionSub: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  promoCard: {
    backgroundColor: '#064E3B',
    borderRadius: 20,
    padding: 18,
    marginBottom: 18,
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C7F36B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 10,
  },
  promoBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#064E3B',
    letterSpacing: 0.5,
  },
  promoTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  promoDesc: {
    fontSize: 12,
    color: '#E4EBE3',
    lineHeight: 18,
    marginBottom: 14,
  },
  promoCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.emerald,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 6,
  },
  promoCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  emptyListTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    marginTop: 8,
  },
  emptyListSub: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 14,
  },
  createFirstListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.emerald,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    gap: 4,
  },
  createFirstListText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 14,
    marginBottom: 10,
  },
  listCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EAF7EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primaryText,
  },
  listCardMeta: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  listCardRight: {
    alignItems: 'flex-end',
  },
  listCardTotal: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
  },
  statusPill: {
    backgroundColor: '#F1F5F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.colors.secondaryText,
  },
  recScroll: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  recItemCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    overflow: 'hidden',
    marginRight: 10,
  },
  recImage: {
    width: '100%',
    height: 90,
  },
  recPlaceholder: {
    width: '100%',
    height: 90,
    backgroundColor: '#F1F5F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recBody: {
    padding: 10,
  },
  recTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primaryText,
  },
  recUnit: {
    fontSize: 10,
    color: Theme.colors.secondaryText,
    marginTop: 1,
  },
  recPriceRow: {
    marginTop: 6,
  },
  recPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
  },
  recStoreTag: {
    fontSize: 9,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 2,
  },
});

