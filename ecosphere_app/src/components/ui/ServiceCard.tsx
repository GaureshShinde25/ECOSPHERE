import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Star, MapPin, Clock, Calendar } from 'lucide-react-native';
import { ServiceImage } from './ServiceImage';
import { Theme } from '../../theme';
import { Service } from '../../types';

interface ServiceCardProps {
  service: Partial<Service> & { id: string; title: string; price: number };
  onPress: (service: any) => void;
  onBookPress?: (service: any) => void;
  style?: StyleProp<ViewStyle>;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  onPress,
  onBookPress,
  style,
}) => {
  const provider = service.providerName || service.businessName || 'Verified Specialist';
  const category = service.category || 'Professional Service';
  const rating = service.rating || 4.8;
  const duration = service.duration || '1 hr';
  const availability = service.availability || 'Available today';
  const location = service.location || service.distance || 'Nearby';

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(service)}
      style={[styles.card, style]}
    >
      <View style={styles.topRow}>
        <View style={styles.imageWrapper}>
          <ServiceImage
            uri={service.imageUrl}
            category={category}
            id={service.id}
            borderRadius={14}
            style={{ width: 85, height: 85 }}
          />
        </View>

        <View style={styles.content}>
          <View style={styles.badgeRow}>
            <Text style={styles.categoryBadge} numberOfLines={1}>
              {category.toUpperCase()}
            </Text>
            <View style={styles.ratingBadge}>
              <Star size={10} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{Number(rating).toFixed(1)}</Text>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {service.title}
          </Text>

          <Text style={styles.providerText} numberOfLines={1}>
            {provider}
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={11} color="#94A3B8" />
              <Text style={styles.metaText} numberOfLines={1}>
                {location}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={11} color="#94A3B8" />
              <Text style={styles.metaText}>{duration}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <View>
          <Text style={styles.availabilityText}>{availability}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.fromText}>from </Text>
            <Text style={styles.currencySymbol}>₹</Text>
            <Text style={styles.priceValue}>
              {service.price ? service.price.toLocaleString('en-IN') : 0}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={(e) => {
            e.stopPropagation?.();
            onBookPress ? onBookPress(service) : onPress(service);
          }}
          style={styles.bookButton}
        >
          <Text style={styles.bookButtonText}>Book</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 12,
    marginBottom: 14,
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
  },
  imageWrapper: {
    width: 85,
    height: 85,
  },
  content: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.emerald,
    letterSpacing: 0.5,
    fontFamily: Theme.typography.fontFamily,
    maxWidth: '70%',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 5,
  },
  ratingText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '700',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17231B',
    marginTop: 2,
    fontFamily: Theme.typography.headingFont,
  },
  providerText: {
    fontSize: 12,
    color: '#68756B',
    fontFamily: Theme.typography.bodyFont,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    fontSize: 11,
    color: '#68756B',
    fontFamily: Theme.typography.bodyFont,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E4EBE3',
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: '600',
    color: Theme.colors.emerald,
    marginBottom: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  fromText: {
    fontSize: 11,
    color: '#68756B',
  },
  currencySymbol: {
    fontSize: 13,
    fontWeight: '700',
    color: Theme.colors.emerald,
    marginRight: 1,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#17231B',
    fontFamily: Theme.typography.fontFamily,
  },
  bookButton: {
    backgroundColor: Theme.colors.emerald,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
});
