import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  Share,
} from 'react-native';
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Share2,
  Store,
  Sparkles,
  TrendingDown,
  ShoppingBag,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import {
  groceryService,
  OptimizationResult,
  OptimizedItem,
} from '../../services/groceryService';

interface SmartGrocerySummaryScreenProps {
  listName?: string;
  optimizedResult?: OptimizationResult;
  items?: any[];
  onBack: () => void;
  onNavigate: (screen: string, params?: any) => void;
}

export const SmartGrocerySummaryScreen: React.FC<SmartGrocerySummaryScreenProps> = ({
  listName = 'Smart Grocery Run',
  optimizedResult,
  items: passedItems,
  onBack,
  onNavigate,
}) => {
  const [recording, setRecording] = useState<boolean>(false);
  const [completed, setCompleted] = useState<boolean>(false);

  // Normalize items from optimizedResult or passed items
  const summaryItems =
    optimizedResult?.items ||
    passedItems || [
      { item: 'Milk', price: 50, store: 'D-Mart' },
      { item: 'Bread', price: 38, store: 'Reliance Fresh' },
      { item: 'Eggs', price: 70, store: 'D-Mart' },
      { item: 'Tomato', price: 35, store: 'Reliance Fresh' },
      { item: 'Rice', price: 110, store: 'Big Bazaar' },
    ];

  const totalSpend =
    optimizedResult?.total_cost ||
    summaryItems.reduce((sum, it) => sum + (it.price || it.typical_price || 0), 0);

  const baselineCost = optimizedResult?.baseline_cost || Math.round(totalSpend * 1.15);
  const savings = optimizedResult?.total_savings || baselineCost - totalSpend;
  const savingsPct =
    optimizedResult?.savings_percentage || Math.round((savings / baselineCost) * 100);

  const handleRecordTrip = async () => {
    try {
      setRecording(true);
      const itemsToRecord = summaryItems.map((it) => ({
        name: it.item || it.name,
        quantity: it.quantity || 1,
        price: it.price || it.typical_price || 40,
      }));

      await groceryService.recordShoppingTrip(
        listName,
        itemsToRecord,
        optimizedResult?.unique_stores_count && optimizedResult.unique_stores_count > 1
          ? 'Multi-Store Trip'
          : summaryItems[0]?.store || 'D-Mart',
        totalSpend,
        savings
      );

      setCompleted(true);
      Alert.alert(
        'Shopping Trip Recorded! 🎉',
        `Saved to your shopping history. You saved ₹${savings} (${savingsPct}%) on this trip!`,
        [
          {
            text: 'View History',
            onPress: () => onNavigate('SmartGroceryHistory'),
          },
          {
            text: 'Return to Dashboard',
            onPress: () => onNavigate('SmartGrocery'),
          },
        ]
      );
    } catch (err) {
      if (__DEV__) console.warn('[SmartGrocerySummaryScreen] Record trip error:', err);
      Alert.alert('Error', 'Unable to record shopping trip.');
    } finally {
      setRecording(false);
    }
  };

  const handleShareSummary = async () => {
    try {
      const itemLines = summaryItems
        .map(
          (it, idx) =>
            `${idx + 1}. ${it.item || it.name} - ₹${it.price || it.typical_price} (${it.store || 'Supermarket'})`
        )
        .join('\n');

      const message = `🛒 ECOSPHERE Smart Grocery Summary: ${listName}\n\n${itemLines}\n\n💰 Total Spend: ₹${totalSpend}\n🎉 Total Savings: ₹${savings} (${savingsPct}%)\nStores: ${
        optimizedResult?.unique_stores_count || 1
      } Supermarkets\n\nGenerated with ECOSPHERE Smart Grocery Optimizer`;

      await Share.share({
        message,
        title: `ECOSPHERE Grocery Summary - ${listName}`,
      });
    } catch (err) {
      if (__DEV__) console.warn('[SmartGrocerySummaryScreen] Share error:', err);
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
          <Text style={styles.headerTitle}>Shopping Summary</Text>
          <Text style={styles.headerSubtitle}>Itemized breakdown & multi-store savings</Text>
        </View>

        <TouchableOpacity
          style={styles.shareHeaderBtn}
          onPress={handleShareSummary}
          activeOpacity={0.8}
        >
          <Share2 size={18} color={Theme.colors.forestGreen} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Success / Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.badgeWrap}>
              <Sparkles size={14} color="#065F46" />
              <Text style={styles.badgeText}>OPTIMIZED CHECKOUT</Text>
            </View>
            <Text style={styles.tripDate}>
              {new Date().toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>

          <Text style={styles.heroListName}>{listName}</Text>
          <Text style={styles.heroSubtitle}>
            {summaryItems.length} items optimized across D-Mart, Reliance Fresh & Big Bazaar
          </Text>

          <View style={styles.metricsRow}>
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Total Spend</Text>
              <Text style={styles.metricTotal}>₹{totalSpend}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>Baseline (Max)</Text>
              <Text style={styles.metricBaseline}>₹{baselineCost}</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metricCol}>
              <Text style={styles.metricLabel}>You Saved</Text>
              <Text style={styles.metricSavings}>₹{savings} ({savingsPct}%)</Text>
            </View>
          </View>
        </View>

        {/* Itemized Table */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Itemized Purchase Breakdown</Text>
          <Text style={styles.sectionSub}>Cheapest store allocated per item</Text>
        </View>

        <View style={styles.tableCard}>
          {summaryItems.map((it, idx) => (
            <View
              key={idx}
              style={[styles.tableRow, idx === summaryItems.length - 1 && styles.tableRowLast]}
            >
              <View style={styles.itemInfoCol}>
                <Text style={styles.tableItemName}>{it.item || it.name}</Text>
                <View style={styles.storeBadge}>
                  <Store size={10} color={Theme.colors.forestGreen} />
                  <Text style={styles.storeBadgeText}>{it.store || 'D-Mart'}</Text>
                </View>
              </View>

              <View style={styles.itemPriceCol}>
                <Text style={styles.tableItemPrice}>₹{it.price || it.typical_price}</Text>
                <Text style={styles.bestPriceNote}>Lowest store</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom Actions */}
        <View style={styles.actionsWrap}>
          <TouchableOpacity
            style={[styles.completeBtn, completed && styles.completeBtnDone]}
            onPress={handleRecordTrip}
            disabled={recording || completed}
            activeOpacity={0.85}
          >
            {recording ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : completed ? (
              <>
                <CheckCircle2 size={18} color="#FFFFFF" />
                <Text style={styles.completeBtnText}>Trip Recorded in History</Text>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} color="#FFFFFF" />
                <Text style={styles.completeBtnText}>Complete & Record Trip</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exportBtn}
            onPress={handleShareSummary}
            activeOpacity={0.8}
          >
            <Download size={18} color={Theme.colors.forestGreen} />
            <Text style={styles.exportBtnText}>Share & Export Summary</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dashboardReturnBtn}
            onPress={() => onNavigate('SmartGrocery')}
            activeOpacity={0.7}
          >
            <Text style={styles.dashboardReturnText}>Back to Smart Grocery</Text>
          </TouchableOpacity>
        </View>
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
  shareHeaderBtn: {
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
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: Theme.fonts.heading,
    color: '#065F46',
  },
  tripDate: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
  },
  heroListName: {
    fontSize: 20,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  heroSubtitle: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    marginTop: 4,
    marginBottom: 16,
  },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAF7',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
  },
  metricTotal: {
    fontSize: 19,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
    marginTop: 2,
  },
  metricBaseline: {
    fontSize: 17,
    fontFamily: Theme.fonts.bodyMedium,
    color: '#94A3B8',
    marginTop: 2,
    textDecorationLine: 'line-through',
  },
  metricSavings: {
    fontSize: 17,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
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
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  itemInfoCol: {
    flex: 1,
  },
  tableItemName: {
    fontSize: 15,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 4,
    gap: 4,
  },
  storeBadgeText: {
    fontSize: 11,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.forestGreen,
  },
  itemPriceCol: {
    alignItems: 'flex-end',
  },
  tableItemPrice: {
    fontSize: 16,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  bestPriceNote: {
    fontSize: 10,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.emerald,
    marginTop: 2,
  },
  actionsWrap: {
    gap: 12,
    marginBottom: 20,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.emerald,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
  },
  completeBtnDone: {
    backgroundColor: Theme.colors.forestGreen,
  },
  completeBtnText: {
    fontSize: 15,
    fontFamily: Theme.fonts.heading,
    color: '#FFFFFF',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Theme.colors.emerald,
    paddingVertical: 14,
    gap: 8,
  },
  exportBtnText: {
    fontSize: 15,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
  },
  dashboardReturnBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dashboardReturnText: {
    fontSize: 13,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.secondaryText,
  },
});

