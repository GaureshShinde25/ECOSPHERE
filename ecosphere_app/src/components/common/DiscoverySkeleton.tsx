import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated, ViewStyle } from 'react-native';
import { GlassCard } from '../cards/GlassCard';

interface DiscoverySkeletonProps {
  type?: 'card' | 'row' | 'carousel' | 'chip' | 'header';
  count?: number;
  style?: ViewStyle;
}

export const DiscoverySkeleton: React.FC<DiscoverySkeletonProps> = ({
  type = 'card',
  count = 1,
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const renderSingle = (index: number) => {
    switch (type) {
      case 'header':
        return (
          <View key={index} style={[styles.headerWrapper, style]}>
            <Animated.View style={[styles.skeletonBlock, { width: 140, height: 24, opacity: pulseAnim }]} />
            <Animated.View style={[styles.skeletonBlock, { width: 220, height: 14, marginTop: 8, opacity: pulseAnim }]} />
          </View>
        );

      case 'chip':
        return (
          <View key={index} style={[styles.chipWrapper, style]}>
            <Animated.View style={[styles.skeletonBlock, styles.chipBlock, { opacity: pulseAnim }]} />
          </View>
        );

      case 'row':
        return (
          <GlassCard key={index} style={[styles.rowCard, style]}>
            <Animated.View style={[styles.skeletonBlock, styles.rowThumb, { opacity: pulseAnim }]} />
            <View style={styles.rowTextCol}>
              <Animated.View style={[styles.skeletonBlock, { width: '70%', height: 16, opacity: pulseAnim }]} />
              <Animated.View style={[styles.skeletonBlock, { width: '40%', height: 12, marginTop: 8, opacity: pulseAnim }]} />
              <Animated.View style={[styles.skeletonBlock, { width: '90%', height: 12, marginTop: 8, opacity: pulseAnim }]} />
            </View>
          </GlassCard>
        );

      case 'carousel':
        return (
          <View key={index} style={[styles.carouselCard, style]}>
            <GlassCard style={{ padding: 0, overflow: 'hidden' }}>
              <Animated.View style={[styles.skeletonBlock, { width: 220, height: 120, opacity: pulseAnim }]} />
              <View style={{ padding: 12 }}>
                <Animated.View style={[styles.skeletonBlock, { width: 120, height: 14, opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonBlock, { width: 80, height: 12, marginTop: 6, opacity: pulseAnim }]} />
              </View>
            </GlassCard>
          </View>
        );

      case 'card':
      default:
        return (
          <GlassCard key={index} style={[styles.cardWrapper, style]}>
            <Animated.View style={[styles.skeletonBlock, styles.cardImage, { opacity: pulseAnim }]} />
            <View style={styles.cardContent}>
              <View style={styles.badgeRow}>
                <Animated.View style={[styles.skeletonBlock, { width: 70, height: 12, opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonBlock, { width: 50, height: 12, opacity: pulseAnim }]} />
              </View>
              <Animated.View style={[styles.skeletonBlock, { width: '85%', height: 18, marginTop: 8, opacity: pulseAnim }]} />
              <Animated.View style={[styles.skeletonBlock, { width: '55%', height: 13, marginTop: 6, opacity: pulseAnim }]} />
              <View style={styles.cardFooter}>
                <Animated.View style={[styles.skeletonBlock, { width: 80, height: 20, opacity: pulseAnim }]} />
                <Animated.View style={[styles.skeletonBlock, { width: 60, height: 28, borderRadius: 8, opacity: pulseAnim }]} />
              </View>
            </View>
          </GlassCard>
        );
    }
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => renderSingle(i))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  skeletonBlock: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
  },
  headerWrapper: {
    marginBottom: 16,
  },
  chipWrapper: {
    marginRight: 8,
  },
  chipBlock: {
    width: 90,
    height: 38,
    borderRadius: 20,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 12,
  },
  rowThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  rowTextCol: {
    flex: 1,
    marginLeft: 14,
  },
  carouselCard: {
    width: 220,
    marginRight: 14,
  },
  cardWrapper: {
    padding: 0,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 130,
    borderRadius: 0,
  },
  cardContent: {
    padding: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
});
