import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { GlassCard } from './GlassCard';
import { Theme } from '../../theme';
import { Star, MapPin } from 'lucide-react-native';

interface BusinessCardProps {
  name: string;
  description: string;
  category: string;
  location: string;
  rating: number;
  activeJobsCount?: number;
  onPress: () => void;
  style?: ViewStyle;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({
  name,
  description,
  category,
  location,
  rating,
  activeJobsCount,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={style}>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{category.toUpperCase()}</Text>
          </View>
          <View style={styles.ratingContainer}>
            <Star size={14} color={Theme.colors.orange} fill={Theme.colors.orange} />
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        </View>

        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>

        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View style={styles.locationContainer}>
            <MapPin size={14} color={Theme.colors.secondaryText} />
            <Text style={styles.locationText} numberOfLines={1}>
              {location}
            </Text>
          </View>
          {activeJobsCount !== undefined && activeJobsCount > 0 && (
            <Text style={styles.jobsText}>
              {activeJobsCount} Active {activeJobsCount === 1 ? 'Job' : 'Jobs'}
            </Text>
          )}
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  badge: {
    backgroundColor: 'rgba(47, 214, 255, 0.12)',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.2)',
  },
  badgeText: {
    fontSize: Theme.typography.sizes.caption - 2,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    fontFamily: Theme.typography.fontFamily,
  },
  name: {
    fontSize: Theme.typography.sizes.subtitle,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    fontFamily: Theme.typography.fontFamily,
    marginBottom: Theme.spacing.xs,
  },
  description: {
    fontSize: Theme.typography.sizes.body - 1,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
    lineHeight: 18,
    marginBottom: Theme.spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: Theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  jobsText: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.success,
    fontFamily: Theme.typography.fontFamily,
  },
});
