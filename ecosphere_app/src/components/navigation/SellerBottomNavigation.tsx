import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { LayoutDashboard, Package, ClipboardList, BarChart3, Menu } from 'lucide-react-native';
import { Theme } from '../../theme';

interface SellerBottomNavigationProps {
  currentTab: string;
  onSelectTab: (tabName: string) => void;
  onOpenAi?: () => void;
}

export const SellerBottomNavigation: React.FC<SellerBottomNavigationProps> = ({
  currentTab,
  onSelectTab,
}) => {
  const tabs = [
    { key: 'SellerDashboard', label: 'Home', icon: LayoutDashboard },
    { key: 'SellerProducts', label: 'Products', icon: Package },
    { key: 'SellerOrders', label: 'Orders', icon: ClipboardList },
    { key: 'SellerAnalytics', label: 'Analytics', icon: BarChart3 },
    { key: 'SellerMore', label: 'More', icon: Menu },
  ];

  return (
    <View style={styles.navbarWrapper}>
      <View style={styles.navbar}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.navItem}
              onPress={() => onSelectTab(tab.key)}
              activeOpacity={0.7}
            >
              <Icon
                size={22}
                color={isActive ? Theme.colors.emerald : Theme.colors.secondaryText}
                strokeWidth={isActive ? 2.3 : 1.8}
              />
              <Text
                style={[
                  styles.navText,
                  isActive ? styles.navTextActive : styles.navTextInactive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navbarWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 16,
    right: 16,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EBE3',
    paddingVertical: 8,
    paddingHorizontal: 6,
    shadowColor: '#17231B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  navbar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 52,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 4,
  },
  navText: {
    fontSize: 11,
    marginTop: 3,
    fontFamily: Theme.typography.fontFamily,
  },
  navTextActive: {
    color: Theme.colors.emerald,
    fontWeight: '700',
  },
  navTextInactive: {
    color: '#68756B',
    fontWeight: '500',
  },
});
