import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { OpportunityItem } from '../services/opportunityService';

interface OpportunityCardProps {
  opportunity: OpportunityItem;
  onPress?: (opportunity: OpportunityItem) => void;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, onPress }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'JOB':
        return colors.primary;
      case 'SERVICE':
        return colors.accentGreen;
      case 'DEMAND':
        return colors.warning;
      case 'COLLABORATION':
        return colors.purple;
      default:
        return colors.primary;
    }
  };

  const typeColor = getTypeColor(opportunity.type);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.typeBadge, { backgroundColor: `${typeColor}18`, borderColor: `${typeColor}40` }]}>
          <Text style={[styles.typeText, { color: typeColor }]}>✦ {opportunity.type}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Opportunity Score</Text>
          <View style={styles.scorePill}>
            <Text style={styles.scoreValue}>{opportunity.score}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.title} numberOfLines={1}>
        {opportunity.title}
      </Text>

      <Text style={styles.description} numberOfLines={2}>
        {opportunity.description}
      </Text>

      <View style={styles.reasonBox}>
        <Text style={styles.reasonIcon}>💡</Text>
        <Text style={styles.reasonText} numberOfLines={2}>
          {opportunity.reason}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.actionButton, { borderColor: `${typeColor}60` }]}
        onPress={() => onPress && onPress(opportunity)}
        activeOpacity={0.8}
      >
        <Text style={[styles.actionButtonText, { color: typeColor }]}>Explore Opportunity</Text>
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
    borderColor: 'rgba(47, 214, 255, 0.18)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreLabel: {
    fontSize: 11,
    color: colors.secondaryText,
  },
  scorePill: {
    backgroundColor: 'rgba(37, 230, 138, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(37, 230, 138, 0.3)',
  },
  scoreValue: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.accentGreen,
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
    backgroundColor: 'rgba(7, 17, 31, 0.6)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 14,
    gap: 8,
  },
  reasonIcon: {
    fontSize: 12,
    marginTop: 2,
  },
  reasonText: {
    flex: 1,
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  actionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
