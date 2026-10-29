import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Sparkles,
  TrendingDown,
  Navigation,
  Store,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Layers,
  MapPin,
  ChevronRight,
  FileText,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import {
  groceryService,
  OptimizationResult,
  StoreGroup,
} from '../../services/groceryService';

interface SmartGroceryOptimizerScreenProps {
  initialItems?: string[];
  onBack: () => void;
  onNavigate: (screen: string, params?: any) => void;
}

export const SmartGroceryOptimizerScreen: React.FC<SmartGroceryOptimizerScreenProps> = ({
  initialItems,
  onBack,
  onNavigate,
}) => {
  const [items, setItems] = useState<string[]>(
    initialItems && initialItems.length > 0
      ? initialItems
      : ['Milk', 'Bread', 'Eggs', 'Rice', 'Tomato', 'Butter']
  );
  const [newItemText, setNewItemText] = useState<string>('');
  const [latitude, setLatitude] = useState<number>(19.12);
  const [longitude, setLongitude] = useState<number>(72.88);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);

  const runOptimization = async (itemsToOptimize: string[] = items) => {
    if (itemsToOptimize.length === 0) {
      Alert.alert('Empty List', 'Please add at least one grocery item to optimize.');
      return;
    }

    try {
      setLoading(true);
      const res = await groceryService.optimizeList(itemsToOptimize, latitude, longitude);
      if (res && res.success) {
        setResult(res);
      } else {
        Alert.alert('Optimization Failed', 'Unable to calculate store prices. Please try again.');
      }
    } catch (err) {
      if (__DEV__) console.warn('[SmartGroceryOptimizerScreen] Optimization error:', err);
      Alert.alert('Error', 'An error occurred during cost optimization.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runOptimization();
  }, []);

  const handleAddItem = () => {
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    if (items.some((it) => it.toLowerCase() === trimmed.toLowerCase())) {
      Alert.alert('Duplicate Item', `${trimmed} is already in the list.`);
      return;
    }
    const updated = [...items, trimmed];
    setItems(updated);
    setNewItemText('');
    runOptimization(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = items.filter((_, idx) => idx !== index);
    setItems(updated);
    if (updated.length > 0) {
      runOptimization(updated);
    } else {
      setResult(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Theme.colors.primaryText} />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Cost Optimizer</Text>
            <View style={styles.aiTag}>
              <Sparkles size={11} color={Theme.colors.forestGreen} />
              <Text style={styles.aiTagText}>GREEDY AI</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Lowest multi-store grocery prices</Text>
        </View>

        <TouchableOpacity
          style={styles.refreshHeaderBtn}
          onPress={() => runOptimization()}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Theme.colors.emerald} />
          ) : (
            <RefreshCw size={18} color={Theme.colors.emerald} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* User Location Bar */}
        <View style={styles.locationBar}>
          <MapPin size={16} color={Theme.colors.forestGreen} />
          <Text style={styles.locationText}>
            User Coordinates: {latitude.toFixed(4)}° N, {longitude.toFixed(4)}° E (Andheri East)
          </Text>
        </View>

        {/* Input Items Box */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Shopping Items to Optimize</Text>
          <Text style={styles.cardSub}>
            Algorithms compare prices across D-Mart, Reliance Fresh, and Big Bazaar.
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="Add product (e.g. Milk, Apples, Butter)..."
              placeholderTextColor="#94A3B8"
              value={newItemText}
              onChangeText={setNewItemText}
              onSubmitEditing={handleAddItem}
              returnKeyType="done"
            />
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleAddItem}
              activeOpacity={0.8}
            >
              <Plus size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Item Chips */}
          <View style={styles.chipsContainer}>
            {items.map((it, idx) => (
              <View key={`${it}_${idx}`} style={styles.itemChip}>
                <Text style={styles.itemChipText}>{it}</Text>
                <TouchableOpacity
                  onPress={() => handleRemoveItem(idx)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={13} color="#94A3B8" style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Optimizer Results Section */}
        {loading && (
          <View style={styles.resultLoading}>
            <ActivityIndicator size="large" color={Theme.colors.emerald} />
            <Text style={styles.resultLoadingText}>
              Calculating geodesic distances and comparing store prices...
            </Text>
          </View>
        )}

        {!loading && result && (
          <>
            {/* KPI Summary Cards */}
            <View style={styles.kpiGrid}>
              {/* Card 1: Optimized Cost */}
              <View style={[styles.kpiCard, styles.kpiCardHighlight]}>
                <View style={styles.kpiIconBox}>
                  <CheckCircle2 size={16} color={Theme.colors.forestGreen} />
                </View>
                <Text style={styles.kpiLabel}>Optimized Cost</Text>
                <Text style={styles.kpiValue}>₹{result.total_cost}</Text>
                <Text style={styles.kpiSub}>Lowest combo</Text>
              </View>

              {/* Card 2: Savings */}
              <View style={[styles.kpiCard, { backgroundColor: '#F0FDF4' }]}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <TrendingDown size={16} color={Theme.colors.emerald} />
                </View>
                <Text style={styles.kpiLabel}>Total Savings</Text>
                <Text style={[styles.kpiValue, { color: Theme.colors.emerald }]}>
                  ₹{result.total_savings} ({result.savings_percentage}%)
                </Text>
                <Text style={styles.kpiSub}>vs ₹{result.baseline_cost} max</Text>
              </View>

              {/* Card 3: Geodesic Travel Distance */}
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#EFF6FF' }]}>
                  <Navigation size={16} color="#2563EB" />
                </View>
                <Text style={styles.kpiLabel}>Geodesic Distance</Text>
                <Text style={styles.kpiValue}>{result.total_distance_km} km</Text>
                <Text style={styles.kpiSub}>Surface distance</Text>
              </View>

              {/* Card 4: Store Count */}
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIconBox, { backgroundColor: '#FEF3C7' }]}>
                  <Store size={16} color="#D97706" />
                </View>
                <Text style={styles.kpiLabel}>Stores to Visit</Text>
                <Text style={styles.kpiValue}>{result.unique_stores_count} Stores</Text>
                <Text style={styles.kpiSub}>{result.matched_count} items matched</Text>
              </View>
            </View>

            {/* Missing items warning */}
            {result.missing_items && result.missing_items.length > 0 && (
              <View style={styles.warningCard}>
                <AlertCircle size={18} color="#D97706" />
                <View style={styles.warningCol}>
                  <Text style={styles.warningTitle}>Items Not in Supermarket Catalog</Text>
                  <Text style={styles.warningDesc}>
                    {result.missing_items.join(', ')} were not found in store pricing files and could not be optimized.
                  </Text>
                </View>
              </View>
            )}

            {/* Store Breakdown Groups */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Optimized Store Routing</Text>
              <Text style={styles.sectionSub}>Buy each item where it's cheapest</Text>
            </View>

            {result.store_groups.map((group: StoreGroup) => (
              <View key={group.store} style={styles.storeCard}>
                {/* Store Header */}
                <View style={styles.storeCardHeader}>
                  <View style={styles.storeLeft}>
                    <View style={styles.storeIconWrap}>
                      <Store size={18} color={Theme.colors.forestGreen} />
                    </View>
                    <View>
                      <Text style={styles.storeName}>{group.store}</Text>
                      <Text style={styles.storeDistance}>
                        {group.distance_km} km away • Coordinates: {group.latitude}, {group.longitude}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.storeSubtotalBox}>
                    <Text style={styles.storeSubtotalLabel}>Subtotal</Text>
                    <Text style={styles.storeSubtotalValue}>₹{group.subtotal}</Text>
                  </View>
                </View>

                {/* Items at this store */}
                <View style={styles.storeItemsList}>
                  {group.items.map((it, idx) => (
                    <View key={`${it.item}_${idx}`} style={styles.storeItemRow}>
                      <View style={styles.itemBullet} />
                      <Text style={styles.storeItemName}>{it.item}</Text>
                      <View style={styles.priceBadge}>
                        <Text style={styles.priceBadgeText}>Cheapest at ₹{it.price}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Algorithm Info Banner */}
            <View style={styles.algoInfoCard}>
              <View style={styles.algoHeader}>
                <Sparkles size={14} color={Theme.colors.forestGreen} />
                <Text style={styles.algoTitle}>Optimization Methodology</Text>
              </View>
              <Text style={styles.algoText}>
                • Greedy selection matches each item to the lowest-cost store in the dataset.
                {'\n'}• Geodesic distances calculated using Earth radius R = 6371.009 km matching Geopy.
                {'\n'}• Real dataset prices sourced from D-Mart, Reliance Fresh, and Big Bazaar.
              </Text>
            </View>

            {/* Bottom Actions */}
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.summaryBtn}
                onPress={() =>
                  onNavigate('SmartGrocerySummary', {
                    optimizedResult: result,
                    items: result.items,
                  })
                }
                activeOpacity={0.85}
              >
                <FileText size={18} color="#FFFFFF" />
                <Text style={styles.summaryBtnText}>View Shopping Summary</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.compareBtn}
                onPress={() => onNavigate('SmartGroceryCompare')}
                activeOpacity={0.8}
              >
                <Store size={18} color={Theme.colors.forestGreen} />
                <Text style={styles.compareBtnText}>Compare Store Prices</Text>
              </TouchableOpacity>
            </View>
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
    justifyContent: 'space-between',
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
  refreshHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 18,
    paddingBottom: 40,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    gap: 8,
  },
  locationText: {
    fontSize: 12,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.forestGreen,
    flex: 1,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  cardHeading: {
    fontSize: 16,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  cardSub: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    marginTop: 3,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#F8FAF7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.primaryText,
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Theme.colors.emerald,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  itemChipText: {
    fontSize: 13,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.primaryText,
  },
  resultLoading: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  resultLoadingText: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  kpiCardHighlight: {
    borderColor: Theme.colors.emerald,
    borderWidth: 1.5,
  },
  kpiIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
    marginTop: 2,
  },
  kpiSub: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: '#94A3B8',
    marginTop: 2,
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
    gap: 10,
    alignItems: 'flex-start',
  },
  warningCol: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 13,
    fontFamily: Theme.fonts.heading,
    color: '#92400E',
  },
  warningDesc: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: '#B45309',
    marginTop: 2,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  storeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  storeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  storeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  storeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeName: {
    fontSize: 15,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  storeDistance: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  storeSubtotalBox: {
    alignItems: 'flex-end',
  },
  storeSubtotalLabel: {
    fontSize: 10,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
  },
  storeSubtotalValue: {
    fontSize: 16,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
  },
  storeItemsList: {
    paddingTop: 10,
    gap: 8,
  },
  storeItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.emerald,
    marginRight: 8,
  },
  storeItemName: {
    fontSize: 13,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.primaryText,
    flex: 1,
  },
  priceBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  priceBadgeText: {
    fontSize: 11,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.forestGreen,
  },
  algoInfoCard: {
    backgroundColor: '#F8FAF7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 20,
  },
  algoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  algoTitle: {
    fontSize: 12,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
  },
  algoText: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    lineHeight: 18,
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  summaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.emerald,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  summaryBtnText: {
    fontSize: 15,
    fontFamily: Theme.fonts.heading,
    color: '#FFFFFF',
  },
  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.emerald,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  compareBtnText: {
    fontSize: 15,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
  },
});

