import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  ImageStyle,
  StyleProp,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Store } from 'lucide-react-native';
import { getBusinessImages } from '../../utils/imageFallbacks';
import { Theme } from '../../theme';

interface BusinessImageProps {
  type?: 'logo' | 'cover';
  uri?: string | null;
  category?: string;
  id?: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  resizeMode?: 'cover' | 'contain';
  accessibilityLabel?: string;
}

export const BusinessImage: React.FC<BusinessImageProps> = ({
  type = 'cover',
  uri,
  category,
  id,
  style,
  containerStyle,
  borderRadius = type === 'logo' ? 12 : 16,
  resizeMode = 'cover',
  accessibilityLabel = 'Business Image',
}) => {
  const fallbackObj = getBusinessImages(
    type === 'logo' ? uri : undefined,
    type === 'cover' ? uri : undefined,
    category,
    id
  );
  const initialUri = type === 'logo' ? fallbackObj.logo : fallbackObj.cover;
  const [currentUri, setCurrentUri] = useState<string>(initialUri);
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    const updatedFallback = getBusinessImages(
      type === 'logo' ? uri : undefined,
      type === 'cover' ? uri : undefined,
      category,
      id
    );
    setCurrentUri(type === 'logo' ? updatedFallback.logo : updatedFallback.cover);
    setHasError(false);
  }, [uri, type, category, id]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      const fb = getBusinessImages(undefined, undefined, category, id);
      setCurrentUri(type === 'logo' ? fb.logo : fb.cover);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { borderRadius },
        containerStyle,
      ]}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Image
        source={{ uri: currentUri }}
        style={[styles.image, { borderRadius }, style]}
        resizeMode={resizeMode}
        onError={handleError}
      />

      {hasError && !currentUri && (
        <View style={[styles.fallbackContainer, { borderRadius }]}>
          <Store size={type === 'logo' ? 20 : 32} color={Theme.colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0C1524',
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(12, 21, 36, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#101B2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
