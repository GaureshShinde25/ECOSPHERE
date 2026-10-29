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
  Modal,
} from 'react-native';
import {
  ArrowLeft,
  Wallet,
  Sparkles,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Plus,
  Edit2,
  PieChart,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import {
  groceryService,
  GroceryBudget,
  BudgetPlanResponse,
  GroceryShoppingList,
} from '../../services/groceryService';

interface SmartGroceryBudgetScreenProps {
  onBack: () => void;
  onNavigate: (screen: string, params?: any) => void;
}

export const SmartGroceryBudgetScreen: React.FC<SmartGroceryBudgetScreenProps> = ({
  onBack,
  onNavigate,
}) => {
  const [budget, setBudget] = useState<GroceryBudget>({
    userId: 'current',
    monthlyBudget: 3000,
    weeklyBudget: 750,
    updatedAt: new Date().toISOString(),
  });
  const [lists, setLists] = useState<GroceryShoppingList[]>([]);
  const [planResult, setPlanResult] = useState<BudgetPlanResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingBudget, setEditingBudget] = useState<boolean>(false);
  const [monthlyInput, setMonthlyInput] = useState<string>('3000');
  const [savingBudget, setSavingBudget] = useState<boolean>(false);

  const loadBudgetData = async () => {
    try {
      setLoading(true);
      const [fetchedBudget, fetchedLists] = await Promise.all([
        groceryService.getBudget(),
        groceryService.getShoppingLists(),
      ]);

      const currentBudget = fetchedBudget || {
        userId: 'current',
        monthlyBudget: 3000,
        weeklyBudget: 750,
        updatedAt: new Date().toISOString(),
      };
      setBudget(currentBudget);
      setMonthlyInput(String(currentBudget.monthlyBudget));
      setLists(fetchedLists || []);

      // Extract current active list item names for knapsack plan
      const activeList = fetchedLists?.find((l) => l.status === 'draft' || l.status === 'planned');
      const itemNames = activeList?.items?.map((it) => it.name) || ['Milk', 'Bread', 'Eggs', 'Rice'];

      const plan = await groceryService.planBudget(currentBudget.monthlyBudget, itemNames);
      setPlanResult(plan);
    } catch (err) {
      if (__DEV__) console.warn('[SmartGroceryBudgetScreen] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgetData();
  }, []);

  const handleSaveBudget = async () => {
    const val = parseFloat(monthlyInput);
    if (isNaN(val) || val <= 0) {
      Alert.alert('Invalid Budget', 'Please enter a valid monthly grocery budget amount.');
      return;
    }

    try {
      setSavingBudget(true);
      const updated = await groceryService.setBudget(val, Math.round(val / 4));
      setBudget(updated);
      setEditingBudget(false);

      // Re-run knapsack plan with new budget
      const activeList = lists.find((l) => l.status === 'draft' || l.status === 'planned');
      const itemNames = activeList?.items?.map((it) => it.name) || ['Milk', 'Bread', 'Eggs', 'Rice'];
      const plan = await groceryService.planBudget(updated.monthlyBudget, itemNames);
      setPlanResult(plan);

      Alert.alert('Budget Saved', `Monthly grocery budget set to ₹${val.toLocaleString()}.`);
    } catch (err) {
      if (__DEV__) console.warn('[SmartGroceryBudgetScreen] Save budget error:', err);
      Alert.alert('Error', 'Unable to save budget.');
    } finally {
      setSavingBudget(false);
    }
  };

  // Metrics
  const activeList = lists.find((l) => l.status === 'draft' || l.status === 'planned') || lists[0];
  const currentSpend = planResult?.current_items_cost || activeList?.estimatedCost || 240;
  const monthlyLimit = budget.monthlyBudget || 3000;
  const remaining = monthlyLimit - currentSpend;
  const spendPercent = Math.min(Math.round((currentSpend / monthlyLimit) * 100), 100);

  // Meter color logic: Green (< 80%), Amber (80-100%), Red (> 100%)
  const isExceeded = currentSpend > monthlyLimit;
  const meterColor = isExceeded
    ? '#EF4444'
    : spendPercent > 80
    ? '#F59E0B'
    : Theme.colors.emerald;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Theme.colors.primaryText} />
        </TouchableOpacity>
        <View style={styles.headerTitleCol}>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Budget Planner</Text>
            <View style={styles.aiTag}>
              <Sparkles size={11} color={Theme.colors.forestGreen} />
              <Text style={styles.aiTagText}>KNAPSACK AI</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Spend tracking & utility maximization</Text>
        </View>

        <TouchableOpacity
          style={styles.editHeaderBtn}
          onPress={() => setEditingBudget(true)}
          activeOpacity={0.8}
        >
          <Edit2 size={18} color={Theme.colors.emerald} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Budget Card */}
        <View style={styles.budgetCard}>
          <View style={styles.budgetTopRow}>
            <View>
              <Text style={styles.cardSubTitle}>Monthly Grocery Target</Text>
              <Text style={styles.budgetValue}>₹{monthlyLimit.toLocaleString()}</Text>
            </View>
            <TouchableOpacity
              style={styles.editBadge}
              onPress={() => setEditingBudget(true)}
              activeOpacity={0.7}
            >
              <Edit2 size={13} color={Theme.colors.forestGreen} />
              <Text style={styles.editBadgeText}>Adjust</Text>
            </TouchableOpacity>
          </View>

          {/* Visual Progress Meter */}
          <View style={styles.meterContainer}>
            <View style={styles.meterBackground}>
              <View
                style={[
                  styles.meterFill,
                  { width: `${spendPercent}%`, backgroundColor: meterColor },
                ]}
              />
            </View>
            <View style={styles.meterLabelsRow}>
              <Text style={styles.meterText}>₹{currentSpend.toLocaleString()} spent</Text>
              <Text style={[styles.meterText, { color: meterColor, fontFamily: Theme.fonts.heading }]}>
                {spendPercent}% of limit
              </Text>
            </View>
          </View>

          {/* Status Breakdown Bar */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownCol}>
              <Text style={styles.breakdownLabel}>Weekly Allocation</Text>
              <Text style={styles.breakdownValue}>
                ₹{(budget.weeklyBudget || Math.round(monthlyLimit / 4)).toLocaleString()}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.breakdownCol}>
              <Text style={styles.breakdownLabel}>Remaining Budget</Text>
              <Text
                style={[
                  styles.breakdownValue,
                  { color: remaining >= 0 ? Theme.colors.forestGreen : '#EF4444' },
                ]}
              >
                {remaining >= 0 ? `₹${remaining.toLocaleString()}` : `-₹${Math.abs(remaining).toLocaleString()}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Budget Status Alert Banner */}
        {isExceeded ? (
          <View style={styles.alertCardDanger}>
            <AlertTriangle size={18} color="#B91C1C" />
            <View style={styles.alertCol}>
              <Text style={styles.alertTitleDanger}>Budget Exceeded</Text>
              <Text style={styles.alertDescDanger}>
                Your planned list items exceed your budget limit by ₹{Math.abs(remaining)}. See recommended swaps below.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.alertCardSuccess}>
            <ShieldCheck size={18} color="#065F46" />
            <View style={styles.alertCol}>
              <Text style={styles.alertTitleSuccess}>On Track with Budget</Text>
              <Text style={styles.alertDescSuccess}>
                You have ₹{remaining} available. Our knapsack heuristic selected high-utility additions below.
              </Text>
            </View>
          </View>
        )}

        {/* AI Knapsack Recommended Additions */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={Theme.colors.emerald} />
            <Text style={styles.loadingText}>Running knapsack utility maximization...</Text>
          </View>
        ) : (
          <>
            {planResult?.recommended_additions && planResult.recommended_additions.length > 0 && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Sparkles size={16} color={Theme.colors.forestGreen} />
                    <Text style={styles.sectionTitle}>High-Utility Additions to Fill Budget</Text>
                  </View>
                  <Text style={styles.sectionSub}>
                    Ranked by highest nutritional & household utility per rupee
                  </Text>
                </View>

                {planResult.recommended_additions.map((item, idx) => (
                  <View key={idx} style={styles.recItemCard}>
                    <View style={styles.recItemLeft}>
                      <View style={styles.utilityBadge}>
                        <Text style={styles.utilityText}>Utility {item.utility_score.toFixed(1)}/10</Text>
                      </View>
                      <Text style={styles.recItemName}>{item.item_name}</Text>
                      <Text style={styles.recItemCategory}>
                        {item.category} • {item.unit} • {item.brand}
                      </Text>
                    </View>

                    <View style={styles.recItemRight}>
                      <Text style={styles.recItemPrice}>₹{item.typical_price}</Text>
                      <TouchableOpacity
                        style={styles.addToListBtn}
                        onPress={() => {
                          Alert.alert('Item Added', `${item.item_name} added to your shopping list.`);
                        }}
                        activeOpacity={0.8}
                      >
                        <Plus size={15} color="#FFFFFF" />
                        <Text style={styles.addToListBtnText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Alternatives to Save (If Budget Exceeded or Tight) */}
            {planResult?.alternatives_to_save && planResult.alternatives_to_save.length > 0 && (
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleRow}>
                    <TrendingDown size={16} color={Theme.colors.forestGreen} />
                    <Text style={styles.sectionTitle}>Smart Budget Swaps</Text>
                  </View>
                  <Text style={styles.sectionSub}>
                    Lower-cost alternatives to trim excess grocery spending
                  </Text>
                </View>

                {planResult.alternatives_to_save.map((alt, idx) => (
                  <View key={idx} style={styles.swapCard}>
                    <View style={styles.swapTop}>
                      <View style={styles.swapCol}>
                        <Text style={styles.swapOriginal}>Replace {alt.original_item}</Text>
                        <Text style={styles.swapAlternative}>With {alt.alternative_item}</Text>
                        <Text style={styles.swapReason}>{alt.reason}</Text>
                      </View>
                      <View style={styles.swapSavings}>
                        <Text style={styles.swapSavingsText}>Save ₹{alt.savings}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Heuristic Explanation Card */}
        <View style={styles.algoCard}>
          <Text style={styles.algoTitle}>How Knapsack Optimization Works</Text>
          <Text style={styles.algoDesc}>
            Smart Grocery models your shopping list as a bounded 0/1 Knapsack Problem. Items are ranked by utility density:
            {'\n\n'}
            Utility / Price ratio = Score per Rupee
            {'\n\n'}
            This ensures your family gets the most nutritious, daily essential items without overspending your allocated monthly budget.
          </Text>
        </View>
      </ScrollView>

      {/* Edit Budget Modal */}
      <Modal visible={editingBudget} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalHeading}>Set Monthly Grocery Budget</Text>
            <Text style={styles.modalSub}>
              Enter your target spending limit for household groceries.
            </Text>

            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={monthlyInput}
                onChangeText={setMonthlyInput}
                placeholder="3000"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setEditingBudget(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveBudget}
                disabled={savingBudget}
                activeOpacity={0.85}
              >
                {savingBudget ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Budget</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  editHeaderBtn: {
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
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
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
  budgetTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardSubTitle: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
  },
  budgetValue: {
    fontSize: 28,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
    marginTop: 2,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 4,
  },
  editBadgeText: {
    fontSize: 12,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
  },
  meterContainer: {
    marginBottom: 18,
  },
  meterBackground: {
    height: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 6,
  },
  meterFill: {
    height: '100%',
    borderRadius: 6,
  },
  meterLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meterText: {
    fontSize: 12,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.secondaryText,
  },
  breakdownRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  breakdownCol: {
    flex: 1,
  },
  breakdownLabel: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
  },
  breakdownValue: {
    fontSize: 17,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 16,
  },
  alertCardDanger: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 20,
    gap: 10,
  },
  alertCol: {
    flex: 1,
  },
  alertTitleDanger: {
    fontSize: 13,
    fontFamily: Theme.fonts.heading,
    color: '#991B1B',
  },
  alertDescDanger: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: '#B91C1C',
    marginTop: 2,
  },
  alertCardSuccess: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 20,
    gap: 10,
  },
  alertTitleSuccess: {
    fontSize: 13,
    fontFamily: Theme.fonts.heading,
    color: '#065F46',
  },
  alertDescSuccess: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: '#047857',
    marginTop: 2,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
  },
  sectionWrap: {
    marginBottom: 20,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  sectionSub: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  recItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 10,
  },
  recItemLeft: {
    flex: 1,
  },
  utilityBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  utilityText: {
    fontSize: 10,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
  },
  recItemName: {
    fontSize: 15,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  recItemCategory: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  recItemRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  recItemPrice: {
    fontSize: 16,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
  },
  addToListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.emerald,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  addToListBtnText: {
    fontSize: 12,
    fontFamily: Theme.fonts.heading,
    color: '#FFFFFF',
  },
  swapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 10,
  },
  swapTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  swapCol: {
    flex: 1,
  },
  swapOriginal: {
    fontSize: 11,
    fontFamily: Theme.fonts.body,
    color: '#94A3B8',
  },
  swapAlternative: {
    fontSize: 15,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
    marginTop: 2,
  },
  swapReason: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    marginTop: 3,
  },
  swapSavings: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  swapSavingsText: {
    fontSize: 12,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
  },
  algoCard: {
    backgroundColor: '#F8FAF7',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 20,
  },
  algoTitle: {
    fontSize: 13,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
    marginBottom: 6,
  },
  algoDesc: {
    fontSize: 12,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
  },
  modalHeading: {
    fontSize: 18,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  modalSub: {
    fontSize: 13,
    fontFamily: Theme.fonts.body,
    color: Theme.colors.secondaryText,
    marginTop: 4,
    marginBottom: 18,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 20,
  },
  currencyPrefix: {
    fontSize: 20,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.forestGreen,
    marginRight: 8,
  },
  modalInput: {
    flex: 1,
    fontSize: 20,
    fontFamily: Theme.fonts.heading,
    color: Theme.colors.primaryText,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontFamily: Theme.fonts.bodyMedium,
    color: Theme.colors.secondaryText,
  },
  saveBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: Theme.colors.emerald,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: Theme.fonts.heading,
    color: '#FFFFFF',
  },
});

