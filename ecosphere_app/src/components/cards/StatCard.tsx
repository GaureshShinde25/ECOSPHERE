import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { GlassCard } from './GlassCard';
import { Theme } from '../../theme';
import { TrendingUp, TrendingDown } from 'lucide-react-native';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: {
    percentage: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subValue,
  trend,
  icon,
  style,
}) => {
  return (
    <GlassCard style={[styles.card, style]}>
      <View style={styles.topRow}>
        <Text style={styles.label}>{label}</Text>
        {icon && <View style={styles.iconWrapper}>{icon}</View>}
      </View>

      <Text style={styles.value}>{value}</Text>

      {(subValue || trend) && (
        <View style={styles.bottomRow}>
          {trend && (
            <View style={[
              styles.trendBadge,
              trend.isPositive ? styles.trendPos : styles.trendNeg
            ]}>
              {trend.isPositive ? (
                <TrendingUp size={12} color={Theme.colors.success} />
              ) : (
                <TrendingDown size={12} color={Theme.colors.danger} />
              )}
              <Text style={[
                styles.trendText,
                trend.isPositive ? { color: Theme.colors.success } : { color: Theme.colors.danger }
              ]}>
                {trend.percentage}
              </Text>
            </View>
          )}
          {subValue && <Text style={styles.subValue}>{subValue}</Text>}
        </View>
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: {
    minWidth: 150,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  label: {
    fontSize: Theme.typography.sizes.caption,
    fontWeight: Theme.typography.weights.semibold,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: Theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  value: {
    fontSize: Theme.typography.sizes.heading,
    fontWeight: Theme.typography.weights.bold,
    color: Theme.colors.text,
    fontFamily: Theme.typography.fontFamily,
    marginBottom: Theme.spacing.xs,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.sm,
    marginTop: Theme.spacing.xs,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  trendPos: {
    backgroundColor: 'rgba(37, 230, 138, 0.1)',
    borderColor: 'rgba(37, 230, 138, 0.2)',
  },
  trendNeg: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  trendText: {
    fontSize: Theme.typography.sizes.caption - 2,
    fontWeight: Theme.typography.weights.bold,
  },
  subValue: {
    fontSize: Theme.typography.sizes.caption - 1,
    color: Theme.colors.secondaryText,
    fontFamily: Theme.typography.fontFamily,
  },
});
