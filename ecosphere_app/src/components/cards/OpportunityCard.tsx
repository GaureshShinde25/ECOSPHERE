import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { GlassCard } from './GlassCard';
import { Theme } from '../../theme';
import { MapPin, TrendingUp, Sparkles, ChevronRight, Award } from 'lucide-react-native';

interface OpportunityCardProps {
  title: string;
  category: string;
  location: string;
  reward?: string;
  rewardType?: string;
  statusTag?: string;
  decisionScore?: number;
  confidence?: 'HIGH' | 'MEDIUM' | 'LOW';
  growthPercent?: number;
  reason?: string;
  onPress: () => void;
  style?: ViewStyle;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  title,
  category,
  location,
  reward = 'High Demand',
  rewardType = 'fixed',
  statusTag,
  decisionScore = 86,
  confidence = 'HIGH',
  growthPercent = 25.0,
  reason,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88} style={style}>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.category}>{category.toUpperCase()}</Text>
          <View style={styles.badgeRow}>
            {decisionScore > 0 && (
              <View style={styles.scorePill}>
                <Award size={12} color={Theme.colors.primary} />
                <Text style={styles.scoreText}>SCORE {decisionScore}</Text>
              </View>
            )}
            {confidence && (
              <View style={[styles.confidencePill, confidence === 'HIGH' ? styles.confHigh : styles.confMed]}>
                <Text style={styles.confText}>{confidence}</Text>
              </View>
            )}
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <MapPin size={14} color={Theme.colors.secondaryText} />
            <Text style={styles.metaText} numberOfLines={1}>
              {location}
            </Text>
          </View>

          {growthPercent !== undefined && (
            <View style={styles.metaItem}>
              <TrendingUp size={14} color={Theme.colors.success} />
              <Text style={styles.growthText}>+{growthPercent}% WoW</Text>
            </View>
          )}
        </View>

        {reason && (
          <View style={styles.reasonBox}>
            <Sparkles size={12} color={Theme.colors.primary} style={{ marginTop: 2 }} />
            <Text style={styles.reasonText} numberOfLines={2}>
              {reason}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.footer}>
          <View>
            <Text style={styles.rewardLabel}>COMMUNITY VALUE</Text>
            <Text style={styles.rewardValue}>{reward}</Text>
          </View>
          <View style={styles.ctaButton}>
            <Text style={styles.ctaText}>Explore</Text>
            <ChevronRight size={14} color="#FFFFFF" />
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: Theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  category: {
    fontSize: Theme.typography.sizes.caption - 2,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.primary,
    letterSpacing: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(47, 214, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.25)',
  },
  scoreText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  confidencePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  confHigh: {
    backgroundColor: 'rgba(37, 230, 138, 0.15)',
  },
  confMed: {
    backgroundColor: 'rgba(255, 179, 0, 0.15)',
  },
  confText: {
    fontSize: 9,
    fontWeight: '800',
    color: Theme.colors.success,
  },
  title: {
    fontSize: Theme.typography.sizes.body,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    marginBottom: Theme.spacing.xs,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.xs,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.secondaryText,
  },
  growthText: {
    fontSize: Theme.typography.sizes.caption,
    color: Theme.colors.success,
    fontWeight: Theme.typography.weights.bold,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(13, 24, 40, 0.6)',
    padding: 8,
    borderRadius: 6,
    marginBottom: Theme.spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  reasonText: {
    fontSize: 11,
    color: Theme.colors.secondaryText,
    flex: 1,
    lineHeight: 15,
  },
  divider: {
    height: 1,
    backgroundColor: Theme.colors.border,
    marginVertical: Theme.spacing.xs,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  rewardLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Theme.colors.secondaryText,
    letterSpacing: 0.5,
  },
  rewardValue: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#07111F',
  },
});
