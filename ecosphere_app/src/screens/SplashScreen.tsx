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
} from 'react-native';
import { Theme } from '../theme';

interface SplashScreenProps {
  onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const { width, height } = useWindowDimensions();

  // Animation values
  const bgFade = useRef(new Animated.Value(0)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const artOpacity = useRef(new Animated.Value(0)).current;
  const artTranslateY = useRef(new Animated.Value(24)).current;
  const bottomOpacity = useRef(new Animated.Value(0)).current;
  const pillScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Entrance animation sequence
    Animated.parallel([
      // Background fade-in
      Animated.timing(bgFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),

      // Logo entrance
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),

      // Splash ecosystem artwork entrance (fills lower region)
      Animated.sequence([
        Animated.delay(180),
        Animated.parallel([
          Animated.timing(artOpacity, {
            toValue: 1,
            duration: 800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(artTranslateY, {
            toValue: 0,
            duration: 800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]),

      // Bottom progress indicator entrance
      Animated.sequence([
        Animated.delay(350),
        Animated.timing(bottomOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 2. Subtle pulse loop on progress pill
    const pillLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pillScale, {
          toValue: 1.15,
          duration: 750,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pillScale, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pillLoop.start();

    // 3. Complete splash transition (~2.8s)
    const timer = setTimeout(() => {
      onFinish();
    }, 2800);

    return () => {
      clearTimeout(timer);
      pillLoop.stop();
    };
  }, [onFinish]);

  // Responsive calculations
  const maxLogoWidth = Math.min(width * 0.72, 290);
  const maxLogoHeight = maxLogoWidth * (910 / 1254);
  const maxTaglineWidth = Math.min(width * 0.62, 250);
  const maxTaglineHeight = maxTaglineWidth * (135 / 1254);
  const artHeight = Math.min(height * 0.44, 380);

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      <Animated.View style={[styles.mainLayout, { opacity: bgFade }]}>
        {/* Upper Region: Centered ECOSPHERE Brand & Logo */}
        <SafeAreaView style={styles.topSafeArea}>
          <View style={styles.upperRegion}>
            <Animated.View
              style={[
                styles.logoContainer,
                {
                  opacity: logoOpacity,
                  transform: [{ scale: logoScale }],
                },
              ]}
            >
              <Image
                source={require('../../assets/logos/ecosphere-logo-mark.png')}
                style={{
                  width: maxLogoWidth,
                  height: maxLogoHeight,
                }}
                resizeMode="contain"
              />
            </Animated.View>

            <Animated.View
              style={[
                styles.taglineContainer,
                {
                  opacity: logoOpacity,
                },
              ]}
            >
              <Image
                source={require('../../assets/logos/ecosphere-logo-tagline.png')}
                style={{
                  width: maxTaglineWidth,
                  height: maxTaglineHeight,
                }}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
        </SafeAreaView>

        {/* Lower Portion: splash-ecosystem.png Artwork */}
        <Animated.View
          style={[
            styles.lowerArtworkContainer,
            {
              height: artHeight,
              opacity: artOpacity,
              transform: [{ translateY: artTranslateY }],
            },
          ]}
        >
          <Image
            source={require('../../assets/images/splash/splash-ecosystem.png')}
            style={styles.splashArtImage}
            resizeMode="cover"
          />
          {/* Subtle gradient overlay to merge artwork smoothly with soft white top */}
          <View style={styles.artTopGradient} />
        </Animated.View>

        {/* Bottom Loading Indicator & Supporting Subtitle */}
        <SafeAreaView style={styles.bottomSafeArea}>
          <Animated.View style={[styles.bottomContent, { opacity: bottomOpacity }]}>
            <View style={styles.indicatorTrack}>
              <Animated.View
                style={[
                  styles.activePill,
                  { transform: [{ scaleX: pillScale }] },
                ]}
              />
              <View style={styles.dot} />
              <View style={styles.dot} />
            </View>

            <Text style={styles.supportingText}>
              The operating system for local economies
            </Text>
          </Animated.View>
        </SafeAreaView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF7', // Soft white background
  },
  mainLayout: {
    flex: 1,
    justifyContent: 'space-between',
  },
  topSafeArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upperRegion: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? 36 : 20,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  taglineContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  lowerArtworkContainer: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  splashArtImage: {
    width: '100%',
    height: '100%',
  },
  artTopGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 30,
    backgroundColor: 'rgba(248, 250, 247, 0.4)',
  },
  bottomSafeArea: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  bottomContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  indicatorTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activePill: {
    width: 22,
    height: 5,
    borderRadius: 3,
    backgroundColor: Theme.colors.emerald, // #16A34A
    marginHorizontal: 3,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Theme.colors.border, // #E4EBE3
    marginHorizontal: 3,
  },
  supportingText: {
    fontSize: 12,
    color: Theme.colors.secondaryText, // #68756B
    fontFamily: Theme.typography.bodyFont,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});
