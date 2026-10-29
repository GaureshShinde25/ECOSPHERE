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
  Clock,
  Store,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ShoppingBag,
  TrendingDown,
  Calendar,
  CheckCircle2,
  Plus,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import {
  groceryService,
  GroceryHistoryTrip,
} from '../../services/groceryService';

interface SmartGroceryHistoryScreenProps {
  onBack: () => void;
  onNavigate: (screen: string, params?: any) => void;
}

export const SmartGroceryHistoryScreen: React.FC<SmartGroceryHistoryScreenProps> = ({
  onBack,
  onNavigate,
}) => {
  const [trips, setTrips] = useState<GroceryHistoryTrip[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedTripId, setExpandedTripId] = useState<string | null>(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const fetched = await groceryService.getShoppingHistory();
      if (fetched && fetched.length > 0) {
        setTrips(fetched);
      } else {
        // Fallback default sample trip history if fresh
        const sampleTrips: GroceryHistoryTrip[] = [
          {
            id: 'trip_1',
            userId: 'current',
            listName: 'Weekly Family Groceries',
            purchaseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            store: 'D-Mart',
            totalSpend: 480,
            itemCount: 6,
            savings: 64,
            items: [
              { name: 'Milk', quantity: 2, price: 50 },
              { name: 'Bread', quantity: 1, price: 38 },
              { name: 'Eggs', quantity: 1, price: 70 },
              { name: 'Tomato', quantity: 2, price: 35 },
              { name: 'Rice', quantity: 1, price: 110 },
              { name: 'Butter', quantity: 1, price: 55 },
            ],
          },
          {
            id: 'trip_2',
            userId: 'current',
            listName: 'Weekend Fresh Produce',
            purchaseDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            store: 'Reliance Fresh',
            totalSpend: 310,
            itemCount: 4,
            savings: 42,
            items: [
              { name: 'Apples', quantity: 1, price: 120 },
              { name: 'Bananas', quantity: 2, price: 40 },
              { name: 'Potato', quantity: 2, price: 28 },
              { name: 'Onion', quantity: 1, price: 32 },
            ],
          },
        ];
        setTrips(sampleTrips);
      }
    } catch (err) {
      if (__DEV__) console.warn('[SmartGroceryHistoryScreen] Error loading history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedTripId((prev) => (prev === id ? null : id));
  };

  const handleReuseList = async (trip: GroceryHistoryTrip) => {
    try {
      const itemsToClone = trip.items.map((it) => ({
        name: it.name,
        quantity: it.quantity,
        unit: 'unit',
        category: 'General',
      }));

      const newList = await groceryService.createShoppingList(
        `Cloned: ${trip.listName}`,
        itemsToClone
      );

      Alert.alert(
        'List Reused',
        `Created a new shopping list with ${trip.items.length} items from this trip.`,
        [
          { text: 'Stay Here' },
          {
            text: 'Open List',
            onPress: () => onNavigate('SmartGroceryList', { listId: newList.id, list: newList }),
          },
        ]
      );
    } catch (err) {
      if (__DEV__) console.warn('[SmartGroceryHistoryScreen] Reuse error:', err);
      Alert.alert('Error', 'Unable to clone list.');
    }
  };

  // Lifetime savings & spend
  const totalLifetimeSpend = trips.reduce((sum, t) => sum + (t.totalSpend || 0), 0);
  const totalLifetimeSavings = trips.reduce((sum, t) => sum + (t.savings || 0), 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Theme.colors.primaryText} />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Shopping History</Text>
          <Text style={styles.headerSubtitle}>Past supermarket trips & list reuse</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cumulative Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Recorded Trips</Text>
            <Text style={styles.statVal}>{trips.length}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Total Spend</Text>
            <Text style={styles.statVal}>₹{totalLifetimeSpend.toLocaleString()}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Total Saved</Text>
            <Text style={[styles.statVal, { color: Theme.colors.forestGreen }]}>
              ₹{totalLifetimeSavings.toLocaleString()}
            </Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Theme.colors.emerald} />
            <Text style={styles.loadingText}>Loading trip history...</Text>
          </View>
        ) : trips.length === 0 ? (
          <View style={styles.emptyCard}>
            <Clock size={40} color={Theme.colors.emerald} />
            <Text style={styles.emptyTitle}>No Recorded Trips Yet</Text>
            <Text style={styles.emptySub}>
              Complete your first shopping trip or check off items in your list to start tracking historical spend and multi-store savings.
            </Text>
            <TouchableOpacity
              style={styles.firstTripBtn}
              onPress={() => onNavigate('SmartGroceryList')}
              activeOpacity={0.85}
            >
              <Plus size={16} color="#FFFFFF" />
              <Text style={styles.firstTripBtnText}>Create Shopping List</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.tripsList}>
            {trips.map((trip) => {
              const isExpanded = expandedTripId === trip.id;
              const dateStr = new Date(trip.purchaseDate).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              });

              return (
                <View key={trip.id} style={styles.tripCard}>
                  {/* Card Main Row */}
                  <TouchableOpacity
                    style={styles.tripCardHeader}
                    onPress={() => toggleExpand(trip.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.tripIconBox}>
                      <Store size={20} color={Theme.colors.forestGreen} />
                    </View>

                    <View style={styles.tripHeaderMid}>
                      <Text style={styles.tripListName}>{trip.listName}</Text>
                      <View style={styles.tripMetaRow}>
                        <Text style={styles.tripStore}>{trip.store}</Text>
                        <Text style={styles.tripDot}>•</Text>
                        <Text style={styles.tripDate}>{dateStr}</Text>
                        <Text style={styles.tripDot}>•</Text>
                        <Text style={styles.tripItemsCount}>{trip.itemCount} items</Text>
                      </View>
                    </View>

                    <View style={styles.tripSpendBox}>
                      <Text style={styles.tripSpend}>₹{trip.totalSpend}</Text>
                      {trip.savings ? (
                        <View style={styles.savingsPill}>
                          <Text style={styles.savingsPillText}>Saved ₹{trip.savings}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={styles.chevronWrap}>
                      {isExpanded ? (
                        <ChevronUp size={18} color="#64748B" />
                      ) : (
                        <ChevronDown size={18} color="#64748B" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Expanded Itemized Breakdown & Actions */}
                  {isExpanded && (
                    <View style={styles.expandedContent}>
                      <View style={styles.itemsDivider} />
                      <Text style={styles.expandedSectionHeading}>Purchased Items</Text>

                      <View style={styles.expandedItemsList}>
                        {trip.items.map((it, idx) => (
                          <View key={idx} style={styles.expandedItemRow}>
                            <View style={styles.bullet} />
                            <Text style={styles.expandedItemName}>
                              {it.name} (x{it.quantity})
                            </Text>
                            <Text style={styles.expandedItemPrice}>₹{it.price}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Reuse List CTA Button */}
                      <TouchableOpacity
                        style={styles.reuseBtn}
                        onPress={() => handleReuseList(trip)}
                        activeOpacity={0.8}
                      >
                        <RotateCcw size={16} color="#FFFFFF" />
                        <Text style={styles.reuseBtnText}>Reuse This Shopping List</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
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
  headerTitle: {
    fontSize: 20,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
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
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
  },
  statVal: {
    fontSize: 18,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
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
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginTop: 20,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    lineHeight: 19,
  },
  firstTripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.emerald,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    marginTop: 10,
  },
  firstTripBtnText: {
    fontSize: 14,
    fontFamily: Theme.fonts.heading,
    color: '#FFFFFF',
  },
  tripsList: {
    gap: 12,
  },
  tripCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    overflow: 'hidden',
  },
  tripCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  tripIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tripHeaderMid: {
    flex: 1,
  },
  tripListName: {
    fontSize: 15,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  tripMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  tripStore: {
    fontSize: 12,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.forestGreen,
  },
  tripDot: {
    fontSize: 11,
    color: '#94A3B8',
  },
  tripDate: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
  },
  tripItemsCount: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
  },
  tripSpendBox: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  tripSpend: {
    fontSize: 16,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  savingsPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  savingsPillText: {
    fontSize: 10,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
  },
  chevronWrap: {
    marginLeft: 2,
  },
  expandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemsDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  expandedSectionHeading: {
    fontSize: 12,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.secondaryText,
    marginBottom: 8,
  },
  expandedItemsList: {
    gap: 8,
    marginBottom: 14,
  },
  expandedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Theme.colors.emerald,
    marginRight: 8,
  },
  expandedItemName: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.primaryText,
    flex: 1,
  },
  expandedItemPrice: {
    fontSize: 13,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.forestGreen,
  },
  reuseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.emerald,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  reuseBtnText: {
    fontSize: 13,
    fontFamily: Theme.fonts.heading,
    color: '#FFFFFF',
  },
});

