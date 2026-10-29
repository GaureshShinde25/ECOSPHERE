import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import { Star, MapPin, CheckCircle2 } from 'lucide-react-native';
import { BusinessImage } from './BusinessImage';
import { Theme } from '../../theme';
import { Business } from '../../types';

interface BusinessCardProps {
  business: Partial<Business> & { id: string; name: string };
  onPress: (business: any) => void;
  style?: StyleProp<ViewStyle>;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({
  business,
  onPress,
  style,
}) => {
  const category = business.category || 'Local Business';
  const locationText =
    business.location?.area ||
    (business as any).area ||
    business.location?.city ||
    (business as any).city ||
    'Local';
  const rating = business.rating || 4.8;
  const isVerified = business.verified !== false;

  return (
    <TouchableOpacity
      activeOpacity={0.88}
      onPress={() => onPress(business)}
      style={[styles.card, style]}
    >
      <View style={styles.coverWrapper}>
        <BusinessImage
          type="cover"
          uri={business.coverUrl}
          category={category}
          id={business.id}
          borderRadius={14}
          style={{ height: 115 }}
        />
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>Open</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <View style={styles.titleRow}>
              <Text style={styles.name} numberOfLines={1}>
                {business.name}
              </Text>
              {isVerified && (
                <CheckCircle2
                  size={14}
                  color={Theme.colors.primary}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
            <Text style={styles.category} numberOfLines={1}>
              {category}
            </Text>
          </View>

          <View style={styles.ratingBox}>
            <Star size={11} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.ratingVal}>{Number(rating).toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.footerRow}>
          <View style={styles.locationRow}>
            <MapPin size={12} color="#94A3B8" />
            <Text style={styles.locationText} numberOfLines={1}>
              {locationText}
            </Text>
          </View>

          <Text style={styles.actionLink}>View Business →</Text>
        </View>
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
    overflow: 'hidden',
    marginBottom: 14,
    width: '100%',
  },
  coverWrapper: {
    position: 'relative',
    padding: 6,
    paddingBottom: 0,
  },
  statusBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16A34A',
  },
  body: {
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#17231B',
    fontFamily: Theme.typography.headingFont,
  },
  category: {
    fontSize: 12,
    color: Theme.colors.emerald,
    fontWeight: '600',
    marginTop: 2,
    fontFamily: Theme.typography.bodyFont,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E4EBE3',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '65%',
  },
  locationText: {
    fontSize: 11,
    color: '#68756B',
    fontFamily: Theme.typography.bodyFont,
  },
  actionLink: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.emerald,
    fontFamily: Theme.typography.bodyFont,
  },
});
