import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import {
  Store,
  Clock,
  Truck,
  CreditCard,
  Bell,
  Shield,
  FileText,
  HelpCircle,
  LogOut,
  ChevronRight,
  ArrowLeft,
  UserCheck,
  Smartphone,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import { activeBusinessService } from '../../services/activeBusinessService';

interface SellerSettingsScreenProps {
  onBack?: () => void;
  onNavigateTab?: (tab: string, params?: any) => void;
  onLogout?: () => void;
  onRoleSwitch?: (role: any) => void;
}

export const SellerSettingsScreen: React.FC<SellerSettingsScreenProps> = ({
  onBack,
  onNavigateTab,
  onLogout,
  onRoleSwitch,
}) => {
  const activeBiz = activeBusinessService.getActiveBusiness();
  const [orderAlerts, setOrderAlerts] = useState<boolean>(true);
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);
  const [autoAcceptOrders, setAutoAcceptOrders] = useState<boolean>(false);

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of your ECOSPHERE seller account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => onLogout && onLogout(),
        },
      ]
    );
  };

  const handleSwitchToCustomer = () => {
    Alert.alert(
      'Switch to Customer Mode',
      'You can switch back to Seller mode anytime from your profile.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Switch Mode',
          onPress: () => onRoleSwitch && onRoleSwitch('customer'),
        },
      ]
    );
  };

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
            <Text style={styles.headerTitle}>Store Settings</Text>
            <Text style={styles.headerSubtitle}>
              {activeBiz?.name || 'Local Store'} • Operational Preferences
            </Text>
          </View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Store Management Group */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupHeading}>Store Profile & Operations</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => onNavigateTab?.('SellerBusinessProfile')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#EAF7EE' }]}>
              <Store size={18} color={Theme.colors.forestGreen} />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Store Profile & Branding</Text>
              <Text style={styles.rowSub}>Name, logo, cover photo, category</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => onNavigateTab?.('SellerBusinessProfile')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
              <Clock size={18} color="#D97706" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Business Hours & Slots</Text>
              <Text style={styles.rowSub}>Opening times, weekly off days</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => onNavigateTab?.('SellerProducts')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <Truck size={18} color="#2563EB" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Inventory & Stock Thresholds</Text>
              <Text style={styles.rowSub}>Low stock alerts, out of stock behavior</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Orders & Payments Group */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupHeading}>Orders & Payments</Text>

          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: '#EAF7EE' }]}>
              <Bell size={18} color={Theme.colors.forestGreen} />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Instant Order Notifications</Text>
              <Text style={styles.rowSub}>Receive push alerts for incoming customer orders</Text>
            </View>
            <Switch
              value={orderAlerts}
              onValueChange={setOrderAlerts}
              trackColor={{ false: '#CBD5E1', true: '#DCFCE7' }}
              thumbColor={orderAlerts ? '#16A34A' : '#94A3B8'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: '#FDF2F8' }]}>
              <Smartphone size={18} color="#DB2777" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Loud Ringtone for Orders</Text>
              <Text style={styles.rowSub}>High priority chime for new orders</Text>
            </View>
            <Switch
              value={soundAlerts}
              onValueChange={setSoundAlerts}
              trackColor={{ false: '#CBD5E1', true: '#DCFCE7' }}
              thumbColor={soundAlerts ? '#16A34A' : '#94A3B8'}
            />
          </View>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Alert.alert('Bank Payouts', 'Bank account ending in 4092 is active and verified for next-day settlements.')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FEF9C3' }]}>
              <CreditCard size={18} color="#D97706" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Bank Account & Payouts</Text>
              <Text style={styles.rowSub}>HDFC Bank • Daily automatic settlement</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Policies & Support */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupHeading}>Policies & Support</Text>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Alert.alert('Return Policy', 'Standard local return policy: 24 hours for fresh goods, 3 days for packaged items.')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F1F5F0' }]}>
              <FileText size={18} color={Theme.colors.primaryText} />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Store Return & Refund Policy</Text>
              <Text style={styles.rowSub}>Terms displayed to local buyers</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => Alert.alert('ECOSPHERE Support', 'Need assistance? Reach our Merchant Care Team at seller-support@ecosphere.local')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#F1F5F0' }]}>
              <HelpCircle size={18} color={Theme.colors.primaryText} />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={styles.rowTitle}>Merchant Support & Help Center</Text>
              <Text style={styles.rowSub}>24/7 dedicated merchant assistance</Text>
            </View>
            <ChevronRight size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Role & Account Actions */}
        <View style={styles.settingsGroup}>
          <Text style={styles.groupHeading}>Account & Session</Text>

          {onRoleSwitch && (
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleSwitchToCustomer}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: '#EAF7EE' }]}>
                <UserCheck size={18} color={Theme.colors.forestGreen} />
              </View>
              <View style={styles.rowTextCol}>
                <Text style={styles.rowTitle}>Switch to Customer Mode</Text>
                <Text style={styles.rowSub}>Browse local businesses as a buyer</Text>
              </View>
              <ChevronRight size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.settingRow, { borderBottomWidth: 0 }]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
              <LogOut size={18} color="#DC2626" />
            </View>
            <View style={styles.rowTextCol}>
              <Text style={[styles.rowTitle, { color: '#DC2626' }]}>Log Out of Seller Account</Text>
              <Text style={styles.rowSub}>End session on this device</Text>
            </View>
            <ChevronRight size={16} color="#DC2626" />
          </TouchableOpacity>
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
  scrollContent: {
    padding: 16,
  },
  settingsGroup: {
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
  groupHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingRow: {
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
});
