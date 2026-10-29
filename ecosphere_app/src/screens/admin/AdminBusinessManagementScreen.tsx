import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { Store, ShieldCheck, CheckCircle2, XCircle, FileText } from 'lucide-react-native';
import { Business } from '../../types';
import { GlassCard } from '../../components/cards/GlassCard';
import { businessService } from '../../services/businessService';
import { Theme } from '../../theme';

export const AdminBusinessManagementScreen: React.FC = () => {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeTab, setActiveTab] = useState<'verified' | 'pending'>('verified');

  useEffect(() => {
    businessService.getBusinesses({ limit: 50 }).then((data) => {
      setBusinesses(data || []);
    });
  }, []);

  const toggleVerifyBusiness = (bizId: string) => {
    setBusinesses((prev) =>
      prev.map((b) => {
        if (b.id === bizId) {
          return { ...b, verified: !b.verified };
        }
        return b;
      })
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.topHeader}>
            <Text style={styles.pageTitle}>Business Registry & Moderation</Text>
            <Text style={styles.pageSub}>Verify local businesses, audit health, and manage listings</Text>
          </View>

          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'verified' && styles.tabBtnActive]}
              onPress={() => setActiveTab('verified')}
            >
              <ShieldCheck size={16} color={activeTab === 'verified' ? Theme.colors.primary : Theme.colors.secondaryText} />
              <Text style={[styles.tabText, activeTab === 'verified' && styles.tabTextActive]}>Registered ({businesses.length})</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'pending' && styles.tabBtnActive]}
              onPress={() => setActiveTab('pending')}
            >
              <FileText size={16} color={activeTab === 'pending' ? Theme.colors.primary : Theme.colors.secondaryText} />
              <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>Pending Verification</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.listContainer}>
            {businesses.map((biz) => (
              <GlassCard key={biz.id} style={styles.card}>
                <View style={styles.bizRow}>
                  <Image source={{ uri: biz.logoUrl }} style={styles.logo} />

                  <View style={styles.bizInfo}>
                    <View style={styles.titleRow}>
                      <Text style={styles.bizName}>{biz.name}</Text>
                      {biz.verified && <CheckCircle2 size={16} color={Theme.colors.success} />}
                    </View>
                    <Text style={styles.category}>{biz.category}</Text>
                    <Text style={styles.address}>📍 {biz.address}</Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.healthText}>Node Health Score: <Text style={styles.healthVal}>{biz.healthScore}/100</Text></Text>

                  <TouchableOpacity
                    onPress={() => toggleVerifyBusiness(biz.id)}
                    style={styles.verifyBtn}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.verifyBtnText}>
                      {biz.verified ? 'Revoke Badge' : 'Approve & Verify'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </GlassCard>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111F',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  topHeader: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  pageSub: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(13, 24, 40, 0.65)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(47, 214, 255, 0.12)',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  tabTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  listContainer: {
    gap: 12,
  },
  card: {
    padding: 16,
  },
  bizRow: {
    flexDirection: 'row',
    gap: 12,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
  },
  bizInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bizName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  category: {
    fontSize: 12,
    color: Theme.colors.primary,
    marginTop: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  address: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  healthText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  healthVal: {
    fontWeight: '800',
    color: Theme.colors.success,
  },
  verifyBtn: {
    backgroundColor: 'rgba(47, 214, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifyBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
});
