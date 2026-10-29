import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Sparkles, ArrowRight, TrendingUp } from 'lucide-react-native';
import { AIInsight } from '../../types';
import { GlassCard } from './GlassCard';
import { Theme } from '../../theme';

interface AIInsightCardProps {
  insight: AIInsight;
  onExplore?: () => void;
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({ insight, onExplore }) => {
  return (
    <GlassCard style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.badge}>
          <Sparkles size={12} color={Theme.colors.primary} />
          <Text style={styles.badgeText}>AI Opportunity</Text>
        </View>

        <View style={styles.growthBadge}>
          <TrendingUp size={12} color={Theme.colors.success} />
          <Text style={styles.growthText}>+{insight.growthPercentage}% Demand</Text>
        </View>
      </View>

      <Text style={styles.title}>{insight.title}</Text>
      <Text style={styles.description}>{insight.description}</Text>

      <View style={styles.actionRow}>
        <Text style={styles.scoreText}>Opportunity Score: <Text style={styles.scoreValue}>{insight.opportunityScore}/100</Text></Text>
        
        {onExplore && (
          <TouchableOpacity onPress={onExplore} style={styles.ctaButton} activeOpacity={0.7}>
            <Text style={styles.ctaText}>Explore Opportunity</Text>
            <ArrowRight size={14} color={Theme.colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Theme.colors.aiBorder,
    backgroundColor: Theme.colors.aiSurface,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.aiAccent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.aiText,
    fontFamily: Theme.typography.fontFamily,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Theme.colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  growthText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.success,
    fontFamily: Theme.typography.fontFamily,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: Theme.colors.text,
    marginBottom: 6,
    fontFamily: Theme.typography.fontFamily,
  },
  description: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    lineHeight: 18,
    marginBottom: 14,
    fontFamily: Theme.typography.fontFamily,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.aiBorder,
  },
  scoreText: {
    fontSize: 12,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  scoreValue: {
    fontWeight: '800',
    color: Theme.colors.primary,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.primary,
    fontFamily: Theme.typography.fontFamily,
  },
});
