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
  Modal,
  Alert,
} from 'react-native';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  User,
  Phone,
  Mail,
  FileText,
  DollarSign,
  Building,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react-native';
import { Booking } from '../../types';
import { GlassCard } from '../../components/cards/GlassCard';
import { bookingService } from '../../services/bookingService';
import { Theme } from '../../theme';

interface BookingDetailsScreenProps {
  bookingId: string;
  onBack: () => void;
}

export const BookingDetailsScreen: React.FC<BookingDetailsScreenProps> = ({ bookingId, onBack }) => {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation Modal & State
  const [isCancelModalVisible, setIsCancelModalVisible] = useState<boolean>(false);
  const [cancelling, setCancelling] = useState<boolean>(false);

  // Reschedule Info Modal State
  const [isRescheduleModalVisible, setIsRescheduleModalVisible] = useState<boolean>(false);

  const fetchBookingDetail = async () => {
    try {
      setError(null);
      const data = await bookingService.getBookingById(bookingId);
      if (data) {
        setBooking(data);
      } else {
        setError(`Booking #${bookingId} not found`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve booking detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookingDetail();
  }, [bookingId]);

  const handleConfirmCancel = async () => {
    if (!booking) return;
    setCancelling(true);
    try {
      const updated = await bookingService.cancelBooking(booking.id);
      setBooking(updated);
      setIsCancelModalVisible(false);
      Alert.alert('Booking Cancelled', 'Your service booking has been cancelled successfully.');
    } catch (err: any) {
      Alert.alert('Cancellation Error', err.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const statusStr = (booking?.status || 'CONFIRMED').toUpperCase();
  const isCancelled = statusStr === 'CANCELLED';
  const isCompleted = statusStr === 'COMPLETED';
  const isStarted = statusStr === 'STARTED';
  const isConfirmed = statusStr === 'CONFIRMED' || statusStr === 'PENDING' || isStarted || isCompleted;

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Booking Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Theme.colors.primary} />
              <Text style={styles.loadingText}>Fetching booking details from server...</Text>
            </View>
          ) : error || !booking ? (
            <GlassCard style={styles.card}>
              <AlertTriangle size={36} color="#EF4444" style={{ alignSelf: 'center', marginBottom: 12 }} />
              <Text style={styles.errorTitle}>Error Loading Record</Text>
              <Text style={styles.errorMsg}>{error || 'Booking detail unavailable'}</Text>
              <TouchableOpacity style={styles.primaryBtn} onPress={onBack}>
                <Text style={styles.primaryBtnText}>Back</Text>
              </TouchableOpacity>
            </GlassCard>
          ) : (
            <>
              {/* Header Badge Card */}
              <GlassCard style={styles.card}>
                <View style={styles.idBadgeRow}>
                  <View style={styles.idBox}>
                    <Text style={styles.idLabel}>Booking Reference</Text>
                    <Text style={styles.idVal}>{booking.bookingNumber || `#BK-${booking.id}`}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusTag,
                      isCancelled
                        ? styles.tagCancelled
                        : isCompleted
                        ? styles.tagCompleted
                        : styles.tagConfirmed,
                    ]}
                  >
                    {isCancelled ? (
                      <XCircle size={12} color="#EF4444" />
                    ) : (
                      <CheckCircle2 size={12} color={isCompleted ? Theme.colors.accentGreen : Theme.colors.primary} />
                    )}
                    <Text
                      style={[
                        styles.statusTagText,
                        isCancelled
                          ? styles.textCancelled
                          : isCompleted
                          ? styles.textCompleted
                          : styles.textConfirmed,
                      ]}
                    >
                      {statusStr}
                    </Text>
                  </View>
                </View>

                <Text style={styles.serviceHeading}>{booking.serviceTitle || 'Professional Service'}</Text>
                <View style={styles.providerRow}>
                  <Building size={14} color={Theme.colors.primary} />
                  <Text style={styles.providerName}>{booking.businessName || 'ECOSPHERE Provider'}</Text>
                </View>
              </GlassCard>

              {/* Status Timeline Card */}
              <Text style={styles.sectionHeading}>Booking Status Timeline</Text>
              <GlassCard style={styles.card}>
                <View style={styles.timelineContainer}>
                  {/* Step 1: Requested */}
                  <View style={styles.timelineRow}>
                    <View style={styles.timelineDotActive} />
                    <View style={styles.timelineContent}>
                      <Text style={styles.timelineStepTitle}>Booking Requested</Text>
                      <Text style={styles.timelineStepSub}>Submitted via ECOSPHERE Network</Text>
                    </View>
                  </View>
                  <View style={[styles.timelineLine, isConfirmed && styles.timelineLineActive]} />

                  {/* Step 2: Confirmed */}
                  <View style={styles.timelineRow}>
                    <View style={isConfirmed ? styles.timelineDotActive : styles.timelineDotInactive} />
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineStepTitle, !isConfirmed && styles.textMuted]}>
                        Booking Confirmed
                      </Text>
                      <Text style={styles.timelineStepSub}>Provider slot assigned & payment recorded</Text>
                    </View>
                  </View>
                  <View style={[styles.timelineLine, (isStarted || isCompleted) && styles.timelineLineActive]} />

                  {/* Step 3: Started */}
                  <View style={styles.timelineRow}>
                    <View style={isStarted || isCompleted ? styles.timelineDotActive : styles.timelineDotInactive} />
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineStepTitle, !(isStarted || isCompleted) && styles.textMuted]}>
                        Service Started
                      </Text>
                      <Text style={styles.timelineStepSub}>Provider on-site or service in progress</Text>
                    </View>
                  </View>
                  <View style={[styles.timelineLine, isCompleted && styles.timelineLineActive]} />

                  {/* Step 4: Completed */}
                  <View style={styles.timelineRow}>
                    <View style={isCompleted ? styles.timelineDotActive : styles.timelineDotInactive} />
                    <View style={styles.timelineContent}>
                      <Text style={[styles.timelineStepTitle, !isCompleted && styles.textMuted]}>
                        Completed
                      </Text>
                      <Text style={styles.timelineStepSub}>Service delivered & verified</Text>
                    </View>
                  </View>
                </View>
              </GlassCard>

              {/* Appointment & Location Info */}
              <Text style={styles.sectionHeading}>Appointment & Location</Text>
              <GlassCard style={styles.card}>
                <View style={styles.infoRow}>
                  <Calendar size={16} color={Theme.colors.primary} />
                  <Text style={styles.infoText}>
                    Date: {booking.bookingDate || (booking.date ? booking.date.split('T')[0] : '2026-09-10')}
                  </Text>
                </View>

                <View style={styles.infoRow}>
                  <Clock size={16} color={Theme.colors.accentPurple} />
                  <Text style={styles.infoText}>
                    Time: {booking.startTime || booking.time || '10:00 AM'}
                  </Text>
                </View>

                {booking.customerAddress ? (
                  <View style={styles.infoRow}>
                    <MapPin size={16} color={Theme.colors.secondaryText} />
                    <Text style={styles.infoText}>Address: {booking.customerAddress}</Text>
                  </View>
                ) : null}

                {booking.customerNotes ? (
                  <View style={styles.infoRow}>
                    <FileText size={16} color={Theme.colors.secondaryText} />
                    <Text style={styles.infoText}>Notes: {booking.customerNotes}</Text>
                  </View>
                ) : null}
              </GlassCard>

              {/* Payment Summary */}
              <Text style={styles.sectionHeading}>Payment Summary</Text>
              <GlassCard style={styles.card}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Service Amount</Text>
                  <Text style={styles.priceValue}>
                    ₹{(booking.amount || booking.price || 0).toLocaleString('en-IN')}
                  </Text>
                </View>

                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Payment Status</Text>
                  <Text style={[styles.priceValue, { color: Theme.colors.accentGreen }]}>
                    {booking.paymentStatus || 'PAID'} (UPI)
                  </Text>
                </View>
              </GlassCard>

              {/* Action Buttons (Cancel / Reschedule) */}
              {!isCancelled && !isCompleted && (
                <View style={styles.actionsContainer}>
                  <TouchableOpacity
                    style={styles.rescheduleBtn}
                    onPress={() => setIsRescheduleModalVisible(true)}
                  >
                    <RotateCcw size={16} color={Theme.colors.primary} />
                    <Text style={styles.rescheduleText}>Reschedule</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setIsCancelModalVisible(true)}
                  >
                    <XCircle size={16} color="#EF4444" />
                    <Text style={styles.cancelText}>Cancel Booking</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* CANCEL CONFIRMATION MODAL */}
      <Modal visible={isCancelModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard}>
            <AlertTriangle size={36} color="#EF4444" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={styles.modalTitle}>Cancel this booking?</Text>
            <Text style={styles.modalSub}>
              Are you sure you want to cancel appointment #{booking?.bookingNumber || booking?.id}? Cancellation is subject to provider policies.
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalSecBtn}
                disabled={cancelling}
                onPress={() => setIsCancelModalVisible(false)}
              >
                <Text style={styles.modalSecText}>Keep Booking</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalDangerBtn}
                disabled={cancelling}
                onPress={handleConfirmCancel}
              >
                {cancelling ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalDangerText}>Confirm Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </GlassCard>
        </View>
      </Modal>

      {/* RESCHEDULE CAPABILITY GAP MODAL */}
      <Modal visible={isRescheduleModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <GlassCard style={styles.modalCard}>
            <RotateCcw size={36} color={Theme.colors.primary} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={styles.modalTitle}>Rescheduling Notice</Text>
            <Text style={styles.modalSub}>
              Direct slot rescheduling is currently unavailable via automated API. To change your appointment time, please cancel this booking and select your preferred slot.
            </Text>

            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => setIsRescheduleModalVisible(false)}
            >
              <Text style={styles.modalPrimaryText}>Understood</Text>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </Modal>
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
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    textAlign: 'center',
  },
  errorMsg: {
    fontSize: 13,
    color: '#CBD5E1',
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  card: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  idBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  idBox: {
    flex: 1,
  },
  idLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  idVal: {
    fontSize: 14,
    fontWeight: '800',
    color: Theme.colors.primary,
    marginTop: 2,
  },
  statusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  tagConfirmed: {
    backgroundColor: 'rgba(47, 214, 255, 0.15)',
  },
  tagCompleted: {
    backgroundColor: 'rgba(37, 230, 138, 0.15)',
  },
  tagCancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusTagText: {
    fontSize: 11,
    fontWeight: '700',
  },
  textConfirmed: {
    color: Theme.colors.primary,
  },
  textCompleted: {
    color: Theme.colors.accentGreen,
  },
  textCancelled: {
    color: '#EF4444',
  },
  serviceHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerName: {
    fontSize: 13,
    color: Theme.colors.primary,
    marginLeft: 6,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 10,
    marginTop: 4,
  },
  timelineContainer: {
    paddingVertical: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineDotActive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Theme.colors.accentGreen,
    marginRight: 12,
    marginTop: 2,
  },
  timelineDotInactive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginRight: 12,
    marginTop: 2,
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginLeft: 6,
    marginVertical: 2,
  },
  timelineLineActive: {
    backgroundColor: Theme.colors.accentGreen,
  },
  timelineContent: {
    flex: 1,
  },
  timelineStepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  timelineStepSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  textMuted: {
    color: '#64748B',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#CBD5E1',
    marginLeft: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  rescheduleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0D1828',
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.3)',
    gap: 8,
  },
  rescheduleText: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    gap: 8,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  primaryBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#07111F',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    padding: 24,
    borderRadius: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  modalSecBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0D1828',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  modalSecText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  modalDangerBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  modalDangerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalPrimaryBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
  },
  modalPrimaryText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#07111F',
  },
});
