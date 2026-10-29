import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Image,
  ImageStyle,
  StyleProp,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { Wrench } from 'lucide-react-native';
import { getServiceImageUrl } from '../../utils/imageFallbacks';
import { Theme } from '../../theme';

interface ServiceImageProps {
  uri?: string | null;
  imageUrl?: string | null;
  category?: string;
  id?: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  borderRadius?: number;
  resizeMode?: 'cover' | 'contain';
  accessibilityLabel?: string;
}

export const ServiceImage: React.FC<ServiceImageProps> = ({
  uri,
  imageUrl,
  category,
  id,
  style,
  containerStyle,
  borderRadius = 14,
  resizeMode = 'cover',
  accessibilityLabel = 'Service Image',
}) => {
  const initialUri = getServiceImageUrl(uri || imageUrl, category, id);
  const [currentUri, setCurrentUri] = useState<string>(initialUri);
  const [hasError, setHasError] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setCurrentUri(getServiceImageUrl(undefined, category, id));
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
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={handleError}
      />

      {loading && (
        <View style={[styles.loadingOverlay, { borderRadius }]}>
          <ActivityIndicator size="small" color={Theme.colors.primary} />
        </View>
      )}

      {hasError && !currentUri && (
        <View style={[styles.fallbackContainer, { borderRadius }]}>
          <Wrench size={24} color={Theme.colors.primary} />
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
