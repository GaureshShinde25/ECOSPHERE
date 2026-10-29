import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  Text,
  ImageStyle,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { getProfileAvatarUrl } from '../../utils/imageFallbacks';
import { Theme } from '../../theme';

interface ProfileImageProps {
  uri?: string | null;
  imageUrl?: string | null;
  name?: string;
  userId?: string;
  size?: number;
  borderRadius?: number;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  showBorder?: boolean;
}

export const ProfileImage: React.FC<ProfileImageProps> = ({
  uri,
  imageUrl,
  name,
  userId,
  size = 48,
  borderRadius,
  style,
  containerStyle,
  showBorder = true,
}) => {
  const initialUri = getProfileAvatarUrl(uri || imageUrl, userId);
  const [currentUri, setCurrentUri] = useState<string>(initialUri);
  const [hasError, setHasError] = useState<boolean>(false);

  const initials = name
    ? name
        .trim()
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'EC';

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setCurrentUri(getProfileAvatarUrl(undefined, userId));
    }
  };

  const computedBorderRadius = borderRadius ?? size / 2;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: computedBorderRadius,
          borderWidth: showBorder ? 1.5 : 0,
          borderColor: Theme.colors.borderLight,
        },
        containerStyle,
      ]}
      accessibilityRole="image"
      accessibilityLabel={name || 'Profile Avatar'}
    >
      {!hasError ? (
        <Image
          source={{ uri: currentUri }}
          style={[styles.image, { borderRadius: computedBorderRadius }, style]}
          resizeMode="cover"
          onError={handleError}
        />
      ) : (
        <View style={[styles.initialsContainer, { borderRadius: computedBorderRadius }]}>
          <Text style={[styles.initialsText, { fontSize: size * 0.38 }]}>
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0C1524',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initialsContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#121F33',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: Theme.colors.primary,
    fontWeight: '700',
    fontFamily: Theme.typography.fontFamily,
  },
});
