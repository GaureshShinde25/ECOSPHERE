import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Animated,
  StatusBar,
  SafeAreaView,
  useWindowDimensions,
  Platform,
  Easing,
  ScrollView,
} from 'react-native';
import Svg, { Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { Users, Compass, Store, TrendingUp } from 'lucide-react-native';
import { AuthButton } from '../components/auth/AuthButton';

interface WelcomeScreenProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGetStarted,
  onLogin,
}) => {
  const { width, height } = useWindowDimensions();

  // Sequential entrance animations
  const bgFade = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.94)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(18)).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const buttonsSlide = useRef(new Animated.Value(18)).current;

  // Atmospheric glow pulse
  const glowPulse = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    Animated.parallel([
      // 1. Background appears
      Animated.timing(bgFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),

      // 2. Logo fades/scales in
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 650,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      // 3. Tagline appears
      Animated.sequence([
        Animated.delay(180),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      // 4. Value pillars appear
      Animated.sequence([
        Animated.delay(320),
        Animated.parallel([
          Animated.timing(contentOpacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(contentSlide, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),

      // 5. Buttons appear
      Animated.sequence([
        Animated.delay(480),
        Animated.parallel([
          Animated.timing(buttonsOpacity, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(buttonsSlide, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();

    // Subtle glow loop
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.65,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    return () => {
      glowLoop.stop();
    };
  }, []);

  const maxLogoWidth = Math.min(width * 0.62, 260);
  const maxLogoHeight = maxLogoWidth * (910 / 1254);

  const maxTaglineWidth = Math.min(width * 0.58, 240);
  const maxTaglineHeight = maxTaglineWidth * (135 / 1254);

  return (
    <View style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Atmospheric Background Layer */}
      <Animated.View style={[styles.atmosphereLayer, { opacity: bgFade }]}>
        <Animated.View
          style={[
            styles.radialGlow,
            {
              width: width * 1.1,
              height: width * 1.1,
              opacity: glowPulse,
            },
          ]}
        />

        <View style={styles.lowerWaveContainer}>
          <Svg width={width} height={height * 0.35} viewBox="0 0 400 240" fill="none">
            <Defs>
              <SvgLinearGradient id="welcomeWaveGrad" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor="#2FD6FF" stopOpacity="0.0" />
                <Stop offset="35%" stopColor="#25E68A" stopOpacity="0.16" />
                <Stop offset="70%" stopColor="#2FD6FF" stopOpacity="0.14" />
                <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
              </SvgLinearGradient>
              <SvgLinearGradient id="welcomeWaveFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#25E68A" stopOpacity="0.04" />
                <Stop offset="100%" stopColor="#040814" stopOpacity="0.0" />
              </SvgLinearGradient>
            </Defs>

            <Path
              d="M-20 180 C 80 120, 160 210, 260 150 C 330 110, 380 160, 420 140"
              stroke="url(#welcomeWaveGrad)"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              fill="none"
            />
            <Path
              d="M-30 200 C 60 140, 180 190, 280 130 C 350 90, 390 140, 440 120"
              stroke="url(#welcomeWaveGrad)"
              strokeWidth="1.2"
              fill="none"
            />
            <Path
              d="M-30 200 C 60 140, 180 190, 280 130 C 350 90, 390 140, 440 120 L440 240 L-30 240 Z"
              fill="url(#welcomeWaveFill)"
            />
          </Svg>
        </View>
      </Animated.View>

      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Top Brand Group */}
          <View style={styles.brandGroup}>
            <Animated.View
              style={[
                styles.logoWrapper,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                },
              ]}
            >
              <Image
                source={require('../../assets/logos/ecosphere-logo-mark.png')}
                style={{ width: maxLogoWidth, height: maxLogoHeight }}
                resizeMode="contain"
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.taglineWrapper,
                {
                  opacity: taglineOpacity,
                },
              ]}
            >
              <Image
                source={require('../../assets/logos/ecosphere-logo-tagline.png')}
                style={{ width: maxTaglineWidth, height: maxTaglineHeight }}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Value Pillars Section */}
          <Animated.View
            style={[
              styles.valueCard,
              {
                opacity: contentOpacity,
                transform: [{ translateY: contentSlide }],
              },
            ]}
          >
            <View style={styles.pillarRow}>
              <View style={[styles.iconBadge, { backgroundColor: 'rgba(47, 214, 255, 0.12)' }]}>
                <Users size={18} color="#2FD6FF" />
              </View>
              <Text style={styles.pillarText}>Connect with people.</Text>
            </View>

            <View style={styles.pillarRow}>
              <View style={[styles.iconBadge, { backgroundColor: 'rgba(37, 230, 138, 0.12)' }]}>
                <Compass size={18} color="#25E68A" />
              </View>
              <Text style={styles.pillarText}>Discover opportunities.</Text>
            </View>

            <View style={styles.pillarRow}>
              <View style={[styles.iconBadge, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                <Store size={18} color="#8B5CF6" />
              </View>
              <Text style={styles.pillarText}>Find local businesses.</Text>
            </View>

            <View style={styles.pillarRow}>
              <View style={[styles.iconBadge, { backgroundColor: 'rgba(37, 230, 138, 0.12)' }]}>
                <TrendingUp size={18} color="#25E68A" />
              </View>
              <Text style={styles.pillarText}>Work, earn and grow locally.</Text>
            </View>
          </Animated.View>

          {/* Bottom Dual CTAs */}
          <Animated.View
            style={[
              styles.buttonGroup,
              {
                opacity: buttonsOpacity,
                transform: [{ translateY: buttonsSlide }],
              },
            ]}
          >
            <AuthButton
              title="GET STARTED"
              onPress={onGetStarted}
              variant="primary"
              style={styles.primaryBtn}
            />

            <AuthButton
              title="I ALREADY HAVE AN ACCOUNT"
              onPress={onLogin}
              variant="secondary"
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7', // Soft white background
  },
  atmosphereLayer: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radialGlow: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  lowerWaveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 24 : 36,
    paddingBottom: Platform.OS === 'ios' ? 20 : 32,
  },
  brandGroup: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  taglineWrapper: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EBE3',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginVertical: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 4px 16px rgba(23, 35, 27, 0.06)',
      },
    }),
  },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  pillarText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#17231B',
    letterSpacing: 0.2,
  },
  buttonGroup: {
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtn: {
    marginBottom: 12,
  },
});
