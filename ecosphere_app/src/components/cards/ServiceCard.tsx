import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image } from 'react-native';
import { Star, MapPin, Clock } from 'lucide-react-native';
import { Service } from '../../types';
import { GlassCard } from './GlassCard';
import { Theme } from '../../theme';

interface ServiceCardProps {
  service: Service;
  onPress: (service: Service) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service, onPress }) => {
  return (
    <GlassCard style={styles.card}>
      <TouchableOpacity activeOpacity={0.8} onPress={() => onPress(service)}>
        <Image source={{ uri: service.imageUrl }} style={styles.image} />
        
        <View style={styles.content}>
          <View style={styles.categoryRow}>
            <Text style={styles.categoryText}>{service.category}</Text>
            <View style={styles.ratingBox}>
              <Star size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.ratingText}>{service.rating}</Text>
            </View>
          </View>

          <Text style={styles.title} numberOfLines={1}>
            {service.title}
          </Text>
          
          <Text style={styles.providerName}>{service.providerName}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <MapPin size={12} color={Theme.colors.primary} />
              <Text style={styles.metaText}>{service.distance}</Text>
            </View>
            <View style={styles.metaItem}>
              <Clock size={12} color={Theme.colors.purple} />
              <Text style={styles.metaText}>{service.duration}</Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.priceLabel}>Starting from</Text>
            <Text style={styles.priceValue}>₹{service.price}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
    marginBottom: 14,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 140,
  },
  content: {
    padding: 14,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontFamily: Theme.typography.fontFamily,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
    fontFamily: Theme.typography.fontFamily,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
    fontFamily: Theme.typography.fontFamily,
  },
  providerName: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    marginBottom: 10,
    fontFamily: Theme.typography.fontFamily,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  priceLabel: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Theme.colors.success,
    fontFamily: Theme.typography.fontFamily,
  },
});
