import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Truck,
  Package,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  AlertCircle,
  XCircle,
} from 'lucide-react-native';
import { Theme } from '../../theme';
import { orderService } from '../../services/orderService';
import { Order } from '../../types';

interface SellerOrderDetailsScreenProps {
  orderId?: string;
  order?: Order;
  onBack: () => void;
  onStatusUpdated?: () => void;
}

export const SellerOrderDetailsScreen: React.FC<SellerOrderDetailsScreenProps> = ({
  orderId,
  order: initialOrder,
  onBack,
  onStatusUpdated,
}) => {
  const [order, setOrder] = useState<Order | undefined>(initialOrder);
  const [loading, setLoading] = useState<boolean>(!initialOrder);
  const [updating, setUpdating] = useState<boolean>(false);

  useEffect(() => {
    const fetchOrder = async () => {
      const id = orderId || initialOrder?.id;
      if (!id) return;
      try {
        setLoading(true);
        const data = await orderService.getOrderById(id);
        if (data) {
          setOrder(data);
        }
      } catch (err) {
        if (__DEV__) console.warn('[SellerOrderDetailsScreen] Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (!order || orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!order?.id) return;
    try {
      setUpdating(true);
      const updated = await orderService.updateOrderStatus(order.id, newStatus);
      setOrder(updated);
      Alert.alert('Status Updated', `Order status changed to ${newStatus}.`);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      Alert.alert('Error', 'Failed to update order status.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order? This cannot be undone.',
      [
        { text: 'No, Keep Order', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => handleUpdateStatus('CANCELLED'),
        },
      ]
    );
  };

  if (loading || !order) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Theme.colors.emerald} />
        <Text style={styles.loadingText}>Loading order details...</Text>
      </View>
    );
  }

  const currentStatus = (order.orderStatus || 'PENDING').toUpperCase();

  // Progress Stepper stages
  const steps = [
    { key: 'PENDING', label: 'Placed' },
    { key: 'PREPARING', label: 'Preparing' },
    { key: 'OUT_FOR_DELIVERY', label: 'Dispatched' },
    { key: 'DELIVERED', label: 'Delivered' },
  ];

  const getStepIndex = (status: string) => {
    if (status === 'PENDING') return 0;
    if (status === 'PREPARING' || status === 'CONFIRMED') return 1;
    if (status === 'READY' || status === 'OUT_FOR_DELIVERY') return 2;
    if (status === 'DELIVERED' || status === 'COMPLETED') return 3;
    return 0;
  };

  const currentStepIdx = getStepIndex(currentStatus);

  const subtotal = order.totalAmount ? Math.round(order.totalAmount * 0.9) : 0;
  const deliveryFee = 30;
  const tax = Math.round(subtotal * 0.05);
  const total = order.totalAmount || subtotal + deliveryFee + tax;

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
          <ArrowLeft size={22} color={Theme.colors.primaryText} />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.headerTitle}>Order #{order.orderNumber || order.id.slice(0, 8)}</Text>
          <Text style={styles.headerDate}>
            {order.createdAt
              ? new Date(order.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Recent Order'}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* 4-Step Visual Progress Tracker Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Order Progress</Text>
          <View style={styles.stepperRow}>
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const isFuture = idx > currentStepIdx;

              return (
                <View key={step.key} style={styles.stepItem}>
                  <View style={styles.stepCircleRow}>
                    {idx > 0 && (
                      <View
                        style={[
                          styles.stepLine,
                          idx <= currentStepIdx ? styles.stepLineActive : styles.stepLineInactive,
                        ]}
                      />
                    )}
                    <View
                      style={[
                        styles.stepCircle,
                        isPast && styles.stepCirclePast,
                        isCurrent && styles.stepCircleCurrent,
                        isFuture && styles.stepCircleFuture,
                      ]}
                    >
                      {isPast ? (
                        <CheckCircle size={14} color="#FFFFFF" />
                      ) : (
                        <Text
                          style={[
                            styles.stepNumber,
                            isCurrent && styles.stepNumberCurrent,
                            isFuture && styles.stepNumberFuture,
                          ]}
                        >
                          {idx + 1}
                        </Text>
                      )}
                    </View>
                    {idx < steps.length - 1 && (
                      <View
                        style={[
                          styles.stepLine,
                          idx < currentStepIdx ? styles.stepLineActive : styles.stepLineInactive,
                        ]}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.stepLabel,
                      isCurrent && styles.stepLabelCurrent,
                      isFuture && styles.stepLabelFuture,
                    ]}
                  >
                    {step.label}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Customer Information Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Customer & Delivery</Text>
          <View style={styles.customerHeaderRow}>
            <View>
              <Text style={styles.customerName}>
                {order.customerName || (order as any).user?.fullName || 'Local Customer'}
              </Text>
              <Text style={styles.customerMeta}>Verified Resident Buyer</Text>
            </View>

            {order.customerPhone ? (
              <TouchableOpacity style={styles.callCta} activeOpacity={0.8}>
                <Phone size={15} color="#FFFFFF" />
                <Text style={styles.callCtaText}>Call Customer</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.divider} />

          <View style={styles.deliveryInfoRow}>
            <MapPin size={18} color={Theme.colors.forestGreen} />
            <View style={{ flex: 1 }}>
              <Text style={styles.deliveryLabel}>Delivery Address</Text>
              <Text style={styles.deliveryValue}>
                {order.shippingAddress || 'House 14, Main Road, Market Area, Chiplun'}
              </Text>
            </View>
          </View>

          {order.customerNotes ? (
            <View style={styles.noteBox}>
              <Text style={styles.noteLabel}>Special Customer Note:</Text>
              <Text style={styles.noteValue}>{order.customerNotes}</Text>
            </View>
          ) : null}
        </View>

        {/* Itemized Order Table */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Items ({order.items?.length || 1})</Text>

          {order.items && order.items.length > 0 ? (
            order.items.map((it, idx) => (
              <View key={idx} style={styles.itemRow}>
                <View style={styles.itemIconBox}>
                  <Package size={18} color={Theme.colors.forestGreen} />
                </View>
                <View style={styles.itemMeta}>
                  <Text style={styles.itemTitle}>
                    {it.product?.title || it.productName || 'Order item'}
                  </Text>
                  <Text style={styles.itemUnit}>
                    {it.quantity} x ₹{it.price || it.unitPrice || 0}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>
                  ₹{(it.quantity || 1) * (it.price || it.unitPrice || 0)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.itemRow}>
              <View style={styles.itemIconBox}>
                <Package size={18} color={Theme.colors.forestGreen} />
              </View>
              <View style={styles.itemMeta}>
                <Text style={styles.itemTitle}>Store Catalog Items</Text>
                <Text style={styles.itemUnit}>1 Package</Text>
              </View>
              <Text style={styles.itemTotal}>₹{order.totalAmount || 0}</Text>
            </View>
          )}
        </View>

        {/* Payment & Bill Summary */}
        <View style={styles.card}>
          <Text style={styles.cardHeading}>Payment & Invoice</Text>

          <View style={styles.billLine}>
            <Text style={styles.billLabel}>Subtotal</Text>
            <Text style={styles.billValue}>₹{subtotal}</Text>
          </View>

          <View style={styles.billLine}>
            <Text style={styles.billLabel}>Delivery Fee</Text>
            <Text style={styles.billValue}>₹{deliveryFee}</Text>
          </View>

          <View style={styles.billLine}>
            <Text style={styles.billLabel}>Estimated Tax (5%)</Text>
            <Text style={styles.billValue}>₹{tax}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.billTotalLine}>
            <Text style={styles.billTotalLabel}>Grand Total</Text>
            <Text style={styles.billTotalValue}>₹{total.toLocaleString()}</Text>
          </View>

          <View style={styles.paymentMethodRow}>
            <CreditCard size={15} color={Theme.colors.secondaryText} />
            <Text style={styles.paymentMethodText}>
              Payment: {order.paymentMethod || 'UPI / Cash on Delivery'}
            </Text>
          </View>
        </View>

        {/* Action Controls */}
        <View style={styles.bottomActions}>
          {currentStatus === 'PENDING' && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, updating && styles.btnDisabled]}
              onPress={() => handleUpdateStatus('PREPARING')}
              disabled={updating}
              activeOpacity={0.85}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle size={18} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>Accept & Prepare Order</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {(currentStatus === 'PREPARING' || currentStatus === 'CONFIRMED') && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, updating && styles.btnDisabled]}
              onPress={() => handleUpdateStatus('OUT_FOR_DELIVERY')}
              disabled={updating}
              activeOpacity={0.85}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Truck size={18} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>Dispatch / Out for Delivery</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {(currentStatus === 'OUT_FOR_DELIVERY' || currentStatus === 'READY') && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, updating && styles.btnDisabled]}
              onPress={() => handleUpdateStatus('DELIVERED')}
              disabled={updating}
              activeOpacity={0.85}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <CheckCircle size={18} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>Confirm Delivered</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          {currentStatus === 'DELIVERED' && (
            <View style={styles.deliveredSuccessBox}>
              <CheckCircle size={20} color="#16A34A" />
              <Text style={styles.deliveredSuccessText}>
                Order has been successfully fulfilled & delivered.
              </Text>
            </View>
          )}

          {currentStatus !== 'DELIVERED' && currentStatus !== 'CANCELLED' && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={handleCancelOrder}
              disabled={updating}
              activeOpacity={0.7}
            >
              <XCircle size={16} color="#DC2626" />
              <Text style={styles.cancelBtnText}>Cancel Order</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAF7',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 13,
    color: Theme.colors.secondaryText,
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
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.primaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  headerDate: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#17231B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.primaryText,
    marginBottom: 14,
    fontFamily: Theme.typography.fontFamily,
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
  },
  stepCircleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'center',
  },
  stepLine: {
    flex: 1,
    height: 2,
  },
  stepLineActive: {
    backgroundColor: '#16A34A',
  },
  stepLineInactive: {
    backgroundColor: '#E2E8F0',
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCirclePast: {
    backgroundColor: '#16A34A',
  },
  stepCircleCurrent: {
    backgroundColor: '#16A34A',
    borderWidth: 3,
    borderColor: '#DCFCE7',
  },
  stepCircleFuture: {
    backgroundColor: '#F1F5F0',
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepNumberCurrent: {
    color: '#FFFFFF',
  },
  stepNumberFuture: {
    color: '#94A3B8',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Theme.colors.secondaryText,
    marginTop: 6,
    textAlign: 'center',
  },
  stepLabelCurrent: {
    fontWeight: '700',
    color: Theme.colors.forestGreen,
  },
  stepLabelFuture: {
    color: '#94A3B8',
  },
  customerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '700',
    color: Theme.colors.primaryText,
  },
  customerMeta: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  callCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.forestGreen,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  callCtaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F0',
    marginVertical: 12,
  },
  deliveryInfoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  deliveryLabel: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
  },
  deliveryValue: {
    fontSize: 13,
    color: Theme.colors.primaryText,
    marginTop: 2,
    lineHeight: 18,
  },
  noteBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  noteLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
  },
  noteValue: {
    fontSize: 12,
    color: '#78350F',
    marginTop: 2,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EAF7EE',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemMeta: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.primaryText,
  },
  itemUnit: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  itemTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primaryText,
  },
  billLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  billLabel: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.primaryText,
  },
  billTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  billTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.primaryText,
  },
  billTotalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.forestGreen,
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  paymentMethodText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
  },
  bottomActions: {
    marginTop: 6,
    gap: 10,
  },
  primaryActionBtn: {
    height: 52,
    borderRadius: 16,
    backgroundColor: Theme.colors.emerald,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: Theme.colors.emerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryActionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  cancelBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  deliveredSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 14,
    borderRadius: 14,
    gap: 10,
  },
  deliveredSuccessText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#15803D',
  },
});
