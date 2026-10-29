import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { PersonalizedRecommendationItem } from '../services/recommendationService';

interface RecommendationCardProps {
  recommendation: PersonalizedRecommendationItem;
  onPress?: (recommendation: PersonalizedRecommendationItem) => void;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({ recommendation, onPress }) => {
  const { opportunity, matchQuality, reasons } = recommendation;

  const getMatchBadgeStyle = (quality: string) => {
    switch (quality) {
      case 'Strong Match':
        return { bg: 'rgba(37, 230, 138, 0.18)', border: 'rgba(37, 230, 138, 0.4)', text: colors.accentGreen };
      case 'Good Match':
        return { bg: 'rgba(47, 214, 255, 0.18)', border: 'rgba(47, 214, 255, 0.4)', text: colors.primary };
      default:
        return { bg: 'rgba(139, 92, 246, 0.18)', border: 'rgba(139, 92, 246, 0.4)', text: colors.purple };
    }
  };

  const badgeStyle = getMatchBadgeStyle(matchQuality);
  const primaryReason = reasons[0] || opportunity.reason;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={[styles.matchBadge, { backgroundColor: badgeStyle.bg, borderColor: badgeStyle.border }]}>
          <Text style={[styles.matchBadgeText, { color: badgeStyle.text }]}>✦ {matchQuality}</Text>
        </View>
        <Text style={styles.typeText}>{opportunity.type}</Text>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {opportunity.title}
      </Text>

      <Text style={styles.description} numberOfLines={2}>
        {opportunity.description}
      </Text>

      <View style={styles.reasonBox}>
        <Text style={styles.sparkleIcon}>✨</Text>
        <Text style={styles.reasonText} numberOfLines={2}>
          {primaryReason}
        </Text>
      </View>

      {recommendation.feedbackEvidence && recommendation.feedbackEvidence.confidence !== 'INSUFFICIENT_EVIDENCE' && (
        <View style={styles.feedbackChip}>
          <Text style={styles.feedbackChipIcon}>✓</Text>
          <Text style={styles.feedbackChipText} numberOfLines={1}>
            {recommendation.feedbackBoost && recommendation.feedbackBoost > 0 ? 'Strong local outcome evidence' : 'Observed transaction activity'}
            {` • ${recommendation.feedbackEvidence.geographicScope}`}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => onPress && onPress(recommendation)}
        activeOpacity={0.8}
      >
        <Text style={styles.actionBtnText}>View Recommendation</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0D1828',
    borderRadius: 14,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(37, 230, 138, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  matchBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  matchBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  typeText: {
    fontSize: 11,
    color: colors.secondaryText,
    fontWeight: '600',
    letterSpacing: 0.6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: colors.secondaryText,
    lineHeight: 18,
    marginBottom: 12,
  },
  reasonBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(37, 230, 138, 0.06)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(37, 230, 138, 0.15)',
    marginBottom: 14,
    gap: 8,
  },
  sparkleIcon: {
    fontSize: 12,
    marginTop: 2,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  feedbackChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(47, 214, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.25)',
    marginBottom: 12,
    gap: 6,
  },
  feedbackChipIcon: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '800',
  },
  feedbackChipText: {
    fontSize: 11,
    color: '#E0F2FE',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  actionBtn: {
    backgroundColor: 'rgba(37, 230, 138, 0.12)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(37, 230, 138, 0.3)',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentGreen,
    letterSpacing: 0.3,
  },
});
