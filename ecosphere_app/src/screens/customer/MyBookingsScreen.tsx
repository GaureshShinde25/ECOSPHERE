import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building,
  DollarSign,
} from 'lucide-react-native';
import { Booking } from '../../types';
import { GlassCard } from '../../components/cards/GlassCard';
import { bookingService } from '../../services/bookingService';
import { Theme } from '../../theme';

interface MyBookingsScreenProps {
  onBack?: () => void;
  onSelectBooking?: (bookingId: string) => void;
}

export const MyBookingsScreen: React.FC<MyBookingsScreenProps> = ({ onBack, onSelectBooking }) => {
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'COMPLETED' | 'CANCELLED'>('UPCOMING');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setError(null);
      const data = await bookingService.getMyBookings();
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchBookings();
  };

  // Filter Bookings by Active Tab
  const filteredBookings = bookings.filter((b) => {
    const st = (b.status || 'CONFIRMED').toUpperCase();
    if (activeTab === 'UPCOMING') {
      return st === 'CONFIRMED' || st === 'PENDING' || st === 'STARTED';
    }
    if (activeTab === 'COMPLETED') {
      return st === 'COMPLETED';
    }
    if (activeTab === 'CANCELLED') {
      return st === 'CANCELLED';
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
              <ArrowLeft size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>My Bookings</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab Filter Navigation */}
        <View style={styles.tabContainer}>
          {[
            { key: 'UPCOMING', label: 'Upcoming' },
            { key: 'COMPLETED', label: 'Completed' },
            { key: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActiveTab(tab.key as any)}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Content Area */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Theme.colors.primary}
            />
          }
        >
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
              <Text style={styles.loadingText}>Loading live bookings from network...</Text>
            </View>
          ) : error ? (
            <GlassCard style={styles.errorCard}>
              <AlertCircle size={32} color="#EF4444" style={{ alignSelf: 'center', marginBottom: 8 }} />
              <Text style={styles.errorTitle}>Connection Error</Text>
              <Text style={styles.errorMsg}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={fetchBookings}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </GlassCard>
          ) : filteredBookings.length === 0 ? (
            <GlassCard style={styles.emptyCard}>
              <Calendar size={40} color={Theme.colors.secondaryText} style={{ alignSelf: 'center', marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} bookings</Text>
              <Text style={styles.emptySub}>
                {activeTab === 'UPCOMING'
                  ? 'You have no scheduled upcoming service appointments.'
                  : `You have no ${activeTab.toLowerCase()} booking records.`}
              </Text>
            </GlassCard>
          ) : (
            filteredBookings.map((b) => {
              const statusStr = (b.status || 'CONFIRMED').toUpperCase();
              const isCancelled = statusStr === 'CANCELLED';
              const isCompleted = statusStr === 'COMPLETED';

              return (
                <GlassCard key={b.id || b.bookingNumber} style={styles.bookingCard}>
                  <View style={styles.cardHeaderRow}>
                    <View style={styles.titleBox}>
                      <Text style={styles.serviceTitle}>{b.serviceTitle || 'Professional Service'}</Text>
                      <View style={styles.bizRow}>
                        <Building size={12} color={Theme.colors.primary} />
                        <Text style={styles.bizName}>{b.businessName || 'ECOSPHERE Provider'}</Text>
                      </View>
                    </View>

                    {/* Status Badge */}
                    <View
                      style={[
                        styles.statusBadge,
                        isCancelled
                          ? styles.badgeCancelled
                          : isCompleted
                          ? styles.badgeCompleted
                          : styles.badgeConfirmed,
                      ]}
                    >
                      {isCancelled ? (
                        <XCircle size={10} color="#EF4444" />
                      ) : (
                        <CheckCircle2 size={10} color={isCompleted ? Theme.colors.accentGreen : Theme.colors.primary} />
                      )}
                      <Text
                        style={[
                          styles.statusText,
                          isCancelled
                            ? styles.statusTextCancelled
                            : isCompleted
                            ? styles.statusTextCompleted
                            : styles.statusTextConfirmed,
                        ]}
                      >
                        {statusStr}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.detailsRow}>
                    <View style={styles.detailItem}>
                      <Calendar size={13} color={Theme.colors.primary} />
                      <Text style={styles.detailText}>
                        {b.bookingDate || (b.date ? b.date.split('T')[0] : '2026-09-10')}
                      </Text>
                    </View>

                    <View style={styles.detailItem}>
                      <Clock size={13} color={Theme.colors.accentPurple} />
                      <Text style={styles.detailText}>{b.startTime || b.time || '10:00 AM'}</Text>
                    </View>

                    <View style={styles.detailItem}>
                      <DollarSign size={13} color={Theme.colors.accentGreen} />
                      <Text style={styles.detailText}>₹{(b.amount || b.price || 0).toLocaleString('en-IN')}</Text>
                    </View>
                  </View>

                  {b.customerAddress ? (
                    <View style={styles.addressRow}>
                      <MapPin size={12} color={Theme.colors.secondaryText} />
                      <Text style={styles.addressText} numberOfLines={1}>
                        {b.customerAddress}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.cardFooter}>
                    <Text style={styles.bookingIdText}>
                      ID: {b.bookingNumber || `#BK-${b.id}`}
                    </Text>

                    <TouchableOpacity
                      style={styles.detailsBtn}
                      activeOpacity={0.8}
                      onPress={() => onSelectBooking && onSelectBooking(b.id)}
                    >
                      <Text style={styles.detailsBtnText}>View Details</Text>
                      <ChevronRight size={14} color={Theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              );
            })
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#0D1828',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(47, 214, 255, 0.15)',
    borderColor: Theme.colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 10,
  },
  errorCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
  },
  errorMsg: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 4,
    marginBottom: 14,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#07111F',
  },
  emptyCard: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  emptySub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
  bookingCard: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleBox: {
    flex: 1,
    marginRight: 10,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  bizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  bizName: {
    fontSize: 12,
    color: Theme.colors.primary,
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  badgeConfirmed: {
    backgroundColor: 'rgba(47, 214, 255, 0.15)',
  },
  badgeCompleted: {
    backgroundColor: 'rgba(37, 230, 138, 0.15)',
  },
  badgeCancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  statusTextConfirmed: {
    color: Theme.colors.primary,
  },
  statusTextCompleted: {
    color: Theme.colors.accentGreen,
  },
  statusTextCancelled: {
    color: '#EF4444',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#CBD5E1',
    marginLeft: 6,
    fontWeight: '600',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  addressText: {
    fontSize: 12,
    color: '#94A3B8',
    marginLeft: 6,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
  },
  bookingIdText: {
    fontSize: 11,
    color: '#64748B',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primary,
    marginRight: 2,
  },
});
