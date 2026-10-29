import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import {
  Store,
  Package,
  ShoppingBag,
  BarChart3,
  Users,
  Tag,
  Settings,
  Sparkles,
  UserCheck,
  LogOut,
  ChevronRight,
  ShieldCheck,
  MapPin,
  RefreshCw,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import { activeBusinessService } from '../../services/activeBusinessService';
import { businessService } from '../../services/businessService';
import { authService } from '../../services/authService';
import { Business } from '../../types';

interface SellerMoreScreenProps {
  onNavigateTab: (tab: string, params?: any) => void;
  onLogout?: () => void;
  onRoleSwitch?: (role: any) => void;
  onOpenAi?: () => void;
}

export const SellerMoreScreen: React.FC<SellerMoreScreenProps> = ({
  onNavigateTab,
  onLogout,
  onRoleSwitch,
  onOpenAi,
}) => {
  const [activeBiz, setActiveBiz] = useState<Business | null>(activeBusinessService.getActiveBusiness());
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);

  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const list = await businessService.getMyBusinesses();
        setAllBusinesses(list || []);
      } catch (err) {
        if (__DEV__) console.warn('[SellerMoreScreen] Error:', err);
      }
    };

    loadBusinesses();
    const unsub = activeBusinessService.subscribe((biz) => {
      setActiveBiz(biz);
    });
    return unsub;
  }, []);

  const handleSwitchStore = (biz: Business) => {
    activeBusinessService.setActiveBusiness(biz);
    Alert.alert('Store Switched', `Active store changed to ${biz.name}`);
  };

  const handleLogout = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out of your ECOSPHERE account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: () => onLogout && onLogout(),
      },
    ]);
  };

  const handleSwitchCustomer = async () => {
    try {
      await authService.switchMode('customer').catch((err: any) => {
        if (__DEV__) console.warn('[SellerMoreScreen] Backend switchMode notice:', err);
      });
      if (onRoleSwitch) {
        onRoleSwitch('customer');
      } else {
        onNavigateTab('Home');
      }
    } catch (err: any) {
      if (__DEV__) console.warn('[SellerMoreScreen] Switch customer error:', err);
      if (onRoleSwitch) {
        onRoleSwitch('customer');
      } else {
        onNavigateTab('Home');
      }
    }
  };

  const handleSwitchToSellerPortal = () => {
    if (onRoleSwitch) {
      onRoleSwitch('seller');
    }
    onNavigateTab('SellerDashboard');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Seller Portal Menu</Text>
        <Text style={styles.headerSubtitle}>Manage your local commercial operations</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Store Profile Identity Card */}
        <TouchableOpacity
          style={styles.profileCard}
          onPress={() => onNavigateTab('SellerBusinessProfile')}
          activeOpacity={0.8}
        >
          <View style={styles.avatarWrapper}>
            {activeBiz?.logoUrl ? (
              <Image source={{ uri: activeBiz.logoUrl }} style={styles.avatarImg} resizeMode="cover" />
            ) : (
              <Image
                source={require('../../../assets/images/seller/businesses/business-logo-default.png')}
                style={styles.avatarImg}
                resizeMode="cover"
              />
            )}
          </View>

          <View style={styles.profileMeta}>
            <View style={styles.storeNameRow}>
              <Text style={styles.storeName} numberOfLines={1}>
                {activeBiz?.name || 'Local Store Enterprise'}
              </Text>
              <ShieldCheck size={16} color="#16A34A" />
            </View>
            <View style={styles.locationRow}>
              <MapPin size={12} color={Theme.colors.secondaryText} />
              <Text style={styles.storeLocation}>
                {activeBiz?.city || 'Chiplun, Maharashtra'} • Verified Merchant
              </Text>
            </View>
          </View>

          <ChevronRight size={18} color="#94A3B8" />
        </TouchableOpacity>

        {/* Multi-Store Switcher (If seller has more than 1 store) */}
        {allBusinesses.length > 1 && (
          <View style={styles.switcherCard}>
            <Text style={styles.switcherLabel}>Switch Active Store:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.switcherScroll}>
              {allBusinesses.map((b) => (
                <TouchableOpacity
                  key={b.id}
                  style={[styles.switchChip, activeBiz?.id === b.id && styles.switchChipActive]}
                  onPress={() => handleSwitchStore(b)}
                  activeOpacity={0.7}
                >
                  <Store size={13} color={activeBiz?.id === b.id ? Theme.colors.forestGreen : Theme.colors.secondaryText} />
                  <Text style={[styles.switchChipText, activeBiz?.id === b.id && styles.switchChipTextActive]}>
                    {b.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Switch to Customer Mode Primary Button (Requirement 1) */}
        <TouchableOpacity
          style={styles.switchCustomerCardBtn}
          onPress={handleSwitchCustomer}
          activeOpacity={0.82}
          accessibilityLabel="Switch to Customer"
        >
          <View style={styles.switchCustomerLeft}>
            <View style={styles.switchCustomerIconBox}>
              <UserCheck size={22} color={Theme.colors.forestGreen} />
            </View>
            <View style={styles.switchCustomerTextCol}>
              <Text style={styles.switchCustomerTitle}>Switch to Customer</Text>
              <Text style={styles.switchCustomerSubtitle}>
                Browse local marketplace & services as a shopper
              </Text>
            </View>
          </View>
          <View style={styles.switchCustomerArrowWrap}>
            <ChevronRight size={18} color={Theme.colors.emerald} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        {/* Switch to Seller Portal Action Button */}
        <TouchableOpacity
          style={styles.switchPortalBtn}
          onPress={handleSwitchToSellerPortal}
          activeOpacity={0.82}
          accessibilityLabel="Switch to Seller Portal"
        >
          <View style={styles.switchPortalLeft}>
            <View style={styles.switchPortalIconBox}>
              <Store size={22} color={Theme.colors.forestGreen} />
            </View>
            <View style={styles.switchPortalTextCol}>
              <Text style={styles.switchPortalTitle}>Switch to Seller Portal</Text>
              <Text style={styles.switchPortalSubtitle}>
                Open main merchant dashboard & live operations
              </Text>
            </View>
          </View>
          <View style={styles.switchPortalArrowWrap}>
            <ChevronRight size={18} color={Theme.colors.emerald} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        {/* Primary Operational Sections */}
        <View style={styles.menuGroup}>
          <Text style={styles.menuGroupTitle}>Core Operations</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigateTab('SellerProducts')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#EAF7EE' }]}>
              <Package size={18} color={Theme.colors.forestGreen} />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Product Catalog</Text>
              <Text style={styles.rowSub}>Inventory, prices, stock levels</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigateTab('SellerOrders')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <ShoppingBag size={18} color="#2563EB" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Order Processing</Text>
              <Text style={styles.rowSub}>Incoming orders, dispatch status, invoices</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigateTab('SellerAnalytics')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FEF9C3' }]}>
              <BarChart3 size={18} color="#D97706" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Store Analytics</Text>
              <Text style={styles.rowSub}>Revenue trends, top selling items, metrics</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigateTab('SellerCustomers')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FDF2F8' }]}>
              <Users size={18} color="#DB2777" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Customer Directory</Text>
              <Text style={styles.rowSub}>Local repeat buyers, contact details</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Growth & Marketing */}
        <View style={styles.menuGroup}>
          <Text style={styles.menuGroupTitle}>Growth & Marketing</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigateTab('SellerPromotions')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#EAF7EE' }]}>
              <Tag size={18} color={Theme.colors.forestGreen} />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Promotions & Coupons</Text>
              <Text style={styles.rowSub}>Flash sales, discount codes, banners</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => {
              if (onOpenAi) onOpenAi();
              else onNavigateTab('AiScreen');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#EEE8FF' }]}>
              <Sparkles size={18} color="#7C3AED" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>ECOSPHERE AI Advisor</Text>
              <Text style={styles.rowSub}>Price recommendations, inventory insights</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Settings & Mode Switching */}
        <View style={styles.menuGroup}>
          <Text style={styles.menuGroupTitle}>Settings & Preferences</Text>

          <TouchableOpacity
            style={styles.menuRow}
            onPress={() => onNavigateTab('SellerSettings')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F1F5F0' }]}>
              <Settings size={18} color={Theme.colors.primaryText} />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Store Settings</Text>
              <Text style={styles.rowSub}>Business hours, bank account, alerts</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          {onRoleSwitch && (
            <TouchableOpacity
              style={styles.menuRow}
              onPress={handleSwitchCustomer}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#EAF7EE' }]}>
                <UserCheck size={18} color={Theme.colors.forestGreen} />
              </View>
              <View style={styles.rowTextCol}>
                <Text style={styles.rowTitle}>Switch to Customer Mode</Text>
                <Text style={styles.rowSub}>Explore and shop locally</Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.menuRow, { borderBottomWidth: 0 }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
              <LogOut size={18} color="#DC2626" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={[styles.rowTitle, { color: '#DC2626' }]}>Log Out</Text>
              <Text style={styles.rowSub}>Sign out of merchant session</Text>
            </View>
            <ChevronRight size={16} color="#DC2626" />
          </TouchableOpacity>
        </View>

        {/* Footer info */}
        <View style={styles.footerInfo}>
          <Text style={styles.footerBrand}>ECOSPHERE • Operating System for Local Economies</Text>
          <Text style={styles.footerBuild}>Seller Portal Edition • v2.4.0</Text>
        </View>

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
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : 14,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBE3',
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
  scrollContent: {
    padding: 16,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 16,
    marginBottom: 16,
    shadowColor: '#17231B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  avatarWrapper: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#EAF7EE',
    marginRight: 12,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  profileMeta: {
    flex: 1,
  },
  storeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  storeLocation: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
  },
  switcherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 12,
    marginBottom: 16,
  },
  switcherLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
    marginBottom: 8,
  },
  switcherScroll: {
    flexDirection: 'row',
  },
  switchChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
    gap: 6,
  },
  switchChipActive: {
    backgroundColor: '#EAF7EE',
    borderWidth: 1,
    borderColor: Theme.colors.emerald,
  },
  switchChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: Theme.colors.secondaryText,
  },
  switchChipTextActive: {
    color: Theme.colors.forestGreen,
    fontWeight: '700',
  },
  switchCustomerCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    padding: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  switchCustomerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchCustomerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EAF7EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchCustomerTextCol: {
    flex: 1,
  },
  switchCustomerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
    fontFamily: Theme.typography.fontFamily,
  },
  switchCustomerSubtitle: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.bodyFont,
    marginTop: 2,
  },
  switchCustomerArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  switchPortalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DCFCE7',
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#16A34A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  switchPortalLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  switchPortalIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#EAF7EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchPortalTextCol: {
    flex: 1,
  },
  switchPortalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
    fontFamily: Theme.typography.fontFamily,
  },
  switchPortalSubtitle: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.bodyFont,
    marginTop: 2,
  },
  switchPortalArrowWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    shadowColor: '#17231B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  menuGroupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F0',
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowTextCol: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primaryText,
  },
  rowSub: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  footerInfo: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  footerBrand: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
  },
  footerBuild: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
});
