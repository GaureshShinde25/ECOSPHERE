import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { MapPin, Navigation, ArrowRight, ShieldCheck, Zap } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard } from '../components/cards/GlassCard';
import { Theme } from '../theme';

interface LocationPermissionScreenProps {
  onEnableLocation: () => void;
  onManualLocation: () => void;
}

export default function LocationPermissionScreen({
  onEnableLocation,
  onManualLocation,
}: LocationPermissionScreenProps) {
  const benefits = [
    'Nearby businesses & verified local sellers',
    'Hyper-local employment & job openings',
    'On-demand technical & home services',
    'Real-time economic opportunity alerts',
    'Personalized AI recommendation engine',
  ];

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <MapPin size={48} color={Theme.colors.primary} />
          </View>

          <Text style={styles.title}>Your City Is Your Ecosystem</Text>
          <Text style={styles.subtitle}>
            ECOSPHERE uses your location to connect you with hyper-local commerce, employment, and economic intelligence.
          </Text>

          <GlassCard style={styles.benefitsCard}>
            <Text style={styles.benefitsHeader}>WHAT YOU UNLOCK</Text>
            {benefits.map((benefit, idx) => (
              <View key={idx} style={styles.benefitRow}>
                <View style={styles.dot}>
                  <Zap size={10} color={Theme.colors.success} />
                </View>
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </GlassCard>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              onPress={onEnableLocation}
              activeOpacity={0.85}
              style={styles.enableButton}
            >
              <LinearGradient
                colors={['#25E68A', '#2FD6FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
              >
                <Navigation size={18} color="#07111F" />
                <Text style={styles.enableText}>Enable Location</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onManualLocation}
              activeOpacity={0.7}
              style={styles.manualButton}
            >
              <Text style={styles.manualText}>Choose Location Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07111F',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(47, 214, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(47, 214, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: Theme.colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: Theme.typography.fontFamily,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    fontFamily: Theme.typography.fontFamily,
  },
  benefitsCard: {
    width: '100%',
    padding: 20,
    marginBottom: 32,
  },
  benefitsHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.primary,
    letterSpacing: 1,
    marginBottom: 14,
    fontFamily: Theme.typography.fontFamily,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(37, 230, 138, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: Theme.typography.fontFamily,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  enableButton: {
    width: '100%',
    height: 56,
    borderRadius: 18,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  enableText: {
    color: '#07111F',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Theme.typography.fontFamily,
  },
  manualButton: {
    width: '100%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualText: {
    color: Theme.colors.secondaryText,
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Theme.typography.fontFamily,
  },
});
