import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { LayoutGrid, Users, ShieldAlert, BarChart3, Map, Settings } from 'lucide-react-native';
import { Theme } from '../../theme';

interface AdminNavigationProps {
  currentTab: string;
  onSelectTab: (tabName: string) => void;
}

export const AdminNavigation: React.FC<AdminNavigationProps> = ({ currentTab, onSelectTab }) => {
  const navItems = [
    { id: 'AdminOverview', label: 'Overview', icon: LayoutGrid },
    { id: 'AdminUsers', label: 'Users', icon: Users },
    { id: 'AdminBusinesses', label: 'Businesses', icon: Map },
    { id: 'AdminModeration', label: 'Moderation', icon: ShieldAlert },
    { id: 'AdminAnalytics', label: 'Analytics', icon: BarChart3 },
    { id: 'AdminSettings', label: 'Settings', icon: Settings },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topTelemetryRow}>
        <View style={styles.statusIndicator}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>ECOSYSTEM NODE HINJEWADI</Text>
        </View>
        <Text style={styles.adminBadge}>ADMINISTRATOR CONTROL</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.navBarScroll}
      >
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id;

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.navChip, isActive && styles.navChipActive]}
              onPress={() => onSelectTab(item.id)}
              activeOpacity={0.7}
            >
              <IconComponent
                size={14}
                color={isActive ? '#07111F' : Theme.colors.secondaryText}
              />
              <Text style={[styles.navChipText, isActive && styles.navChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0D1828',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 10,
    paddingBottom: 10,
  },
  topTelemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Theme.colors.success,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.secondaryText,
    letterSpacing: 0.8,
    fontFamily: Theme.typography.fontFamily,
  },
  adminBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.primary,
    backgroundColor: 'rgba(47, 214, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.8,
    fontFamily: Theme.typography.fontFamily,
  },
  navBarScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  navChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  navChipActive: {
    backgroundColor: Theme.colors.primary,
    borderColor: Theme.colors.primary,
  },
  navChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  navChipTextActive: {
    color: '#07111F',
    fontWeight: '700',
  },
});
