import React, { useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Animated,
  Platform,
} from 'react-native';
import {
  Home,
  Compass,
  Sparkles,
  Users,
  User,
} from 'lucide-react-native';
import { Theme } from '../../theme';

interface BottomNavigationProps {
  currentScreen: string;
  onTabPress: (screenName: string) => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentScreen,
  onTabPress,
}) => {
  const scaleHome = useRef(new Animated.Value(1)).current;
  const scaleExplore = useRef(new Animated.Value(1)).current;
  const scaleAi = useRef(new Animated.Value(1)).current;
  const scaleCommunity = useRef(new Animated.Value(1)).current;
  const scaleProfile = useRef(new Animated.Value(1)).current;

  const animateTab = (animValue: Animated.Value) => {
    Animated.sequence([
      Animated.timing(animValue, {
        toValue: 0.88,
        duration: 80,
        useNativeDriver: true,
      }),
      Animated.spring(animValue, {
        toValue: 1.08,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(animValue, {
        toValue: 1,
        duration: 80,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleTabPress = (screenName: string, animValue: Animated.Value) => {
    animateTab(animValue);
    onTabPress(screenName);
  };

  const isHomeActive = currentScreen === 'Home';
  const isExploreActive = ['Explore', 'Search', 'SearchResults', 'CategoryDiscovery'].includes(currentScreen);
  const isAiActive = currentScreen === 'AiScreen';
  const isCommunityActive = ['Community', 'Social'].includes(currentScreen);
  const isProfileActive = ['Profile', 'Me'].includes(currentScreen);

  const activeColor = Theme.colors.emerald; // #16A34A
  const inactiveColor = Theme.colors.secondaryText; // #68756B

  return (
    <View style={styles.outerWrapper} pointerEvents="box-none">
      <View style={styles.dockContainer}>
        {/* 1. HOME */}
        <TouchableOpacity
          onPress={() => handleTabPress('Home', scaleHome)}
          activeOpacity={0.7}
          style={styles.tab}
          accessibilityRole="tab"
          accessibilityState={{ selected: isHomeActive }}
          accessibilityLabel="Home tab"
        >
          <Animated.View style={[styles.iconBox, { transform: [{ scale: scaleHome }] }]}>
            <Home
              size={21}
              color={isHomeActive ? activeColor : inactiveColor}
              strokeWidth={isHomeActive ? 2.5 : 2}
            />
          </Animated.View>
          <Text style={[styles.label, isHomeActive && styles.labelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* 2. EXPLORE */}
        <TouchableOpacity
          onPress={() => handleTabPress('Explore', scaleExplore)}
          activeOpacity={0.7}
          style={styles.tab}
          accessibilityRole="tab"
          accessibilityState={{ selected: isExploreActive }}
          accessibilityLabel="Explore tab"
        >
          <Animated.View style={[styles.iconBox, { transform: [{ scale: scaleExplore }] }]}>
            <Compass
              size={21}
              color={isExploreActive ? activeColor : inactiveColor}
              strokeWidth={isExploreActive ? 2.5 : 2}
            />
          </Animated.View>
          <Text style={[styles.label, isExploreActive && styles.labelActive]}>
            Explore
          </Text>
        </TouchableOpacity>

        {/* 3. AI (Center Feature Orb) */}
        <TouchableOpacity
          onPress={() => handleTabPress('AiScreen', scaleAi)}
          activeOpacity={0.8}
          style={styles.aiTab}
          accessibilityRole="tab"
          accessibilityState={{ selected: isAiActive }}
          accessibilityLabel="AI Assistant tab"
        >
          <Animated.View
            style={[
              styles.aiOrb,
              isAiActive && styles.aiOrbActive,
              { transform: [{ scale: scaleAi }] },
            ]}
          >
            <Sparkles
              size={20}
              color={isAiActive ? '#FFFFFF' : activeColor}
              strokeWidth={2.4}
            />
          </Animated.View>
          <Text style={[styles.label, isAiActive && styles.labelActive]}>
            AI
          </Text>
        </TouchableOpacity>

        {/* 4. SOCIAL */}
        <TouchableOpacity
          onPress={() => handleTabPress('Community', scaleCommunity)}
          activeOpacity={0.7}
          style={styles.tab}
          accessibilityRole="tab"
          accessibilityState={{ selected: isCommunityActive }}
          accessibilityLabel="Social Community tab"
        >
          <Animated.View style={[styles.iconBox, { transform: [{ scale: scaleCommunity }] }]}>
            <Users
              size={21}
              color={isCommunityActive ? activeColor : inactiveColor}
              strokeWidth={isCommunityActive ? 2.5 : 2}
            />
          </Animated.View>
          <Text style={[styles.label, isCommunityActive && styles.labelActive]}>
            Social
          </Text>
        </TouchableOpacity>

        {/* 5. ME */}
        <TouchableOpacity
          onPress={() => handleTabPress('Profile', scaleProfile)}
          activeOpacity={0.7}
          style={styles.tab}
          accessibilityRole="tab"
          accessibilityState={{ selected: isProfileActive }}
          accessibilityLabel="Me profile tab"
        >
          <Animated.View style={[styles.iconBox, { transform: [{ scale: scaleProfile }] }]}>
            <User
              size={21}
              color={isProfileActive ? activeColor : inactiveColor}
              strokeWidth={isProfileActive ? 2.5 : 2}
            />
          </Animated.View>
          <Text style={[styles.label, isProfileActive && styles.labelActive]}>
            Me
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  dockContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 68,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Theme.colors.border, // #E4EBE3
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
      },
      default: {
        shadowColor: '#17231B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
      },
    }),
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 48,
    paddingVertical: 4,
  },
  iconBox: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiTab: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: 48,
    paddingVertical: 2,
  },
  aiOrb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Theme.colors.aiSurface, // #F7F4FF
    borderWidth: 1.5,
    borderColor: Theme.colors.aiBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiOrbActive: {
    backgroundColor: Theme.colors.emerald, // #16A34A
    borderColor: Theme.colors.emerald,
    ...Platform.select({
      ios: {
        shadowColor: Theme.colors.emerald,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  label: {
    fontSize: 11,
    color: Theme.colors.secondaryText, // #68756B
    fontFamily: Theme.typography.bodyFont,
    marginTop: 3,
    fontWeight: '500',
  },
  labelActive: {
    color: Theme.colors.emerald, // #16A34A
    fontWeight: '700',
  },
});

export default BottomNavigation;
