import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  SafeAreaView,
  TouchableWithoutFeedback,
  Image,
} from 'react-native';
import { ChevronDown, Store, Check, Plus, X, Building2, ShoppingBag, Smartphone, Laptop } from 'lucide-react-native';
import { Business } from '../../types';
import { Theme } from '../../theme';
import { resolveImageUrl } from '../../services/apiConfig';

interface ShopSwitcherProps {
  businesses: Business[];
  activeBusiness: Business | null;
  onSelectBusiness: (business: Business) => void;
  onAddNewShop?: () => void;
  compact?: boolean;
}

export const ShopSwitcher: React.FC<ShopSwitcherProps> = ({
  businesses,
  activeBusiness,
  onSelectBusiness,
  onAddNewShop,
  compact = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const getShopIcon = (category?: string, name?: string) => {
    const text = `${category || ''} ${name || ''}`.toLowerCase();
    if (text.includes('mobile') || text.includes('phone')) {
      return <Smartphone size={18} color={Theme.colors.primary} />;
    }
    if (text.includes('electronic') || text.includes('laptop') || text.includes('tech')) {
      return <Laptop size={18} color="#A78BFA" />;
    }
    if (text.includes('grocery') || text.includes('mart') || text.includes('fresh')) {
      return <ShoppingBag size={18} color={Theme.colors.success} />;
    }
    return <Store size={18} color={Theme.colors.primary} />;
  };

  const displayName = activeBusiness?.name || 'Select Business';
  const displayCategory = activeBusiness?.category || 'Shop';

  return (
    <>
      <TouchableOpacity
        style={[styles.switcherTrigger, compact && styles.switcherTriggerCompact]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`Active Shop: ${displayName}. Tap to switch business.`}
      >
        <View style={styles.triggerIconBox}>
          {activeBusiness?.logoUrl ? (
            <Image
              source={{ uri: resolveImageUrl(activeBusiness.logoUrl) }}
              style={styles.triggerLogoImg}
              resizeMode="cover"
            />
          ) : (
            getShopIcon(activeBusiness?.category, activeBusiness?.name)
          )}
        </View>

        <View style={styles.triggerTextCol}>
          <Text style={styles.triggerName} numberOfLines={1}>
            {displayName}
          </Text>
          {!compact && (
            <Text style={styles.triggerSub} numberOfLines={1}>
              {displayCategory} • {activeBusiness?.location?.city || activeBusiness?.city || 'Maharashtra'}
            </Text>
          )}
        </View>

        <ChevronDown size={16} color={Theme.colors.secondaryText} style={styles.chevronIcon} />
      </TouchableOpacity>

      {/* Switcher Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={styles.modalSubtitle}>MY SHOPS & ENTERPRISES</Text>
                    <Text style={styles.modalTitle}>SELECT BUSINESS</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={() => setModalVisible(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.shopsList} showsVerticalScrollIndicator={false}>
                  {businesses.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Building2 size={36} color={Theme.colors.secondaryText} style={{ marginBottom: 8, opacity: 0.6 }} />
                      <Text style={styles.emptyTitle}>No businesses found.</Text>
                      <Text style={styles.emptySub}>Register a new shop to begin selling on ECOSPHERE.</Text>
                    </View>
                  ) : (
                    businesses.map((biz) => {
                      const isSelected = String(biz.id) === String(activeBusiness?.id);
                      const cityStr = biz.location?.city || biz.city || 'Maharashtra';
                      return (
                        <TouchableOpacity
                          key={biz.id}
                          style={[styles.shopItem, isSelected && styles.shopItemActive]}
                          onPress={() => {
                            onSelectBusiness(biz);
                            setModalVisible(false);
                          }}
                          activeOpacity={0.75}
                        >
                          <View style={styles.shopItemLeft}>
                            <View style={[styles.shopItemIconBox, isSelected && styles.shopItemIconBoxActive]}>
                              {biz.logoUrl ? (
                                <Image
                                  key={`switcher-logo-${biz.id}-${biz.logoUrl}`}
                                  source={{ uri: resolveImageUrl(biz.logoUrl) }}
                                  style={styles.shopItemLogoImg}
                                  resizeMode="cover"
                                />
                              ) : (
                                getShopIcon(biz.category, biz.name)
                              )}
                            </View>
                            <View style={styles.shopItemDetails}>
                              <Text style={[styles.shopItemName, isSelected && styles.shopItemNameActive]}>
                                {biz.name}
                              </Text>
                              <Text style={styles.shopItemSub}>
                                {biz.category || 'Retail Shop'} • {cityStr}
                              </Text>
                            </View>
                          </View>

                          {isSelected && (
                            <View style={styles.checkedCircle}>
                              <Check size={14} color="#040814" strokeWidth={3} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>

                {onAddNewShop && (
                  <TouchableOpacity
                    style={styles.addNewShopBtn}
                    onPress={() => {
                      setModalVisible(false);
                      onAddNewShop();
                    }}
                    activeOpacity={0.8}
                  >
                    <Plus size={18} color={Theme.colors.primary} />
                    <Text style={styles.addNewShopText}>+ Add New Business</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  switcherTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surfaceCard,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  switcherTriggerCompact: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  triggerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Theme.colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  triggerLogoImg: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
  triggerTextCol: {
    flex: 1,
  },
  triggerName: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  triggerSub: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 1,
    fontFamily: Theme.typography.fontFamily,
  },
  chevronIcon: {
    marginLeft: 4,
  },

  /* Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(23, 35, 27, 0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Theme.colors.surfaceCard,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: Theme.colors.primary,
    letterSpacing: 0.8,
    fontFamily: Theme.typography.fontFamily,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: Theme.colors.surfaceSubtle,
  },
  shopsList: {
    maxHeight: 320,
  },
  shopItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: Theme.colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    marginBottom: 10,
  },
  shopItemActive: {
    backgroundColor: Theme.colors.successLight,
    borderColor: Theme.colors.primary,
  },
  shopItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  shopItemIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: Theme.colors.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  shopItemLogoImg: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  shopItemIconBoxActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
  },
  shopItemDetails: {
    flex: 1,
  },
  shopItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  shopItemNameActive: {
    color: Theme.colors.primaryText,
    fontWeight: '800',
  },
  shopItemSub: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  checkedCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addNewShopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    backgroundColor: Theme.colors.surfaceSubtle,
    marginTop: 10,
  },
  addNewShopText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
  emptyContainer: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginTop: 8,
    fontFamily: Theme.typography.fontFamily,
  },
  emptySub: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: 20,
    fontFamily: Theme.typography.fontFamily,
  },
});
