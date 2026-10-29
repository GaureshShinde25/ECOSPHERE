import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  ViewStyle,
  StyleProp,
} from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height: height as any,
          borderRadius,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
};

export const ProductCardSkeleton: React.FC = () => {
  return (
    <View style={styles.productCard}>
      <Skeleton width="100%" height={130} borderRadius={14} />
      <View style={{ marginTop: 10 }}>
        <Skeleton width="40%" height={10} borderRadius={4} />
        <View style={{ height: 6 }} />
        <Skeleton width="85%" height={14} borderRadius={4} />
        <View style={{ height: 6 }} />
        <Skeleton width="60%" height={11} borderRadius={4} />
        <View style={{ height: 10 }} />
        <View style={styles.rowBetween}>
          <Skeleton width="35%" height={16} borderRadius={4} />
          <Skeleton width="45" height={26} borderRadius={8} />
        </View>
      </View>
    </View>
  );
};

export const BusinessCardSkeleton: React.FC = () => {
  return (
    <View style={styles.businessCard}>
      <Skeleton width="100%" height={120} borderRadius={14} />
      <View style={{ padding: 12 }}>
        <View style={styles.row}>
          <Skeleton width={44} height={44} borderRadius={10} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Skeleton width="70%" height={15} borderRadius={4} />
            <View style={{ height: 6 }} />
            <Skeleton width="40%" height={11} borderRadius={4} />
          </View>
        </View>
      </View>
    </View>
  );
};

export const JobCardSkeleton: React.FC = () => {
  return (
    <View style={styles.jobCard}>
      <View style={styles.row}>
        <Skeleton width={42} height={42} borderRadius={10} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Skeleton width="65%" height={15} borderRadius={4} />
          <View style={{ height: 6 }} />
          <Skeleton width="45%" height={12} borderRadius={4} />
        </View>
      </View>
      <View style={{ height: 12 }} />
      <View style={styles.rowBetween}>
        <Skeleton width="40%" height={13} borderRadius={4} />
        <Skeleton width="30%" height={13} borderRadius={4} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E5EBE4',
  },
  productCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 10,
    marginBottom: 14,
  },
  businessCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    overflow: 'hidden',
    marginBottom: 14,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4EBE3',
    padding: 14,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
