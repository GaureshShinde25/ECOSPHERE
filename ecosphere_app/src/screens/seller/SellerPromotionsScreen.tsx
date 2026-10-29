import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import {
  Tag,
  Sparkles,
  Plus,
  Clock,
  CheckCircle,
  Percent,
  TrendingUp,
  X,
  ArrowLeft,
  Calendar,
  Gift,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import { activeBusinessService } from '../../services/activeBusinessService';

interface SellerPromotionsScreenProps {
  onBack?: () => void;
}

interface PromotionItem {
  id: string;
  title: string;
  code: string;
  discountType: 'PERCENT' | 'FLAT';
  discountValue: number;
  minOrder: number;
  validUntil: string;
  isActive: boolean;
  redemptions: number;
}

export const SellerPromotionsScreen: React.FC<SellerPromotionsScreenProps> = ({ onBack }) => {
  const activeBiz = activeBusinessService.getActiveBusiness();
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'SCHEDULED' | 'EXPIRED'>('ACTIVE');
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  // New promo form states
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCode, setNewCode] = useState<string>('');
  const [discountType, setDiscountType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [discountVal, setDiscountVal] = useState<string>('');
  const [minOrder, setMinOrder] = useState<string>('200');

  const [promotions, setPromotions] = useState<PromotionItem[]>([
    {
      id: 'p1',
      title: 'Weekend Farmers Market 15% OFF',
      code: 'WEEKEND15',
      discountType: 'PERCENT',
      discountValue: 15,
      minOrder: 250,
      validUntil: 'Nov 3, 2026',
      isActive: true,
      redemptions: 48,
    },
    {
      id: 'p2',
      title: 'First-Time Local Buyer Welcome',
      code: 'WELCOME50',
      discountType: 'FLAT',
      discountValue: 50,
      minOrder: 300,
      validUntil: 'Nov 30, 2026',
      isActive: true,
      redemptions: 92,
    },
    {
      id: 'p3',
      title: 'Fresh Harvest Festive Bonanza',
      code: 'HARVEST20',
      discountType: 'PERCENT',
      discountValue: 20,
      minOrder: 500,
      validUntil: 'Oct 15, 2026',
      isActive: false,
      redemptions: 114,
    },
  ]);

  const handleTogglePromo = (id: string, val: boolean) => {
    setPromotions((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: val } : p)));
  };

  const handleCreatePromo = () => {
    if (!newTitle.trim() || !newCode.trim() || !discountVal.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in all promotion details.');
      return;
    }

    const numVal = parseFloat(discountVal);
    if (isNaN(numVal) || numVal <= 0) {
      Alert.alert('Invalid Value', 'Please enter a valid discount amount.');
      return;
    }

    const newPromo: PromotionItem = {
      id: `p_${Date.now()}`,
      title: newTitle.trim(),
      code: newCode.trim().toUpperCase(),
      discountType,
      discountValue: numVal,
      minOrder: parseFloat(minOrder) || 100,
      validUntil: '30 Days from now',
      isActive: true,
      redemptions: 0,
    };

    setPromotions([newPromo, ...promotions]);
    setModalVisible(false);
    setNewTitle('');
    setNewCode('');
    setDiscountVal('');
    Alert.alert('Promotion Launched', `Code ${newPromo.code} is now active for your customers!`);
  };

  const filteredPromotions = promotions.filter((p) => {
    if (activeTab === 'ACTIVE') return p.isActive;
    if (activeTab === 'SCHEDULED') return !p.isActive && p.redemptions === 0;
    if (activeTab === 'EXPIRED') return !p.isActive && p.redemptions > 0;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          {onBack && (
            <TouchableOpacity style={styles.backBtn} onPress={onBack}>
              <ArrowLeft size={20} color={Theme.colors.primaryText} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={styles.headerTitle}>Promotions & Offers</Text>
            <Text style={styles.headerSubtitle}>
              {activeBiz?.name || 'My Store'} • Customer Discounts
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.addPromoBtn}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.85}
        >
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addPromoBtnText}>New Offer</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Promotional Marketing Hero */}
        <View style={styles.marketingHero}>
          <View style={styles.heroBadge}>
            <Sparkles size={12} color="#064E3B" />
            <Text style={styles.heroBadgeText}>CAMPAIGN ACCELERATOR</Text>
          </View>
          <Text style={styles.heroTitle}>Drive 3x More Orders With Deals</Text>
          <Text style={styles.heroDesc}>
            Offer coupons and seasonal flash discounts to gain loyal repeat shoppers in your neighborhood.
          </Text>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabsRow}>
          <TouchableOpacity
            style={[styles.filterChip, activeTab === 'ACTIVE' && styles.filterChipActive]}
            onPress={() => setActiveTab('ACTIVE')}
          >
            <Text style={[styles.filterChipText, activeTab === 'ACTIVE' && styles.filterChipTextActive]}>
              Active Deals ({promotions.filter((p) => p.isActive).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, activeTab === 'EXPIRED' && styles.filterChipActive]}
            onPress={() => setActiveTab('EXPIRED')}
          >
            <Text style={[styles.filterChipText, activeTab === 'EXPIRED' && styles.filterChipTextActive]}>
              Past Deals ({promotions.filter((p) => !p.isActive).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Promotions List */}
        {filteredPromotions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Gift size={36} color={Theme.colors.emerald} />
            <Text style={styles.emptyTitle}>No promotions in this tab</Text>
            <Text style={styles.emptySub}>
              Create a new coupon to boost customer orders and retain buyers.
            </Text>
          </View>
        ) : (
          filteredPromotions.map((promo) => (
            <View key={promo.id} style={styles.promoCard}>
              <View style={styles.cardHeader}>
                <View style={styles.couponCodeBadge}>
                  <Tag size={13} color={Theme.colors.forestGreen} />
                  <Text style={styles.couponCodeText}>{promo.code}</Text>
                </View>

                <View style={styles.toggleRow}>
                  <Text style={styles.toggleLabel}>{promo.isActive ? 'Active' : 'Paused'}</Text>
                  <Switch
                    value={promo.isActive}
                    onValueChange={(val) => handleTogglePromo(promo.id, val)}
                    trackColor={{ false: '#CBD5E1', true: '#DCFCE7' }}
                    thumbColor={promo.isActive ? '#16A34A' : '#94A3B8'}
                    style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
                  />
                </View>
              </View>

              <Text style={styles.promoTitle}>{promo.title}</Text>

              <View style={styles.metaRow}>
                <Text style={styles.discountBadge}>
                  {promo.discountType === 'PERCENT'
                    ? `${promo.discountValue}% OFF`
                    : `₹${promo.discountValue} FLAT OFF`}
                </Text>
                <Text style={styles.minOrderText}>Min order ₹{promo.minOrder}</Text>
                <Text style={styles.validText}>Valid until {promo.validUntil}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.cardFooter}>
                <View style={styles.redemptionCol}>
                  <TrendingUp size={14} color="#16A34A" />
                  <Text style={styles.redemptionText}>
                    {promo.redemptions} Customers claimed this deal
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* New Promotion Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create New Promotion</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color={Theme.colors.primaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Offer Title</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Flash Sunday Harvest Deal"
                  placeholderTextColor="#94A3B8"
                  value={newTitle}
                  onChangeText={setNewTitle}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Coupon Code</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. FLASH20"
                  placeholderTextColor="#94A3B8"
                  value={newCode}
                  onChangeText={setNewCode}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Discount Type</Text>
                <View style={styles.typeRow}>
                  <TouchableOpacity
                    style={[styles.typeBtn, discountType === 'PERCENT' && styles.typeBtnActive]}
                    onPress={() => setDiscountType('PERCENT')}
                  >
                    <Percent size={14} color={discountType === 'PERCENT' ? '#FFFFFF' : Theme.colors.secondaryText} />
                    <Text style={[styles.typeBtnText, discountType === 'PERCENT' && styles.typeBtnTextActive]}>
                      Percentage (%)
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.typeBtn, discountType === 'FLAT' && styles.typeBtnActive]}
                    onPress={() => setDiscountType('FLAT')}
                  >
                    <Text style={[styles.typeBtnText, discountType === 'FLAT' && styles.typeBtnTextActive]}>
                      Flat Rupees (₹)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Discount Value {discountType === 'PERCENT' ? '(%)' : '(₹)'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  placeholder={discountType === 'PERCENT' ? 'e.g. 15' : 'e.g. 50'}
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={discountVal}
                  onChangeText={setDiscountVal}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Minimum Order Value (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 250"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  value={minOrder}
                  onChangeText={setMinOrder}
                />
              </View>

              <TouchableOpacity
                style={styles.publishBtn}
                onPress={handleCreatePromo}
                activeOpacity={0.85}
              >
                <CheckCircle size={18} color="#FFFFFF" />
                <Text style={styles.publishBtnText}>Launch Offer</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBE3',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backBtn: {
    padding: 6,
    marginRight: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  headerSubtitle: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  addPromoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.emerald,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  addPromoBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
  },
  marketingHero: {
    backgroundColor: '#064E3B',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  heroBadge: {
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
  heroBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#064E3B',
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  heroDesc: {
    fontSize: 12,
    color: '#E4EBE3',
    lineHeight: 18,
  },
  filterTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EBE3',
  },
  filterChipActive: {
    backgroundColor: '#EAF7EE',
    borderColor: Theme.colors.emerald,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Theme.colors.secondaryText,
  },
  filterChipTextActive: {
    color: Theme.colors.forestGreen,
    fontWeight: '700',
  },
  promoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#17231B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  couponCodeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EE',
    borderWidth: 1,
    borderColor: Theme.colors.emerald,
    borderStyle: 'dashed',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  couponCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
  },
  promoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  discountBadge: {
    fontSize: 12,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
  },
  minOrderText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
  },
  validText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F0',
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  redemptionCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  redemptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#16A34A',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Theme.colors.primaryText,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primaryText,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F1F5F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: Theme.colors.primaryText,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F0',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 4,
  },
  typeBtnActive: {
    backgroundColor: Theme.colors.forestGreen,
  },
  typeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  publishBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: Theme.colors.emerald,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    marginBottom: 20,
  },
  publishBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

