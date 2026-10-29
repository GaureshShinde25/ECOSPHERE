import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { ArrowLeft } from 'lucide-react-native';

interface AuthHeaderProps {
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({
  onBack,
  title,
  subtitle,
  showLogo = true,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {onBack ? (
          <TouchableOpacity
            onPress={onBack}
            activeOpacity={0.7}
            style={styles.backButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={20} color="#17231B" />
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        {showLogo && (
          <View style={styles.logoWrapper}>
            <Image
              source={require('../../../assets/logos/ecosphere-logo-mark.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
        )}

        <View style={styles.backPlaceholder} />
      </View>

      {(title || subtitle) && (
        <View style={styles.textContainer}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 12 : 16,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4EBE3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPlaceholder: {
    width: 44,
    height: 44,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 120,
    height: 38,
  },
  textContainer: {
    marginTop: 18,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#17231B',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: '#68756B',
    marginTop: 6,
    lineHeight: 20,
  },
});
