import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  User,
  Phone,
  Mail,
  FileText,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Building,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Service, Booking } from '../../types';
import { GlassCard } from '../../components/cards/GlassCard';
import { bookingService } from '../../services/bookingService';
import { profileService, UserProfile } from '../../services/profileService';
import { Theme } from '../../theme';

interface BookingServiceScreenProps {
  service?: Service;
  onBack: () => void;
  onViewBooking?: (bookingId: string) => void;
  onNavigateHome?: () => void;
}

const MORNING_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM'];
const AFTERNOON_SLOTS = ['12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM'];
const EVENING_SLOTS = ['05:00 PM', '06:00 PM', '07:00 PM'];

export const BookingServiceScreen: React.FC<BookingServiceScreenProps> = ({
  service,
  onBack,
  onViewBooking,
  onNavigateHome,
}) => {
  const targetService: Service = service || {
    id: '1',
    businessId: '71',
    businessName: 'SmartHome Networks 1',
    providerName: 'Gauresh Mehta',
    title: 'High-Speed Fiber Installation #1',
    description: 'Professional High-Speed Fiber Installation service delivered with guaranteed quality.',
    price: 3422,
    duration: '2 Hours',
    category: 'Home Services',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    rating: 4.8,
    reviewsCount: 120,
    location: 'Ballygunge, Kolkata',
  };

  // Step State (1: Service, 2: Date & Time, 3: Details, 4: Review, 5: Confirmed)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Date Selection State (Today + 14 Days)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('10:00 AM');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Form State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [addressLine, setAddressLine] = useState<string>('Flat 402, Highstreet Towers');
  const [city, setCity] = useState<string>('Kolkata');
  const [stateName, setStateName] = useState<string>('West Bengal');
  const [postalCode, setPostalCode] = useState<string>('700019');
  const [customerNotes, setCustomerNotes] = useState<string>('');

  // Submission & Confirmation State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [conflictErrorMessage, setConflictErrorMessage] = useState<string | null>(null);

  // Load User Profile on Mount
  useEffect(() => {
    profileService
      .getProfile()
      .then((prof) => {
        if (prof) {
          setProfile(prof);
          setCustomerName(prof.name || `${prof.firstName || ''} ${prof.lastName || ''}`.trim());
          setCustomerPhone(prof.phone || '');
          setCustomerEmail(prof.email || '');
        }
      })
      .catch(() => {});
  }, []);

  // Fetch Slot Availability for Selected Date
  useEffect(() => {
    if (!selectedDateStr) return;
    setLoadingSlots(true);
    bookingService
      .getMyBookings()
      .then((existing) => {
        const taken = existing
          .filter(
            (b) =>
              (b.serviceId === targetService.id || b.serviceTitle === targetService.title) &&
              (b.bookingDate === selectedDateStr || (b.date && b.date.startsWith(selectedDateStr))) &&
              b.status !== 'CANCELLED'
          )
          .map((b) => b.startTime || b.time)
          .filter(Boolean) as string[];
        setBookedSlots(taken);
      })
      .catch(() => setBookedSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDateStr, targetService.id]);

  // Generate Available Date Cards (14 Days)
  const dateOptions = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const isoDate = d.toISOString().split('T')[0];
    const isToday = i === 0;
    const isTomorrow = i === 1;
    const dayName = isToday ? 'TODAY' : isTomorrow ? 'TOM' : d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const dayNum = d.getDate();
    const monthName = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    return { isoDate, isToday, isTomorrow, dayName, dayNum, monthName };
  });

  // Calculate Prices
  const basePrice = targetService.price || 1499;
  const serviceFee = Math.round(basePrice * 0.18);
  const totalPrice = basePrice + serviceFee;

  // Handle Booking Submission
  const handleSubmitBooking = async () => {
    if (!addressLine.trim()) {
      Alert.alert('Address Required', 'Please enter your service address before proceeding.');
      return;
    }

    setIsSubmitting(true);
    setConflictErrorMessage(null);

    try {
      const newBooking = await bookingService.createBooking({
        serviceId: String(targetService.id),
        bookingDate: selectedDateStr,
        startTime: selectedTimeSlot,
        customerAddress: addressLine,
        customerCity: city,
        customerState: stateName,
        customerPostalCode: postalCode,
        customerNotes: customerNotes.trim() || undefined,
        paymentMethod: 'UPI',
      });

      setIsSubmitting(false);
      setConfirmedBooking(newBooking);
      setCurrentStep(5); // Move to Confirmed Step
    } catch (err: any) {
      setIsSubmitting(false);
      const msg = err.message || 'Failed to complete booking';
      if (msg.includes('BOOKING_SLOT_UNAVAILABLE') || msg.includes('booked') || msg.includes('unavailable')) {
        setConflictErrorMessage(msg);
      } else {
        Alert.alert('Booking Error', msg);
      }
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configure Booking</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Step Indicator Bar */}
        <View style={styles.stepIndicatorContainer}>
          {[
            { step: 1, label: 'Service' },
            { step: 2, label: 'Date & Time' },
            { step: 3, label: 'Details' },
            { step: 4, label: 'Review' },
            { step: 5, label: 'Confirm' },
          ].map((s) => {
            const isActive = currentStep === s.step;
            const isDone = currentStep > s.step;
            return (
              <TouchableOpacity
                key={s.step}
                disabled={currentStep === 5 || s.step > currentStep}
                onPress={() => setCurrentStep(s.step)}
                style={styles.stepItem}
                activeOpacity={0.8}
              >
                <View
                  style={[
                    styles.stepCircle,
                    isDone && styles.stepCircleDone,
                    isActive && styles.stepCircleActive,
                  ]}
                >
                  {isDone ? (
                    <CheckCircle2 size={13} color="#07111F" />
                  ) : (
                    <Text style={[styles.stepNum, isActive && styles.stepNumActive]}>0{s.step}</Text>
                  )}
                </View>
                <Text style={[styles.stepLabel, isActive && styles.stepLabelActive, isDone && styles.stepLabelDone]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* STEP 1: SERVICE OVERVIEW */}
            {currentStep === 1 && (
              <View style={styles.stepSection}>
                <Text style={styles.sectionHeading}>Service Summary</Text>

                <GlassCard style={styles.card}>
                  <Text style={styles.serviceTitle}>{targetService.title}</Text>
                  <View style={styles.metaRow}>
                    <Building size={14} color={Theme.colors.primary} />
                    <Text style={styles.metaText}>{targetService.businessName || 'ECOSPHERE Provider'}</Text>
                  </View>

                  {targetService.providerName && (
                    <View style={styles.metaRow}>
                      <User size={14} color={Theme.colors.accentGreen} />
                      <Text style={styles.metaText}>Provider: {targetService.providerName}</Text>
                    </View>
                  )}

                  <View style={styles.metaRow}>
                    <Clock size={14} color={Theme.colors.accentPurple} />
                    <Text style={styles.metaText}>Duration: {targetService.duration || '60 mins'}</Text>
                  </View>

                  <View style={styles.metaRow}>
                    <MapPin size={14} color={Theme.colors.secondaryText} />
                    <Text style={styles.metaText}>{targetService.location || 'Customer Location'}</Text>
                  </View>

                  <View style={styles.divider} />

                  <Text style={styles.descriptionText}>
                    {targetService.description ||
                      'Comprehensive on-demand service delivered by verified ECOSPHERE specialists.'}
                  </Text>

                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Service Base Price</Text>
                    <Text style={styles.priceVal}>₹{basePrice.toLocaleString('en-IN')}</Text>
                  </View>
                </GlassCard>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  activeOpacity={0.8}
                  onPress={() => setCurrentStep(2)}
                >
                  <LinearGradient
                    colors={[Theme.colors.primary, '#00A8FF']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.gradientBtn}
                  >
                    <Text style={styles.primaryBtnText}>Select Date & Time</Text>
                    <ChevronRight size={18} color="#07111F" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 2: DATE & TIME SELECTION */}
            {currentStep === 2 && (
              <View style={styles.stepSection}>
                <Text style={styles.sectionHeading}>Select Service Date</Text>

                {/* Horizontal Date Picker */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
                  {dateOptions.map((opt) => {
                    const isSelected = selectedDateStr === opt.isoDate;
                    return (
                      <TouchableOpacity
                        key={opt.isoDate}
                        onPress={() => setSelectedDateStr(opt.isoDate)}
                        style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                        activeOpacity={0.8}
                      >
                        {opt.isToday && (
                          <View style={styles.todayBadge}>
                            <Text style={styles.todayBadgeText}>TODAY</Text>
                          </View>
                        )}
                        <Text style={[styles.dayName, isSelected && styles.dayNameSelected]}>
                          {opt.dayName}
                        </Text>
                        <Text style={[styles.dayNum, isSelected && styles.dayNumSelected]}>
                          {opt.dayNum}
                        </Text>
                        <Text style={[styles.monthName, isSelected && styles.monthNameSelected]}>
                          {opt.monthName}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Select Available Time Slot</Text>
                <Text style={styles.selectedDateSubtitle}>
                  Slots for {new Date(selectedDateStr).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </Text>

                {loadingSlots ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Theme.colors.primary} />
                    <Text style={styles.loadingText}>Checking live availability...</Text>
                  </View>
                ) : (
                  <>
                    {/* Morning Slots */}
                    <Text style={styles.slotCategoryHeader}>Morning</Text>
                    <View style={styles.slotsGrid}>
                      {MORNING_SLOTS.map((slot) => {
                        const isTaken = bookedSlots.includes(slot);
                        const isSelected = selectedTimeSlot === slot;
                        return (
                          <TouchableOpacity
                            key={slot}
                            disabled={isTaken}
                            onPress={() => setSelectedTimeSlot(slot)}
                            style={[
                              styles.slotBtn,
                              isSelected && styles.slotBtnSelected,
                              isTaken && styles.slotBtnDisabled,
                            ]}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.slotText,
                                isSelected && styles.slotTextSelected,
                                isTaken && styles.slotTextDisabled,
                              ]}
                            >
                              {slot}
                            </Text>
                            {isTaken && <Text style={styles.bookedBadgeText}>Booked</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Afternoon Slots */}
                    <Text style={styles.slotCategoryHeader}>Afternoon</Text>
                    <View style={styles.slotsGrid}>
                      {AFTERNOON_SLOTS.map((slot) => {
                        const isTaken = bookedSlots.includes(slot);
                        const isSelected = selectedTimeSlot === slot;
                        return (
                          <TouchableOpacity
                            key={slot}
                            disabled={isTaken}
                            onPress={() => setSelectedTimeSlot(slot)}
                            style={[
                              styles.slotBtn,
                              isSelected && styles.slotBtnSelected,
                              isTaken && styles.slotBtnDisabled,
                            ]}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.slotText,
                                isSelected && styles.slotTextSelected,
                                isTaken && styles.slotTextDisabled,
                              ]}
                            >
                              {slot}
                            </Text>
                            {isTaken && <Text style={styles.bookedBadgeText}>Booked</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Evening Slots */}
                    <Text style={styles.slotCategoryHeader}>Evening</Text>
                    <View style={styles.slotsGrid}>
                      {EVENING_SLOTS.map((slot) => {
                        const isTaken = bookedSlots.includes(slot);
                        const isSelected = selectedTimeSlot === slot;
                        return (
                          <TouchableOpacity
                            key={slot}
                            disabled={isTaken}
                            onPress={() => setSelectedTimeSlot(slot)}
                            style={[
                              styles.slotBtn,
                              isSelected && styles.slotBtnSelected,
                              isTaken && styles.slotBtnDisabled,
                            ]}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.slotText,
                                isSelected && styles.slotTextSelected,
                                isTaken && styles.slotTextDisabled,
                              ]}
                            >
                              {slot}
                            </Text>
                            {isTaken && <Text style={styles.bookedBadgeText}>Booked</Text>}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCurrentStep(1)}>
                    <Text style={styles.secondaryBtnText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 1, marginLeft: 12 }]}
                    activeOpacity={0.8}
                    onPress={() => setCurrentStep(3)}
                  >
                    <LinearGradient
                      colors={[Theme.colors.primary, '#00A8FF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientBtn}
                    >
                      <Text style={styles.primaryBtnText}>Customer Details</Text>
                      <ChevronRight size={18} color="#07111F" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 3: CUSTOMER DETAILS & LOCATION */}
            {currentStep === 3 && (
              <View style={styles.stepSection}>
                <Text style={styles.sectionHeading}>Customer Details</Text>

                <GlassCard style={styles.card}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <View style={styles.inputContainer}>
                    <User size={16} color={Theme.colors.secondaryText} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={customerName}
                      onChangeText={setCustomerName}
                      placeholder="Enter full name"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <View style={styles.inputContainer}>
                    <Phone size={16} color={Theme.colors.secondaryText} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={customerPhone}
                      onChangeText={setCustomerPhone}
                      keyboardType="phone-pad"
                      placeholder="Enter phone number"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputContainer}>
                    <Mail size={16} color={Theme.colors.secondaryText} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={customerEmail}
                      onChangeText={setCustomerEmail}
                      keyboardType="email-address"
                      placeholder="Enter email address"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </GlassCard>

                <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Service Location / Address</Text>

                <GlassCard style={styles.card}>
                  <Text style={styles.inputLabel}>Address Line</Text>
                  <View style={styles.inputContainer}>
                    <MapPin size={16} color={Theme.colors.secondaryText} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={addressLine}
                      onChangeText={setAddressLine}
                      placeholder="Street / House / Apartment"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.inputLabel}>City</Text>
                      <TextInput
                        style={styles.inputSimple}
                        value={city}
                        onChangeText={setCity}
                        placeholder="City"
                        placeholderTextColor="#64748B"
                      />
                    </View>

                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.inputLabel}>Postal Code</Text>
                      <TextInput
                        style={styles.inputSimple}
                        value={postalCode}
                        onChangeText={setPostalCode}
                        keyboardType="numeric"
                        placeholder="Postal Code"
                        placeholderTextColor="#64748B"
                      />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Special Instructions / Notes (Optional)</Text>
                  <View style={[styles.inputContainer, { height: 80, alignItems: 'flex-start' }]}>
                    <FileText size={16} color={Theme.colors.secondaryText} style={[styles.inputIcon, { marginTop: 10 }]} />
                    <TextInput
                      style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
                      value={customerNotes}
                      onChangeText={setCustomerNotes}
                      multiline
                      placeholder="Provide entrance code, gate instructions, or specific requests"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </GlassCard>

                <View style={styles.btnRow}>
                  <TouchableOpacity style={styles.secondaryBtn} onPress={() => setCurrentStep(2)}>
                    <Text style={styles.secondaryBtnText}>Back</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 1, marginLeft: 12 }]}
                    activeOpacity={0.8}
                    onPress={() => setCurrentStep(4)}
                  >
                    <LinearGradient
                      colors={[Theme.colors.primary, '#00A8FF']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientBtn}
                    >
                      <Text style={styles.primaryBtnText}>Review Booking</Text>
                      <ChevronRight size={18} color="#07111F" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 4: REVIEW & CONFIRM */}
            {currentStep === 4 && (
              <View style={styles.stepSection}>
                <Text style={styles.sectionHeading}>Review Booking Details</Text>

                <GlassCard style={styles.card}>
                  <View style={styles.reviewHeader}>
                    <Text style={styles.reviewTitle}>{targetService.title}</Text>
                    <Text style={styles.reviewProvider}>{targetService.businessName}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.reviewDetailRow}>
                    <Calendar size={16} color={Theme.colors.primary} />
                    <Text style={styles.reviewDetailText}>
                      {new Date(selectedDateStr).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>

                  <View style={styles.reviewDetailRow}>
                    <Clock size={16} color={Theme.colors.accentPurple} />
                    <Text style={styles.reviewDetailText}>
                      {selectedTimeSlot} ({targetService.duration || '60 mins'})
                    </Text>
                  </View>

                  <View style={styles.reviewDetailRow}>
                    <User size={16} color={Theme.colors.accentGreen} />
                    <Text style={styles.reviewDetailText}>
                      {customerName} • {customerPhone}
                    </Text>
                  </View>

                  <View style={styles.reviewDetailRow}>
                    <MapPin size={16} color={Theme.colors.secondaryText} />
                    <Text style={styles.reviewDetailText}>
                      {addressLine}, {city}, {postalCode}
                    </Text>
                  </View>

                  {customerNotes.trim() ? (
                    <View style={styles.reviewDetailRow}>
                      <FileText size={16} color={Theme.colors.secondaryText} />
                      <Text style={styles.reviewDetailText}>Note: {customerNotes}</Text>
                    </View>
                  ) : null}
                </GlassCard>

                {/* Price Breakdown */}
                <Text style={[styles.sectionHeading, { marginTop: 24 }]}>Price Summary</Text>
                <GlassCard style={styles.card}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceRowLabel}>Base Service Rate</Text>
                    <Text style={styles.priceRowValue}>₹{basePrice.toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceRowLabel}>Service & Platform Fee (18%)</Text>
                    <Text style={styles.priceRowValue}>₹{serviceFee.toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Total Payable Amount</Text>
                    <Text style={styles.totalValue}>₹{totalPrice.toLocaleString('en-IN')}</Text>
                  </View>

                  <View style={styles.paymentGuaranteeRow}>
                    <ShieldCheck size={16} color={Theme.colors.accentGreen} />
                    <Text style={styles.guaranteeText}>ECOSPHERE Service Quality & Safety Guarantee</Text>
                  </View>
                </GlassCard>

                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.secondaryBtn}
                    disabled={isSubmitting}
                    onPress={() => setCurrentStep(3)}
                  >
                    <Text style={styles.secondaryBtnText}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.primaryBtn, { flex: 1, marginLeft: 12 }]}
                    disabled={isSubmitting}
                    activeOpacity={0.8}
                    onPress={handleSubmitBooking}
                  >
                    <LinearGradient
                      colors={[Theme.colors.accentGreen, '#00B894']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.gradientBtn}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator size="small" color="#07111F" />
                      ) : (
                        <>
                          <Text style={[styles.primaryBtnText, { color: '#07111F' }]}>Confirm Booking</Text>
                          <CheckCircle2 size={18} color="#07111F" />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* STEP 5: BOOKING SUCCESS / CONFIRMED */}
            {currentStep === 5 && (
              <View style={styles.stepSection}>
                <GlassCard style={styles.successCard}>
                  <View style={styles.successIconCircle}>
                    <CheckCircle2 size={48} color={Theme.colors.accentGreen} />
                  </View>

                  <Text style={styles.successHeaderTitle}>Booking Confirmed!</Text>
                  <Text style={styles.successHeaderSub}>
                    Your appointment has been registered in the ECOSPHERE network.
                  </Text>

                  <View style={styles.bookingNumberBadge}>
                    <Text style={styles.bookingNumberLabel}>Booking ID</Text>
                    <Text style={styles.bookingNumberValue}>
                      {confirmedBooking?.bookingNumber || confirmedBooking?.id || '#BK-ECO-1506'}
                    </Text>
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.summaryDetailBox}>
                    <Text style={styles.summaryDetailTitle}>{targetService.title}</Text>
                    <Text style={styles.summaryDetailProvider}>{targetService.businessName}</Text>

                    <View style={styles.summaryRow}>
                      <Calendar size={14} color={Theme.colors.primary} />
                      <Text style={styles.summaryText}>
                        {new Date(selectedDateStr).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Clock size={14} color={Theme.colors.accentPurple} />
                      <Text style={styles.summaryText}>{selectedTimeSlot}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <DollarSign size={14} color={Theme.colors.accentGreen} />
                      <Text style={styles.summaryText}>₹{totalPrice.toLocaleString('en-IN')} (Paid via UPI)</Text>
                    </View>
                  </View>

                  <View style={styles.successActionsRow}>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => {
                        if (onViewBooking && confirmedBooking) {
                          onViewBooking(confirmedBooking.id);
                        } else if (onNavigateHome) {
                          onNavigateHome();
                        }
                      }}
                    >
                      <Text style={styles.secondaryBtnText}>View Booking</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.primaryBtn, { flex: 1, marginLeft: 12 }]}
                      onPress={onNavigateHome || onBack}
                    >
                      <LinearGradient
                        colors={[Theme.colors.primary, '#00A8FF']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientBtn}
                      >
                        <Text style={styles.primaryBtnText}>Back to Home</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* CONFLICT ERROR MODAL */}
      {conflictErrorMessage && (
        <Modal visible transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <GlassCard style={styles.modalCard}>
              <AlertTriangle size={36} color="#EF4444" style={{ alignSelf: 'center', marginBottom: 12 }} />
              <Text style={styles.conflictModalTitle}>Time Slot Unavailable</Text>
              <Text style={styles.conflictModalMessage}>{conflictErrorMessage}</Text>

              <TouchableOpacity
                style={styles.modalActionBtn}
                onPress={() => {
                  setConflictErrorMessage(null);
                  setCurrentStep(2); // Redirect back to Date & Time Selection
                }}
              >
                <Text style={styles.modalActionText}>Choose Another Slot</Text>
              </TouchableOpacity>
            </GlassCard>
          </View>
        </Modal>
      )}
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
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#0D1828',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: Theme.colors.primary,
  },
  stepCircleDone: {
    backgroundColor: Theme.colors.accentGreen,
  },
  stepNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  stepNumActive: {
    color: '#07111F',
  },
  stepLabel: {
    fontSize: 10,
    color: '#94A3B8',
  },
  stepLabelActive: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  stepLabelDone: {
    color: Theme.colors.accentGreen,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepSection: {
    flex: 1,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  selectedDateSubtitle: {
    fontSize: 13,
    color: Theme.colors.primary,
    marginBottom: 16,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#94A3B8',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 14,
  },
  descriptionText: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 20,
    marginBottom: 14,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(47, 214, 255, 0.08)',
    padding: 12,
    borderRadius: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  priceVal: {
    fontSize: 20,
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  dateScroll: {
    marginBottom: 12,
  },
  dateCard: {
    width: 66,
    height: 84,
    borderRadius: 16,
    backgroundColor: '#0D1828',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    paddingTop: 4,
  },
  dateCardSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(47, 214, 255, 0.15)',
  },
  todayBadge: {
    position: 'absolute',
    top: 4,
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  todayBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#07111F',
  },
  dayName: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
    marginTop: 6,
  },
  dayNameSelected: {
    color: Theme.colors.primary,
    fontWeight: '700',
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  dayNumSelected: {
    color: Theme.colors.primary,
  },
  monthName: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  monthNameSelected: {
    color: Theme.colors.primary,
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 8,
  },
  slotCategoryHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 10,
    marginTop: 8,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  slotBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#0D1828',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    minWidth: 90,
  },
  slotBtnSelected: {
    borderColor: Theme.colors.primary,
    backgroundColor: 'rgba(47, 214, 255, 0.2)',
  },
  slotBtnDisabled: {
    opacity: 0.4,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  slotText: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  slotTextSelected: {
    color: Theme.colors.primary,
  },
  slotTextDisabled: {
    color: '#64748B',
  },
  bookedBadgeText: {
    fontSize: 9,
    color: '#EF4444',
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 6,
    marginTop: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#07111F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 44,
    color: '#F8FAFC',
    fontSize: 14,
  },
  twoColRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputSimple: {
    backgroundColor: '#07111F',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    color: '#F8FAFC',
    fontSize: 14,
  },
  reviewHeader: {
    marginBottom: 4,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  reviewProvider: {
    fontSize: 13,
    color: Theme.colors.primary,
    marginTop: 2,
  },
  reviewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewDetailText: {
    fontSize: 14,
    color: '#CBD5E1',
    marginLeft: 10,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceRowLabel: {
    fontSize: 14,
    color: '#94A3B8',
  },
  priceRowValue: {
    fontSize: 14,
    color: '#F8FAFC',
    fontWeight: '600',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  totalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.accentGreen,
  },
  paymentGuaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 230, 138, 0.08)',
    padding: 10,
    borderRadius: 10,
  },
  guaranteeText: {
    fontSize: 12,
    color: Theme.colors.accentGreen,
    marginLeft: 8,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  primaryBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  gradientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#07111F',
  },
  secondaryBtn: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#0D1828',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  successCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(37, 230, 138, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  successHeaderSub: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
  },
  bookingNumberBadge: {
    backgroundColor: '#07111F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.3)',
    marginBottom: 10,
  },
  bookingNumberLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  bookingNumberValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.primary,
    marginTop: 2,
  },
  summaryDetailBox: {
    width: '100%',
    backgroundColor: '#07111F',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  summaryDetailTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  summaryDetailProvider: {
    fontSize: 13,
    color: Theme.colors.primary,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryText: {
    fontSize: 13,
    color: '#CBD5E1',
    marginLeft: 8,
  },
  successActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
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
  conflictModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    textAlign: 'center',
    marginBottom: 8,
  },
  conflictModalMessage: {
    fontSize: 14,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActionBtn: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#07111F',
  },
});
