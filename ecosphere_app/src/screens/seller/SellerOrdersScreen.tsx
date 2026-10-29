import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  Search,
  ShoppingBag,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  ChevronRight,
  Phone,
  MapPin,
  ArrowRight,
  Filter,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import { orderService } from '../../services/orderService';
import { activeBusinessService } from '../../services/activeBusinessService';
import { Order, Business } from '../../types';

interface SellerOrdersScreenProps {
  onNavigateTab?: (tab: string, params?: any) => void;
  onBack?: () => void;
}

type OrderStatusFilter = 'ALL' | 'PENDING' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED';

export const SellerOrdersScreen: React.FC<SellerOrdersScreenProps> = ({
  onNavigateTab,
  onBack,
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('ALL');
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      const biz = activeBusinessService.getActiveBusiness();
      setActiveBusiness(biz);
      const data = await orderService.getSellerOrders(biz?.id);
      setOrders(data || []);
    } catch (err) {
      if (__DEV__) console.warn('[SellerOrdersScreen] Failed to load orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
    const unsub = activeBusinessService.subscribe((biz) => {
      setActiveBusiness(biz);
      loadOrders();
    });
    return unsub;
  }, [loadOrders]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: string) => {
    try {
      setUpdatingId(orderId);
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, orderStatus: nextStatus } : o))
      );
      await orderService.updateOrderStatus(orderId, nextStatus);
    } catch (err) {
      Alert.alert('Status Update Failed', 'Could not update order status. Please retry.');
      loadOrders();
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || '').toUpperCase();
    if (s === 'PENDING') {
      return { bg: '#FEF3C7', text: '#B45309', label: 'Pending' };
    }
    if (s === 'PREPARING' || s === 'CONFIRMED') {
      return { bg: '#DBEAFE', text: '#1D4ED8', label: 'Preparing' };
    }
    if (s === 'READY' || s === 'OUT_FOR_DELIVERY') {
      return { bg: '#EEE8FF', text: '#6D28D9', label: 'Out for Delivery' };
    }
    if (s === 'DELIVERED' || s === 'COMPLETED') {
      return { bg: '#DCFCE7', text: '#15803D', label: 'Delivered' };
    }
    if (s === 'CANCELLED') {
      return { bg: '#FEE2E2', text: '#B91C1C', label: 'Cancelled' };
    }
    return { bg: '#F1F5F0', text: '#68756B', label: status || 'Received' };
  };

  // Filter & Search
  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !searchQuery ||
      (order.orderNumber || '').toLowerCase().includes(q) ||
      (order.id || '').toLowerCase().includes(q) ||
      (order.customerName || (order as any).user?.fullName || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    const s = (order.orderStatus || '').toUpperCase();
    if (statusFilter === 'PENDING') return s === 'PENDING';
    if (statusFilter === 'PREPARING') return s === 'PREPARING' || s === 'CONFIRMED';
    if (statusFilter === 'OUT_FOR_DELIVERY') return s === 'OUT_FOR_DELIVERY' || s === 'READY';
    if (statusFilter === 'DELIVERED') return s === 'DELIVERED' || s === 'COMPLETED';
    return true;
  });

  const pendingCount = orders.filter((o) => (o.orderStatus || '').toUpperCase() === 'PENDING').length;
  const preparingCount = orders.filter((o) => ['PREPARING', 'CONFIRMED'].includes((o.orderStatus || '').toUpperCase())).length;
  const deliveryCount = orders.filter((o) => ['OUT_FOR_DELIVERY', 'READY'].includes((o.orderStatus || '').toUpperCase())).length;
  const deliveredCount = orders.filter((o) => ['DELIVERED', 'COMPLETED'].includes((o.orderStatus || '').toUpperCase())).length;

  const renderOrderItem = ({ item }: { item: Order }) => {
    const badge = getStatusBadge(item.orderStatus);
    const s = (item.orderStatus || '').toUpperCase();
    const isUpdating = updatingId === item.id;
    const customer = item.customerName || (item as any).user?.fullName || 'Local Customer';

    return (
      <View style={styles.orderCard}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.orderNumber}>#{item.orderNumber || item.id.slice(0, 8)}</Text>
            <Text style={styles.orderDate}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : 'Recent order'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Customer & Address Details */}
        <View style={styles.customerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{customer}</Text>
            <View style={styles.addressLine}>
              <MapPin size={12} color={Theme.colors.secondaryText} />
              <Text style={styles.addressText} numberOfLines={1}>
                {item.shippingAddress || item.shippingCity || 'Chiplun Delivery'}
              </Text>
            </View>
          </View>

          {item.customerPhone ? (
            <TouchableOpacity style={styles.callButton} activeOpacity={0.7}>
              <Phone size={15} color={Theme.colors.forestGreen} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Items Summary */}
        <View style={styles.itemsBox}>
          {item.items && item.items.length > 0 ? (
            item.items.map((it, idx) => (
              <View key={idx} style={styles.itemLine}>
                <Text style={styles.itemQuantity}>{it.quantity}x</Text>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {it.product?.title || it.productName || 'Order item'}
                </Text>
                <Text style={styles.itemPrice}>₹{it.price || it.unitPrice || 0}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.genericItemsText}>Standard order package</Text>
          )}
        </View>

        {/* Amount & Fast Action row */}
        <View style={styles.cardFooter}>
          <View>
            <Text style={styles.totalLabel}>Total Bill</Text>
            <Text style={styles.totalAmount}>₹{(item.totalAmount || 0).toLocaleString()}</Text>
          </View>

          {/* Quick Lifecycle Action Button */}
          <View style={styles.actionButtonGroup}>
            {s === 'PENDING' && (
              <TouchableOpacity
                style={[styles.primaryActionBtn, isUpdating && styles.btnDisabled]}
                onPress={() => handleUpdateStatus(item.id, 'PREPARING')}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <CheckCircle size={14} color="#FFFFFF" />
                    <Text style={styles.primaryActionBtnText}>Accept Order</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {(s === 'PREPARING' || s === 'CONFIRMED') && (
              <TouchableOpacity
                style={[styles.primaryActionBtn, isUpdating && styles.btnDisabled]}
                onPress={() => handleUpdateStatus(item.id, 'OUT_FOR_DELIVERY')}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Truck size={14} color="#FFFFFF" />
                    <Text style={styles.primaryActionBtnText}>Dispatch</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {(s === 'OUT_FOR_DELIVERY' || s === 'READY') && (
              <TouchableOpacity
                style={[styles.primaryActionBtn, isUpdating && styles.btnDisabled]}
                onPress={() => handleUpdateStatus(item.id, 'DELIVERED')}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <CheckCircle size={14} color="#FFFFFF" />
                    <Text style={styles.primaryActionBtnText}>Mark Delivered</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.detailsBtn}
              onPress={() => onNavigateTab?.('SellerOrderDetails', { orderId: item.id, order: item })}
              activeOpacity={0.7}
            >
              <Text style={styles.detailsBtnText}>Details</Text>
              <ChevronRight size={14} color={Theme.colors.forestGreen} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Orders Management</Text>
          <Text style={styles.headerSubtitle}>
            {activeBusiness?.name || 'My Store'} • {orders.length} Total Orders
          </Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Search size={18} color={Theme.colors.secondaryText} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by order # or customer..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Status Filter Tabs */}
      <View style={styles.filterTabsRow}>
        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'ALL' && styles.filterChipActive]}
          onPress={() => setStatusFilter('ALL')}
        >
          <Text style={[styles.filterChipText, statusFilter === 'ALL' && styles.filterChipTextActive]}>
            All ({orders.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'PENDING' && styles.filterChipActive]}
          onPress={() => setStatusFilter('PENDING')}
        >
          <Text style={[styles.filterChipText, statusFilter === 'PENDING' && styles.filterChipTextActive]}>
            Pending ({pendingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'PREPARING' && styles.filterChipActive]}
          onPress={() => setStatusFilter('PREPARING')}
        >
          <Text style={[styles.filterChipText, statusFilter === 'PREPARING' && styles.filterChipTextActive]}>
            Preparing ({preparingCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'OUT_FOR_DELIVERY' && styles.filterChipActive]}
          onPress={() => setStatusFilter('OUT_FOR_DELIVERY')}
        >
          <Text
            style={[
              styles.filterChipText,
              statusFilter === 'OUT_FOR_DELIVERY' && styles.filterChipTextActive,
            ]}
          >
            Dispatched ({deliveryCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, statusFilter === 'DELIVERED' && styles.filterChipActive]}
          onPress={() => setStatusFilter('DELIVERED')}
        >
          <Text style={[styles.filterChipText, statusFilter === 'DELIVERED' && styles.filterChipTextActive]}>
            Delivered ({deliveredCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Theme.colors.emerald} />
          <Text style={styles.loadingText}>Fetching store orders...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Theme.colors.emerald]} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <ShoppingBag size={38} color={Theme.colors.emerald} />
              </View>
              <Text style={styles.emptyTitle}>
                {searchQuery ? 'No matching orders' : 'No orders in this status'}
              </Text>
              <Text style={styles.emptyDesc}>
                {searchQuery
                  ? 'Check your search query or reset filters.'
                  : 'As customers order items from your catalog, they will arrive here.'}
              </Text>
            </View>
          }
        />
      )}
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
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  filterTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBE3',
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F0',
  },
  filterChipActive: {
    backgroundColor: '#EAF7EE',
    borderWidth: 1,
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
  listContent: {
    padding: 16,
    paddingBottom: 110,
  },
  orderCard: {
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
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  orderDate: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F0',
    marginVertical: 12,
  },
  customerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.primaryText,
  },
  addressLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  addressText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
  },
  callButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EAF7EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemsBox: {
    backgroundColor: '#F8FAF7',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  itemLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.forestGreen,
    width: 24,
  },
  itemTitle: {
    flex: 1,
    fontSize: 12,
    color: Theme.colors.primaryText,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.primaryText,
  },
  genericItemsText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontStyle: 'italic',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: Theme.colors.secondaryText,
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
  },
  actionButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.emerald,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
  },
  primaryActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 2,
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Theme.colors.forestGreen,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Theme.colors.secondaryText,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#EAF7EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    lineHeight: 18,
  },
});
