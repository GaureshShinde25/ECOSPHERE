import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
  SafeAreaView,
  StatusBar,
  Platform,
} from 'react-native';
import { ArrowRight, ChevronLeft } from 'lucide-react-native';
import { Theme } from '../theme';

const { width, height } = Dimensions.get('window');

export interface OnboardingSlide {
  id: string;
  image: any;
  heading: string;
  copy: string;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'slide-1',
    image: require('../../assets/images/onboarding/onboarding-local-marketplace.png'),
    heading: 'Support Local Businesses',
    copy: 'Discover and grow local businesses in your community.',
  },
  {
    id: 'slide-2',
    image: require('../../assets/images/onboarding/onboarding-opportunities.png'),
    heading: 'Find Opportunities',
    copy: 'Explore jobs, gigs, services and business opportunities around you.',
  },
  {
    id: 'slide-3',
    image: require('../../assets/images/onboarding/onboarding-circular-economy.png'),
    heading: 'Build Stronger Communities',
    copy: 'Connect, collaborate and create sustainable local economies.',
  },
];

interface OnboardingScreenProps {
  onNext: () => void;
  onSkip?: () => void;
  onBack?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onNext,
  onSkip,
  onBack,
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const flatListRef = useRef<Animated.FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  const handleNextSlide = () => {
    if (isLastSlide) {
      onNext();
    } else {
      const nextIdx = currentIndex + 1;
      (flatListRef.current as any)?.scrollToIndex({ index: nextIdx, animated: true });
      setCurrentIndex(nextIdx);
    }
  };

  const handlePrevSlide = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      (flatListRef.current as any)?.scrollToIndex({ index: prevIdx, animated: true });
      setCurrentIndex(prevIdx);
    } else if (onBack) {
      onBack();
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onNext();
    }
  };

  const onScrollEvent = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleMomentumScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const renderSlideItem = ({ item }: { item: OnboardingSlide }) => {
    return (
      <View style={styles.slideItem}>
        {/* Card Artwork Container */}
        <View style={styles.artworkContainer}>
          <Image
            source={item.image}
            style={styles.slideImage}
            resizeMode="cover"
          />
        </View>

        {/* Text Container */}
        <View style={styles.textContainer}>
          <Text style={styles.headingText}>{item.heading}</Text>
          <Text style={styles.copyText}>{item.copy}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />

      {/* Top Navigation Row: Back (if >0) & Skip */}
      <View style={styles.topBar}>
        {currentIndex > 0 ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={handlePrevSlide}
            activeOpacity={0.7}
            accessibilityLabel="Back to previous slide"
          >
            <ChevronLeft size={20} color={Theme.colors.primaryText} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.placeholder} />
        )}

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
          accessibilityLabel="Skip onboarding"
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Sliding Content */}
      <Animated.FlatList
        ref={flatListRef as any}
        data={ONBOARDING_SLIDES}
        renderItem={renderSlideItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScrollEvent}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        bounces={false}
        scrollEventThrottle={16}
        style={styles.flatList}
      />

      {/* Bottom Controls Area: Pagination Dots & Action Button */}
      <View style={styles.bottomControlsArea}>
        {/* Pagination Indicators */}
        <View style={styles.paginationRow}>
          {ONBOARDING_SLIDES.map((_, index) => {
            const isActive = currentIndex === index;
            return (
              <View
                key={index}
                style={[
                  styles.dot,
                  isActive ? styles.dotActive : styles.dotInactive,
                ]}
              />
            );
          })}
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.primaryActionButton}
          onPress={handleNextSlide}
          activeOpacity={0.85}
          accessibilityLabel={isLastSlide ? 'Get Started' : 'Next slide'}
        >
          <Text style={styles.actionButtonText}>
            {isLastSlide ? 'Get Started' : 'Continue'}
          </Text>
          <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} style={styles.buttonIcon} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#F8FAF7', // Main background
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 10,
    height: 60,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 44,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
    color: Theme.colors.secondaryText, // #68756B
    fontFamily: Theme.typography.bodyFont,
    fontWeight: '500',
    marginLeft: 2,
  },
  placeholder: {
    width: 44,
    height: 44,
  },
  skipButton: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
  },
  skipButtonText: {
    fontSize: 14,
    color: Theme.colors.secondaryText, // #68756B
    fontFamily: Theme.typography.bodyFont,
    fontWeight: '600',
  },
  flatList: {
    flex: 1,
  },
  slideItem: {
    width,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 20,
  },
  artworkContainer: {
    width: width - 48,
    height: Math.min(height * 0.46, 360),
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Theme.colors.border, // #E4EBE3
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
      },
      android: {
        elevation: 3,
      },
      default: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
      },
    }),
  },
  slideImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    width: '100%',
    paddingTop: 24,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  headingText: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.colors.primaryText, // #17231B
    fontFamily: Theme.typography.headingFont,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 10,
  },
  copyText: {
    fontSize: 14,
    color: Theme.colors.secondaryText, // #68756B
    fontFamily: Theme.typography.bodyFont,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  bottomControlsArea: {
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 24 : 20,
    paddingTop: 12,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
    backgroundColor: Theme.colors.emerald, // #16A34A
  },
  dotInactive: {
    width: 6,
    backgroundColor: Theme.colors.border, // #E4EBE3
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Theme.colors.emerald, // #16A34A
    height: 52,
    borderRadius: 16,
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.emerald,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: Theme.typography.headingFont,
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default OnboardingScreen;
