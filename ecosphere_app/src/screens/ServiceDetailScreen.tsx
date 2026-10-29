import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  TextInput,
} from 'react-native';
import { ArrowLeft, Star, MapPin, Clock, Calendar, CheckCircle2, ShieldCheck, DollarSign, Heart } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Service, Booking } from '../types';
import { GlassCard } from '../components/cards/GlassCard';
import { Modal } from '../components/common/Modal';
import { ServiceImage } from '../components/ui/ServiceImage';
import { serviceService } from '../services/serviceService';
import { favoriteService } from '../services/favoriteService';
import { Theme } from '../theme';

interface ServiceDetailScreenProps {
  service?: Service;
  onBack: () => void;
  onBookNow?: (service: Service) => void;
}

export const ServiceDetailScreen: React.FC<ServiceDetailScreenProps> = ({ service, onBack, onBookNow }) => {
  const targetService: Service = service || {
    id: 'srv_001',
    businessId: 'biz_002',
    businessName: 'VoltCraft Electricals',
    providerName: 'Vikram Singh (Master Electrician)',
    title: 'Smart Home Automation & Wiring Inspection',
    description: 'Comprehensive electrical diagnostics, load testing, and IoT smart switch panel installation with 90-day service warranty.',
    price: 1499,
    duration: '2 Hours',
    category: 'Electrical Services',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
    rating: 4.9,
    reviewsCount: 184,
    distance: '1.2 km',
    location: 'Hinjewadi Phase 1',
    availability: 'Available Today (Slot: 3:00 PM)',
  };

  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingDate, setBookingDate] = useState('2026-08-28');
  const [bookingTime, setBookingTime] = useState('03:00 PM');
  const [bookingAddress, setBookingAddress] = useState('Flat 402, Highstreet Towers, Hinjewadi Phase 1');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  React.useEffect(() => {
    favoriteService.isFavorite('service', targetService.id).then(setIsFavorite);
  }, [targetService.id]);

  const handleToggleFavorite = async () => {
    const nextState = await favoriteService.toggleFavorite('service', targetService.id, isFavorite);
    setIsFavorite(nextState);
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    const bk = await serviceService.bookService(
      targetService.id,
      bookingDate,
      bookingTime,
      bookingAddress
    );
    setIsSubmitting(false);
    setConfirmedBooking(bk);
    setBookingModalVisible(false);
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
          <Text style={styles.headerTitle}>Service Details</Text>
          <TouchableOpacity onPress={handleToggleFavorite} style={styles.backBtn} activeOpacity={0.7}>
            <Heart size={20} color={isFavorite ? '#EF4444' : '#FFFFFF'} fill={isFavorite ? '#EF4444' : 'transparent'} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ServiceImage
            imageUrl={targetService.imageUrl}
            category={targetService.category}
            style={styles.heroImage}
          />

          <GlassCard style={styles.infoCard}>
            <View style={styles.categoryRow}>
              <Text style={styles.categoryText}>{targetService.category}</Text>
              <View style={styles.ratingBadge}>
                <Star size={12} color="#F59E0B" fill="#F59E0B" />
                <Text style={styles.ratingText}>{targetService.rating}</Text>
                <Text style={styles.reviewText}>({targetService.reviewsCount})</Text>
              </View>
            </View>

            <Text style={styles.title}>{targetService.title}</Text>
            <Text style={styles.providerName}>Provided by {targetService.providerName}</Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <MapPin size={14} color={Theme.colors.primary} />
                <Text style={styles.metaText}>{targetService.distance}</Text>
              </View>

              <View style={styles.metaItem}>
                <Clock size={14} color={Theme.colors.purple} />
                <Text style={styles.metaText}>{targetService.duration}</Text>
              </View>

              <View style={styles.metaItem}>
                <ShieldCheck size={14} color={Theme.colors.success} />
                <Text style={styles.metaText}>Verified Provider</Text>
              </View>
            </View>
          </GlassCard>

          {/* Active Booking Confirmation Card */}
          {confirmedBooking && (
            <GlassCard style={styles.bookingSuccessCard}>
              <View style={styles.successRow}>
                <CheckCircle2 size={24} color={Theme.colors.success} />
                <View>
                  <Text style={styles.successTitle}>Booking Confirmed!</Text>
                  <Text style={styles.successSub}>
                    {confirmedBooking.date} at {confirmedBooking.time}
                  </Text>
                </View>
              </View>
            </GlassCard>
          )}

          {/* Description */}
          <Text style={styles.sectionTitle}>About This Service</Text>
          <GlassCard style={styles.descCard}>
            <Text style={styles.descText}>{targetService.description}</Text>
          </GlassCard>

          {/* Price & CTA Bar */}
          <View style={styles.priceCtaBar}>
            <View>
              <Text style={styles.priceLabel}>Service Price</Text>
              <Text style={styles.priceValue}>₹{targetService.price}</Text>
            </View>

            <TouchableOpacity
              onPress={() => {
                if (onBookNow) {
                  onBookNow(targetService);
                } else {
                  setBookingModalVisible(true);
                }
              }}
              activeOpacity={0.85}
              style={styles.bookBtn}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bookGradient}
              >
                <Text style={styles.bookText}>
                  {confirmedBooking ? 'Book Again' : 'Book Service'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Booking Modal */}
        <Modal
          visible={bookingModalVisible}
          title="Schedule Service Booking"
          onClose={() => setBookingModalVisible(false)}
        >
          <Text style={styles.inputLabel}>Select Date</Text>
          <TextInput
            style={styles.input}
            value={bookingDate}
            onChangeText={setBookingDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Theme.colors.secondaryText}
          />

          <Text style={styles.inputLabel}>Select Time Slot</Text>
          <TextInput
            style={styles.input}
            value={bookingTime}
            onChangeText={setBookingTime}
            placeholder="e.g. 03:00 PM"
            placeholderTextColor={Theme.colors.secondaryText}
          />

          <Text style={styles.inputLabel}>Service Location Address</Text>
          <TextInput
            style={styles.input}
            value={bookingAddress}
            onChangeText={setBookingAddress}
            placeholder="Enter your address..."
            placeholderTextColor={Theme.colors.secondaryText}
          />

          <View style={styles.priceBreakdown}>
            <Text style={styles.breakdownLabel}>Total Payable</Text>
            <Text style={styles.breakdownValue}>₹{targetService.price}</Text>
          </View>

          <TouchableOpacity
            onPress={handleConfirmBooking}
            activeOpacity={0.85}
            disabled={isSubmitting}
            style={[styles.confirmBtn, isSubmitting && { opacity: 0.6 }]}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmGradient}
            >
              <Text style={styles.confirmText}>
                {isSubmitting ? 'Confirming...' : 'Confirm Booking'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070D18',
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
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: 20,
    marginBottom: 16,
  },
  infoCard: {
    padding: 18,
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Theme.typography.fontFamily,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
    fontFamily: Theme.typography.fontFamily,
  },
  reviewText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    fontFamily: Theme.typography.fontFamily,
  },
  providerName: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    marginBottom: 14,
    fontFamily: Theme.typography.fontFamily,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  bookingSuccessCard: {
    padding: 16,
    marginBottom: 16,
    borderColor: 'rgba(37, 230, 138, 0.3)',
    backgroundColor: 'rgba(37, 230, 138, 0.08)',
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Theme.colors.success,
    fontFamily: Theme.typography.fontFamily,
  },
  successSub: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 10,
  },
  descCard: {
    padding: 16,
    marginBottom: 24,
  },
  descText: {
    fontSize: 14,
    color: Theme.colors.secondaryText,
    lineHeight: 22,
    fontFamily: Theme.typography.fontFamily,
  },
  priceCtaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 24, 40, 0.9)',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  priceLabel: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  priceValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.success,
    fontFamily: Theme.typography.fontFamily,
  },
  bookBtn: {
    width: 140,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
  },
  bookGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookText: {
    color: '#07111F',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 6,
    fontFamily: Theme.typography.fontFamily,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 14,
  },
  priceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  breakdownLabel: {
    fontSize: 14,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  breakdownValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Theme.colors.success,
    fontFamily: Theme.typography.fontFamily,
  },
  confirmBtn: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 10,
  },
  confirmGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmText: {
    color: '#07111F',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily,
  },
});
